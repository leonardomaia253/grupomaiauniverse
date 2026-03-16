import type { MetadataRoute } from "next";
import { getSupabaseAdmin } from "@/lib/supabase";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ??
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://universe.grupomaia.me");

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let companies: { username: string; last_active_at: string | null }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from("companies")
      .select("username, last_active_at")
      .order("rank", { ascending: true, nullsFirst: false });
    companies = data ?? [];
  }

  const devEntries: MetadataRoute.Sitemap = (companies ?? []).map((dev) => ({
    url: `${BASE_URL}/dev/${dev.username}`,
    lastModified: dev.last_active_at ?? undefined,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/leaderboard`,
      changeFrequency: "hourly",
      priority: 0.8,
    },
    ...devEntries,
  ];
}
