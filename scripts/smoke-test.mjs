import assert from "node:assert/strict";

const baseUrl = (process.env.TEST_BASE_URL || "http://127.0.0.1:3001").replace(/\/$/, "");

async function request(path, init = {}) {
  return fetch(`${baseUrl}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(15_000),
    ...init,
  });
}

const home = await request("/");
assert.ok(home.status >= 200 && home.status < 400, `home returned ${home.status}`);
for (const header of [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
]) {
  assert.ok(home.headers.get(header), `missing security header: ${header}`);
}

const live = await request("/api/health/live");
assert.equal(live.status, 200, `liveness returned ${live.status}`);
assert.equal((await live.json()).status, "ok");

const ready = await request("/api/health/ready");
assert.equal(ready.status, 401, "readiness must require its bearer token");

if (process.env.HEALTHCHECK_TOKEN) {
  const authenticatedReady = await request("/api/health/ready", {
    headers: { Authorization: `Bearer ${process.env.HEALTHCHECK_TOKEN}` },
  });
  assert.equal(
    authenticatedReady.status,
    200,
    `authenticated readiness returned ${authenticatedReady.status}`,
  );
  assert.equal((await authenticatedReady.json()).status, "ready");
}

const protectedMutations = [
  "/api/account/delete",
  "/api/auth/signout",
  "/api/claim",
  "/api/notification-preferences",
  "/api/vscode-key",
];
for (const path of protectedMutations) {
  const response = await request(path, { method: path.includes("preferences") ? "PATCH" : "POST" });
  assert.equal(response.status, 403, `${path} must reject a missing Origin`);
}

for (const path of ["/api/cron/ad-expiry", "/api/cron/cleanup-sessions"]) {
  const response = await request(path);
  assert.equal(response.status, 401, `${path} must reject missing cron authorization`);
}

const stripe = await request("/api/webhooks/stripe", { method: "POST", body: "{}" });
assert.equal(stripe.status, 400, "Stripe webhook must reject an unsigned request");

const resend = await request("/api/webhooks/resend", { method: "POST", body: "{}" });
assert.ok([401, 503].includes(resend.status), "Resend webhook must fail closed");

const checkout = await request("/api/sky-ads/checkout", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "not-json",
});
assert.equal(
  checkout.status,
  400,
  "checkout must reject malformed input before contacting a payment provider",
);

console.log(`Smoke test passed against ${baseUrl}.`);
