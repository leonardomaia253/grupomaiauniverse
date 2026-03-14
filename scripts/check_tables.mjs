import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve('.env.local');
const envFile = fs.readFileSync(envPath, 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const t = ['sky_ads', 'planet_ads', 'building_ads'];
  for (const name of t) {
    const { error } = await supabase.from(name).select('id').limit(1);
    console.log(`${name}=${error ? 'no' : 'yes'}`);
  }
}
main();
