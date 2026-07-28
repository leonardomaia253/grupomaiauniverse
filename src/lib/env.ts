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
  return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
}

export function getSupabaseAnonKey(): string {
  const key = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY").trim();
  if (/your-anon-key/i.test(key)) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY contains a placeholder value");
  }
  return key;
}

export function getAdminProxySecret(): string {
  return requireEnv("ADMIN_PROXY_SECRET");
}

export function getCronSecret(): string {
  return requireEnv("CRON_SECRET");
}
