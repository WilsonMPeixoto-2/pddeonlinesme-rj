begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table if not exists private.financial_sync_credentials (
  singleton boolean primary key default true check (singleton),
  token_hash bytea not null,
  updated_at timestamptz not null default now()
);

revoke all on private.financial_sync_credentials from public, anon, authenticated;

create or replace function public.verify_pdde_financial_sync_token_v1(p_token text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, private, extensions
as $token$
  select exists (
    select 1
    from private.financial_sync_credentials
    where singleton
      and token_hash = extensions.digest(convert_to(coalesce(p_token, ''), 'UTF8'), 'sha256')
  );
$token$;

revoke all on function public.verify_pdde_financial_sync_token_v1(text)
  from public, anon, authenticated;
grant execute on function public.verify_pdde_financial_sync_token_v1(text)
  to service_role;

create or replace function public.configure_pdde_financial_sync_v2(p_anon_key text)
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
  if nullif(p_anon_key, '') is null then
    raise exception 'chave anon ausente'
      using errcode = '22023';
  end if;

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
          'Authorization', 'Bearer ' || %L,
          'X-PDDE-Financial-Sync-Token', %L
        ),
        body := '{"trigger":"supabase-cron"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $cmd$,
    v_project_url || '/functions/v1/sync_pdde_financial_snapshot',
    p_anon_key,
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

revoke all on function public.configure_pdde_financial_sync_v2(text)
  from public, anon, authenticated;
grant execute on function public.configure_pdde_financial_sync_v2(text)
  to service_role;

comment on function public.configure_pdde_financial_sync_v2(text) is
  'Configura cron financeiro sem depender do Vault: o token interno nasce no banco, apenas seu hash fica em schema privado e o valor plaintext permanece restrito ao job do pg_cron.';

commit;
