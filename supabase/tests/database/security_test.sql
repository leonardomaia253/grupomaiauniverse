begin;

create extension if not exists pgtap with schema extensions;
set search_path to public, extensions;

select plan(10);

select has_table('public', 'companies', 'companies table exists');
select has_table('public', 'sky_ads', 'sky_ads table exists');
select hasnt_column('public', 'companies', 'vscode_api_key', 'plaintext VS Code key is absent');
select has_column('public', 'companies', 'vscode_api_key_hash', 'only a VS Code key hash is stored');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.companies'::regclass),
  'RLS is enabled on companies'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.sky_ads'::regclass),
  'RLS is enabled on sky_ads'
);

select ok(
  not has_column_privilege('anon', 'public.companies', 'vscode_api_key_hash', 'select'),
  'anon cannot read VS Code key hashes'
);
select ok(
  not has_column_privilege('anon', 'public.companies', 'auth_user_id', 'select'),
  'anon cannot read company auth ownership'
);
select ok(
  not has_column_privilege('anon', 'public.companies', 'contact_email', 'select'),
  'anon cannot read company contact email'
);
select ok(
  not has_column_privilege('anon', 'public.sky_ads', 'purchaser_email', 'select'),
  'anon cannot read ad purchaser email'
);

select * from finish();
rollback;
