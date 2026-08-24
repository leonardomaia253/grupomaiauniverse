import "server-only";

export type EnvironmentIssue = {
  name: string;
  reason: string;
};

const productionRequired = [
  "NEXT_PUBLIC_BASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "ADMIN_EMAILS",
  "ADMIN_PROXY_SECRET",
  "CRON_SECRET",
  "UNSUBSCRIBE_HMAC_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "HEALTHCHECK_TOKEN",
] as const;

const secretNames = new Set([
  "ADMIN_PROXY_SECRET",
  "CRON_SECRET",
  "UNSUBSCRIBE_HMAC_SECRET",
  "UPSTASH_REDIS_REST_TOKEN",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "HEALTHCHECK_TOKEN",
]);

const placeholderPattern = /(your-|replace-|example|changeme|placeholder)/i;

export function getEnvironmentIssues(env: NodeJS.ProcessEnv = process.env): EnvironmentIssue[] {
  const issues: EnvironmentIssue[] = [];

  for (const name of productionRequired) {
    const value = env[name]?.trim();
    if (!value) {
      issues.push({ name, reason: "missing" });
      continue;
    }
    if (placeholderPattern.test(value)) {
      issues.push({ name, reason: "placeholder value" });
      continue;
    }
    if (secretNames.has(name) && value.length < 16) {
      issues.push({ name, reason: "secret is too short" });
    }
  }

  for (const name of ["NEXT_PUBLIC_BASE_URL", "NEXT_PUBLIC_SUPABASE_URL"] as const) {
    const value = env[name];
    if (!value) continue;
    try {
      const parsed = new URL(value);
      if (env.NODE_ENV === "production" && parsed.protocol !== "https:") {
        issues.push({ name, reason: "must use HTTPS in production" });
      }
    } catch {
      issues.push({ name, reason: "invalid URL" });
    }
  }

  return issues;
}

export function assertProductionEnvironment(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production" || env.SKIP_ENV_VALIDATION === "true") return;
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") return;
  const issues = getEnvironmentIssues(env);
  if (issues.length > 0) {
    const summary = issues.map(({ name, reason }) => `${name}: ${reason}`).join(", ");
    throw new Error(`Invalid production environment: ${summary}`);
  }
}
