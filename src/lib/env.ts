/**
 * Environment helpers for secrets and public configuration.
 *
 * Secrets must fail closed. A production app should never silently keep running
 * with placeholder credentials because that turns misconfiguration into a
 * security incident.
 */

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(`${name} is not set`);
  }
  return value;
}

export function getPublicSupabaseUrl(): string {
  // Next.js only substitutes NEXT_PUBLIC_* values in browser bundles when the
  // property access is statically analyzable. Do not route these through the
  // dynamic requireEnv(name) lookup.
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value || value.trim().length === 0) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not set");
  }
  return value;
}

export function getSupabaseAnonKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!value || value.trim().length === 0) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY is not set");
  }
  const key = value.trim();
  if (/your-anon-key/i.test(key)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY contains a placeholder value");
  }
  return key;
}

export function hasPublicSupabaseConfig(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  );
}

export function getAdminProxySecret(): string {
  return requireEnv("ADMIN_PROXY_SECRET");
}

export function getCronSecret(): string {
  return requireEnv("CRON_SECRET");
}
