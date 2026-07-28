import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);
const MAX_IMAGE_DIMENSION = 4096;

function readUint16BE(bytes: Uint8Array, offset: number): number {
  return (bytes[offset] << 8) | bytes[offset + 1];
}

function readUint16LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8);
}

function readUint24LE(bytes: Uint8Array, offset: number): number {
  return bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
}

function getImageInfo(bytes: Uint8Array): { type: string; width?: number; height?: number } | null {
  if (
    bytes.length >= 24 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return {
      type: "image/png",
      width: readUint16BE(bytes, 16) * 65536 + readUint16BE(bytes, 18),
      height: readUint16BE(bytes, 20) * 65536 + readUint16BE(bytes, 22),
    };
  }

  if (bytes.length >= 10 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
    return {
      type: "image/gif",
      width: readUint16LE(bytes, 6),
      height: readUint16LE(bytes, 8),
    };
  }

  if (
    bytes.length >= 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    if (bytes[12] === 0x56 && bytes[13] === 0x50 && bytes[14] === 0x38 && bytes[15] === 0x58) {
      return {
        type: "image/webp",
        width: readUint24LE(bytes, 24) + 1,
        height: readUint24LE(bytes, 27) + 1,
      };
    }
    return { type: "image/webp" };
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) return { type: "image/jpeg" };
      const marker = bytes[offset + 1];
      const length = readUint16BE(bytes, offset + 2);
      if (length < 2) return null;
      if (marker >= 0xc0 && marker <= 0xc3) {
        return {
          type: "image/jpeg",
          height: readUint16BE(bytes, offset + 5),
          width: readUint16BE(bytes, offset + 7),
        };
      }
      offset += 2 + length;
    }
    return { type: "image/jpeg" };
  }

  return null;
}

export async function POST(request: Request) {
  // Auth required
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const companyLogin = (
    user.user_metadata?.user_name ??
    user.user_metadata?.preferred_username ??
    ""
  ).toLowerCase();

  if (!companyLogin) {
    return NextResponse.json(
      { error: "No GitHub login found" },
      { status: 400 }
    );
  }

  const sb = getSupabaseAdmin();

  // Validate company
  const { data: dev } = await sb
    .from("companies")
    .select("id, claimed, claimed_by")
    .eq("username", companyLogin)
    .single();

  if (!dev || !dev.claimed || dev.claimed_by !== user.id) {
    return NextResponse.json(
      { error: "planet not found or not yours" },
      { status: 403 }
    );
  }

  // Count completed billboard purchases
  const { count: billboardCount } = await sb
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("company_id", dev.id)
    .eq("item_id", "billboard")
    .eq("status", "completed");

  if (!billboardCount || billboardCount === 0) {
    return NextResponse.json(
      { error: "You don't own the billboard item" },
      { status: 403 }
    );
  }

  // Parse FormData
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Invalid form data" },
      { status: 400 }
    );
  }

  const file = formData.get("file") as File | null;
  const slotIndexRaw = formData.get("slot_index");
  const slotIndex = slotIndexRaw !== null ? parseInt(slotIndexRaw as string, 10) : 0;

  if (isNaN(slotIndex) || slotIndex < 0) {
    return NextResponse.json(
      { error: "Invalid slot_index" },
      { status: 400 }
    );
  }

  if (slotIndex >= billboardCount) {
    return NextResponse.json(
      { error: `Invalid slot_index (you have ${billboardCount} billboard slots)` },
      { status: 400 }
    );
  }

  if (!file || !(file instanceof File)) {
    return NextResponse.json(
      { error: "No file provided" },
      { status: 400 }
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Invalid file type. Use PNG, JPEG, WebP, or GIF." },
      { status: 400 }
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json(
      { error: "File too large (max 2 MB)" },
      { status: 400 }
    );
  }

  // Upload file (overwrite on re-upload)
  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const filePath = `${dev.id}_${slotIndex}.${ext}`;
  const fileBuffer = await file.arrayBuffer();
  const bytes = new Uint8Array(fileBuffer);
  const imageInfo = getImageInfo(bytes);

  if (!imageInfo || imageInfo.type !== file.type) {
    return NextResponse.json(
      { error: "File contents do not match the declared image type" },
      { status: 400 }
    );
  }

  if (
    (imageInfo.width && imageInfo.width > MAX_IMAGE_DIMENSION) ||
    (imageInfo.height && imageInfo.height > MAX_IMAGE_DIMENSION)
  ) {
    return NextResponse.json(
      { error: `Image dimensions are too large (max ${MAX_IMAGE_DIMENSION}px)` },
      { status: 400 }
    );
  }

  const { error: uploadError } = await sb.storage
    .from("billboards")
    .upload(filePath, fileBuffer, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }

  // Get public URL
  const { data: urlData } = sb.storage
    .from("billboards")
    .getPublicUrl(filePath);

  const imageUrl = urlData.publicUrl;

  // Read existing config to build images array
  const { data: existingConfig } = await sb
    .from("company_customizations")
    .select("config")
    .eq("company_id", dev.id)
    .eq("item_id", "billboard")
    .maybeSingle();

  let images: string[] = [];
  if (existingConfig) {
    const cfg = existingConfig.config as Record<string, unknown>;
    if (Array.isArray(cfg?.images)) {
      images = [...(cfg.images as string[])];
    } else if (typeof cfg?.image_url === "string") {
      // Migrate legacy single image to array
      images = [cfg.image_url];
    }
  }

  // Extend array if needed and set the slot
  while (images.length <= slotIndex) {
    images.push("");
  }
  images[slotIndex] = imageUrl;

  // Upsert customization with images array
  const { error: upsertError } = await sb
    .from("company_customizations")
    .upsert(
      {
        company_id: dev.id,
        item_id: "billboard",
        config: { images },
      },
      { onConflict: "company_id,item_id" }
    );

  if (upsertError) {
    console.error("Upsert error:", upsertError);
    return NextResponse.json(
      { error: "Failed to save customization" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, image_url: imageUrl, slot_index: slotIndex, images });
}

