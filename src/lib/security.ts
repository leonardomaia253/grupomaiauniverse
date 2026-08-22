import crypto from "crypto";
import { NextResponse } from "next/server";
import { getCronSecret, requireEnv } from "@/lib/env";

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export function requireBearerToken(
  authHeader: string | null,
  expectedSecret: string,
): NextResponse | null {
  const expected = `Bearer ${expectedSecret}`;
  const actual = authHeader ?? "";

  if (!timingSafeEqualString(actual, expected)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null;
}

export function requireCronRequest(authHeader: string | null): NextResponse | null {
  return requireBearerToken(authHeader, getCronSecret());
}

export function getUnsubscribeHmacSecret(): string {
  return process.env.UNSUBSCRIBE_HMAC_SECRET || requireEnv("CRON_SECRET");
}

export function requireSameOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get("origin");
  const expectedOrigin = new URL(request.url).origin;
  if (!origin || origin !== expectedOrigin) {
    return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  return null;
}
