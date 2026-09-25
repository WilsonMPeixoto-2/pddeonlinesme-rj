-- Reprocessar integração após o timestamp efetivo da migration V8.
begin;

create or replace function public.configure_pdde_financial_sync_v3()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, private, extensions, cron, net
as $$
declare
  v_project_url constant text := 'https://raluxyojqosfzrfozmpz.supabase.co';
  v_trigger_token text;
  v_command text;
  v_job_id bigint;
begin
  v_trigger_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into private.financial_sync_credentials(singleton, token_hash, updated_at)
  values (
    true,
    extensions.digest(convert_to(v_trigger_token, 'UTF8'), 'sha256'),
    now()
  )
  on conflict (singleton) do update
    set token_hash = excluded.token_hash,
        updated_at = excluded.updated_at;

  v_command := format(
    $cmd$
      select net.http_post(
        url := %L,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'X-PDDE-Financial-Sync-Token', %L
        ),
        body := '{"trigger":"supabase-cron"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $cmd$,
    v_project_url || '/functions/v1/sync_pdde_financial_snapshot',
    v_trigger_token
  );

  select cron.schedule(
    'pdde-financial-sync-v1',
    '*/5 * * * *',
    v_command
  ) into v_job_id;

  return v_job_id;
end;
$$;

revoke all on function public.configure_pdde_financial_sync_v3()
  from public, anon, authenticated;
grant execute on function public.configure_pdde_financial_sync_v3()
  to service_role;

comment on function public.configure_pdde_financial_sync_v3() is
  'Rotaciona o token interno e configura o cron financeiro usando autenticação customizada da Edge Function, sem JWT, Vault ou credencial do GitHub.';

commit;
