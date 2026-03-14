-- Tighten RLS: purchases and customizations should NOT be world-readable.
-- All API routes use getSupabaseAdmin() (service role) so they bypass RLS.

-- purchases: drop public read, allow only owner
drop policy "Public read purchases" on purchases;

create policy "Owner reads own purchases" on purchases
  for select using (
    auth.uid() is not null
    and company_id in (
      select id from companies where claimed_by = auth.uid()
    )
  );

-- company_customizations: drop public read, allow only owner
drop policy "Public read customizations" on company_customizations;

create policy "Owner reads own customizations" on company_customizations
  for select using (
    auth.uid() is not null
    and company_id in (
      select id from companies where claimed_by = auth.uid()
    )
  );
