# Security Audit — Grupo Maia Universe

Date: 2026-08-21

## Scope

- Next.js application and Proxy/Middleware
- Public and authenticated API routes
- Supabase access layer, migrations, RLS and Edge Functions
- Authentication, account deletion and extension API keys
- Stripe and Resend webhooks
- Advertising checkout, setup and administration
- Notifications and HTML email generation
- Dependency and secret scanning
- Security headers, CSRF and local non-destructive endpoint tests

## Confirmed findings and remediation

### Critical — Publicly readable bearer credentials and private company columns

The public `companies` SELECT policy applied to every column added by later migrations. Migration `037_vscode_key_plaintext.sql` also reintroduced recoverable VS Code bearer keys after an earlier hardening migration removed them.

Remediation:

- Removed the plaintext key column.
- API keys are now rotated, shown once and stored only as SHA-256 hashes.
- Restricted anon/authenticated SELECT grants to an explicit public column allowlist.
- Restricted `sky_ads` public columns to prevent exposure of purchaser email, Stripe identifiers and tracking tokens.
- Replaced the public `/api/dev/[username]` wildcard projection with an explicit safe projection.

### High — Vulnerable production dependency chain

Initial audit: 10 production vulnerabilities — 1 critical, 5 high and 4 moderate. Affected packages included Next.js, tar, sharp, postcss, ws, nanoid, Resend, Supabase, Svix and UUID.

Remediation: upgraded compatible dependencies and applied lockfile audit fixes. Final `npm audit --omit=dev`: 0 vulnerabilities.

### High — Forged Resend webhook events

The route checked only for the presence of `svix-signature`; it never cryptographically verified the payload and allowed unsigned processing when the secret was absent.

Remediation:

- Fail closed when `RESEND_WEBHOOK_SECRET` is missing.
- Verify Svix id, timestamp and signature against the raw request body with the Resend SDK.
- Enforce a 1 MB payload limit.
- Add database-backed event idempotency.

### High — Stored HTML injection in notification emails

Digest event title/body and generic stat values could reach HTML templates without escaping.

Remediation: HTML-escape all event text and stat values before interpolation.

### High — CSRF on cookie-authenticated mutations

Sensitive route handlers relied on session cookies without independently requiring a same-origin mutation.

Remediation: explicit Origin validation added to account deletion, claims, notification changes, admin ad mutations, API-key rotation and sign-out.

### Moderate — Per-instance checkout/setup throttling

Checkout and campaign setup used only an in-memory rate limiter even when distributed Upstash rate limiting was configured.

Remediation: both routes now use the distributed limiter with safe local fallback.

### Moderate — Incomplete browser isolation policy

The application had HSTS, frame and MIME protections but no CSP or cross-origin isolation headers.

Remediation: added CSP, frame ancestors, object/base/form restrictions, COOP and CORP while retaining required Supabase, Vercel, media and Himetrica connectivity.

### Moderate — Stale owner policies

A hardening migration referenced the obsolete `developers` table in two owner policies.

Remediation: added a corrective migration using `public.companies` and `auth.uid()`.

## Controls verified

- Stripe webhook signature verification and event idempotency.
- Administrative routes verify both Supabase session and owner login server-side.
- Admin proxy restricts forwarding to the configured Supabase origin and approved service paths.
- Heartbeat API hashes bearer keys, validates payloads and caps batch size and active seconds.
- Unsubscribe links use HMAC verification.
- No committed private keys, Stripe secrets, Supabase service keys or admin secrets were detected.
- RLS is enabled on reviewed sensitive tables; service-only event/session tables deny direct public reads.

## Local active test results

- Missing Origin on protected mutations: rejected with 403.
- Valid same-origin but unauthenticated mutations: rejected with 401/403.
- Unsigned Stripe webhook: rejected with 400.
- Unconfigured/unsigned Resend webhook: failed closed with 503/401.
- Security headers returned on the rendered application: CSP, HSTS and DENY framing confirmed.
- Production build: passed for all 27 application pages.
- TypeScript, ESLint and application validation tests: passed.

## Deployment actions required

1. Apply the three new Supabase migrations before considering the database exposure fixed.
2. Configure `RESEND_WEBHOOK_SECRET` from the Resend webhook signing secret; the webhook intentionally returns 503 until configured.
3. Redeploy the Next.js application so dependency, CSP and server-route changes take effect.
4. Rotate every previously issued VS Code API key because plaintext values may have been exposed before this fix.
5. Rotate sensitive credentials if production logs or access history indicate unexpected Supabase REST enumeration.

## Residual limitations

This was a source-level and local non-destructive audit. It did not attack the production hostname, mutate production data, inspect live Supabase grants after migration application, test third-party account configuration, or perform external infrastructure scanning. Those checks require an explicitly authorized staging target and production access logs.
