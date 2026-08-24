import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const requiredFiles = [
  ".env.example",
  ".github/workflows/ci.yml",
  "docs/PRODUCTION-RUNBOOK.md",
  "src/instrumentation.ts",
  "src/app/api/health/live/route.ts",
  "src/app/api/health/ready/route.ts",
];

await Promise.all(requiredFiles.map((file) => access(file)));

const example = await readFile(".env.example", "utf8");
const referenced = new Set();
for (const file of [
  "src/lib/env.ts",
  "src/lib/env-validation.ts",
  "src/lib/stripe.ts",
  "src/lib/resend.ts",
  "src/lib/rate-limit.ts",
]) {
  const source = await readFile(file, "utf8");
  for (const match of source.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)) {
    referenced.add(match[1]);
  }
}

for (const name of referenced) {
  if (["NODE_ENV", "NEXT_RUNTIME", "VERCEL_URL"].includes(name)) continue;
  assert.match(example, new RegExp(`^${name}=`, "m"), `${name} is missing from .env.example`);
}

const workflow = await readFile(".github/workflows/ci.yml", "utf8");
for (const gate of ["npm ci", "npm run lint:ci", "npm test", "npm run build", "npm audit"]) {
  assert.ok(workflow.includes(gate), `CI is missing gate: ${gate}`);
}

console.log(
  `Production controls validated (${requiredFiles.length} files, ${referenced.size} env references).`,
);
