import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
assert.ok(url && anonKey && serviceKey, "Supabase URL, anon key and service role key are required");

const anon = createClient(url, anonKey, { auth: { persistSession: false } });
const service = createClient(url, serviceKey, { auth: { persistSession: false } });

const publicProbe = await anon.from("companies").select("id,login").limit(1);
assert.equal(
  publicProbe.error,
  null,
  `public company projection failed: ${publicProbe.error?.message}`,
);

for (const column of ["vscode_api_key", "vscode_api_key_hash", "auth_user_id", "contact_email"]) {
  const probe = await anon.from("companies").select(column).limit(1);
  assert.ok(probe.error, `anon unexpectedly read sensitive companies.${column}`);
}

const privateAdProbe = await anon
  .from("sky_ads")
  .select("purchaser_email,stripe_customer_id,tracking_token")
  .limit(1);
assert.ok(privateAdProbe.error, "anon unexpectedly read private sky_ads columns");

const serviceProbe = await service.from("companies").select("id", { head: true }).limit(1);
assert.equal(
  serviceProbe.error,
  null,
  `service role database probe failed: ${serviceProbe.error?.message}`,
);

console.log("Supabase production security probes passed.");
