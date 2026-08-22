-- Repair policy definitions that referenced the pre-generalization table name.
drop policy if exists "Owner reads own purchases" on public.purchases;
create policy "Owner reads own purchases"
  on public.purchases for select to authenticated
  using (
    (select auth.uid()) is not null
    and company_id in (
      select id from public.companies where claimed_by = (select auth.uid())
    )
  );

drop policy if exists "Owner reads own customizations" on public.company_customizations;
create policy "Owner reads own customizations"
  on public.company_customizations for select to authenticated
  using (
    (select auth.uid()) is not null
    and company_id in (
      select id from public.companies where claimed_by = (select auth.uid())
    )
  );
