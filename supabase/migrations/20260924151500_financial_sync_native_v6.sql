begin;

create extension if not exists pg_net;
create extension if not exists pg_cron;

create table if not exists public.financial_sync_attempts (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('RUNNING','PUBLISHED','UNCHANGED','ALREADY_CURRENT','FAILED')),
  execution_id text,
  source_workflow_run_id bigint,
  source_artifact_id bigint,
  source_published_at timestamptz,
  snapshot_digest text,
  raw_bytes bigint,
  schools_observed integer,
  repasses_observed integer,
  semantic_rows_verified integer,
  second_cycle_schools integer,
  second_cycle_total numeric,
  error_code text,
  error_message text,
  constraint financial_sync_attempts_digest_check
    check (snapshot_digest is null or snapshot_digest ~ '^[0-9a-f]{64}$'),
  constraint financial_sync_attempts_counts_check
    check (
      coalesce(raw_bytes, 0) >= 0
      and coalesce(schools_observed, 0) >= 0
      and coalesce(repasses_observed, 0) >= 0
      and coalesce(semantic_rows_verified, 0) >= 0
      and coalesce(second_cycle_schools, 0) >= 0
    )
);

create index if not exists idx_financial_sync_attempts_started_at
  on public.financial_sync_attempts (started_at desc);

create index if not exists idx_financial_sync_attempts_source
  on public.financial_sync_attempts (source_workflow_run_id desc, source_artifact_id desc);

alter table public.financial_sync_attempts enable row level security;
revoke all on public.financial_sync_attempts from public, anon, authenticated;
grant select, insert, update on public.financial_sync_attempts to service_role;

update public.financial_dimension_contracts
   set contract_version = greatest(contract_version, 2),
       requirements = (coalesce(requirements, '{}'::jsonb) - 'requires_payment_date')
         || '{"requires_paid_amount":true,"requires_payment_or_order_date":true,"evidence":"PDDEINFO_PAYMENT_INFORMED","bank_credit_is_separate":true}'::jsonb,
       updated_at = now()
 where exercise = 2026
   and dimension_key = 'pdde_basic_second_installment_payment_informed';

create or replace function public.evaluate_second_cycle_payment_v1(p_payload jsonb)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_exercise integer;
  v_coverage integer;
  v_total numeric;
  v_date_min date;
  v_date_max date;
  v_quality text;
  v_publication text;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'payload financeiro deve ser um objeto JSON'
      using errcode = '22023';
  end if;

  v_exercise := nullif(p_payload->>'exercise', '')::integer;
  if v_exercise is distinct from 2026 then
    raise exception 'exercicio financeiro inesperado: %', v_exercise
      using errcode = '22023';
  end if;

  select
    count(distinct r.inep),
    coalesce(sum(r.paid), 0),
    min(coalesce(r."paymentDate", r."paymentOrderDate")),
    max(coalesce(r."paymentDate", r."paymentOrderDate"))
  into v_coverage, v_total, v_date_min, v_date_max
  from jsonb_to_recordset(coalesce(p_payload->'repasses', '[]'::jsonb)) as r(
    inep text,
    exercise integer,
    program text,
    action text,
    installment text,
    "displayOrder" integer,
    programmed numeric,
    paid numeric,
    "programmedCusteio" numeric,
    "programmedCapital" numeric,
    "paidCusteio" numeric,
    "paidCapital" numeric,
    "paymentDate" date,
    "paymentOrderDate" date,
    account jsonb
  )
  where r.exercise = v_exercise
    and r.program = 'PDDE BÁSICO'
    and (
      (r.action = 'PDDE Básico' and r.installment = '2ª Parcela')
      or
      (r.action = 'PDDE Básico — Primeira Infância' and r.installment = 'P2')
    )
    and r.paid is not null
    and r.paid >= 0
    and coalesce(r."paymentDate", r."paymentOrderDate") is not null;

  v_quality := case
    when v_coverage >= 163 then 'MATURE'
    when v_coverage > 0 then 'VALIDATED'
    else 'COLLECTING'
  end;

  v_publication := case when v_coverage > 0 then 'PUBLISHED' else 'UNPUBLISHED' end;

  return jsonb_build_object(
    'coverageObserved', v_coverage,
    'coverageExpected', 163,
    'coverageRatio', least(v_coverage::numeric / 163::numeric, 1),
    'totalInformed', v_total,
    'qualityStatus', v_quality,
    'publicationStatus', v_publication,
    'referenceDateMin', v_date_min,
    'referenceDateMax', v_date_max,
    'requiresPaymentOrOrderDate', true
  );
end;
$$;

revoke all on function public.evaluate_second_cycle_payment_v1(jsonb)
  from public, anon, authenticated;
grant execute on function public.evaluate_second_cycle_payment_v1(jsonb)
  to service_role;

comment on function public.evaluate_second_cycle_payment_v1(jsonb) is
  'Avalia o pagamento informado do 2o ciclo de forma progressiva: cobertura parcial valida e publicavel; 163/163 define maturidade. Pagamento e ordem continuam distintos de credito bancario.';

create or replace function public.publish_financial_snapshot_with_order_evidence_v2(p_payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_exercise integer;
  v_eval jsonb;
  v_coverage integer;
  v_current_coverage integer;
  v_result jsonb;
  v_run_id uuid;
  v_digest text;
begin
  if jsonb_typeof(p_payload) is distinct from 'object' then
    raise exception 'payload financeiro deve ser um objeto JSON'
      using errcode = '22023';
  end if;

  v_exercise := nullif(p_payload->>'exercise', '')::integer;
  if v_exercise is distinct from 2026 then
    raise exception 'exercicio financeiro inesperado: %', v_exercise
      using errcode = '22023';
  end if;

  v_digest := lower(p_payload->'source'->>'snapshotDigest');
  v_eval := public.evaluate_second_cycle_payment_v1(p_payload);
  v_coverage := coalesce((v_eval->>'coverageObserved')::integer, 0);

  select s.coverage_observed
    into v_current_coverage
    from public.financial_dimension_status as s
   where s.exercise = v_exercise
     and s.dimension_key = 'pdde_basic_second_installment_payment_informed'
     and s.publication_status = 'PUBLISHED'
   order by s.published_at desc
   limit 1;

  if v_current_coverage is not null and v_coverage < v_current_coverage then
    raise exception 'regressao do pagamento informado do 2o ciclo bloqueada: recebida %/163, vigente %/163',
      v_coverage, v_current_coverage
      using errcode = '22023';
  end if;

  v_result := public.publish_financial_snapshot_with_order_evidence_v1(p_payload);
  v_run_id := nullif(v_result->'publication'->>'integrationRunId', '')::uuid;

  if v_run_id is null then
    raise exception 'publicacao financeira nao retornou integrationRunId'
      using errcode = '22023';
  end if;

  update public.financial_dimension_status
     set publication_status = 'WITHDRAWN',
         withdrawn_at = now()
   where exercise = v_exercise
     and dimension_key = 'pdde_basic_second_installment_payment_informed'
     and publication_status = 'PUBLISHED'
     and integration_run_id <> v_run_id;

  if v_coverage > 0 then
    insert into public.financial_dimension_status (
      dimension_key,
      exercise,
      integration_run_id,
      coverage_observed,
      coverage_expected,
      coverage_ratio,
      reference_date_min,
      reference_date_max,
      quality_status,
      publication_status,
      source_snapshot_digest,
      validated_at,
      published_at,
      withdrawn_at
    )
    values (
      'pdde_basic_second_installment_payment_informed',
      v_exercise,
      v_run_id,
      v_coverage,
      163,
      least(v_coverage::numeric / 163::numeric, 1),
      nullif(v_eval->>'referenceDateMin', '')::date,
      nullif(v_eval->>'referenceDateMax', '')::date,
      v_eval->>'qualityStatus',
      'PUBLISHED',
      v_digest,
      now(),
      now(),
      null
    )
    on conflict (dimension_key, integration_run_id) do update
      set coverage_observed = excluded.coverage_observed,
          coverage_expected = excluded.coverage_expected,
          coverage_ratio = excluded.coverage_ratio,
          reference_date_min = excluded.reference_date_min,
          reference_date_max = excluded.reference_date_max,
          quality_status = excluded.quality_status,
          publication_status = excluded.publication_status,
          source_snapshot_digest = excluded.source_snapshot_digest,
          validated_at = excluded.validated_at,
          published_at = excluded.published_at,
          withdrawn_at = null;
  else
    update public.financial_dimension_status
       set quality_status = 'COLLECTING',
           publication_status = 'UNPUBLISHED',
           published_at = null,
           withdrawn_at = null,
           coverage_observed = 0,
           coverage_ratio = 0,
           reference_date_min = null,
           reference_date_max = null,
           validated_at = now()
     where dimension_key = 'pdde_basic_second_installment_payment_informed'
       and exercise = v_exercise
       and integration_run_id = v_run_id;
  end if;

  return jsonb_set(
    v_result,
    '{secondInstallmentPaymentInformed}',
    v_eval,
    true
  );
end;
$$;

revoke all on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb)
  from public, anon, authenticated;
grant execute on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb)
  to service_role;

comment on function public.publish_financial_snapshot_with_order_evidence_v2(jsonb) is
  'Publica fatos validos do 2o ciclo progressivamente; 163/163 define MATURE, nao bloqueia fatos parciais. Ordem/pagamento informado permanecem distintos de credito bancario.';

create or replace function public.get_financial_sync_health_v1()
returns table (
  status text,
  started_at timestamptz,
  finished_at timestamptz,
  source_workflow_run_id bigint,
  source_artifact_id bigint,
  source_published_at timestamptz,
  schools_observed integer,
  repasses_observed integer,
  semantic_rows_verified integer,
  second_cycle_schools integer,
  second_cycle_total numeric,
  error_code text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    a.status,
    a.started_at,
    a.finished_at,
    a.source_workflow_run_id,
    a.source_artifact_id,
    a.source_published_at,
    a.schools_observed,
    a.repasses_observed,
    a.semantic_rows_verified,
    a.second_cycle_schools,
    a.second_cycle_total,
    a.error_code
  from public.financial_sync_attempts as a
  order by a.started_at desc
  limit 1;
$$;

revoke all on function public.get_financial_sync_health_v1()
  from public, anon;
grant execute on function public.get_financial_sync_health_v1()
  to authenticated, service_role;

create or replace function public.verify_pdde_financial_sync_token_v1(p_token text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, vault
as $
  select exists (
    select 1
    from vault.decrypted_secrets
    where name = 'pdde_financial_sync_token'
      and nullif(decrypted_secret, '') is not null
      and decrypted_secret = p_token
  );
$;

revoke all on function public.verify_pdde_financial_sync_token_v1(text)
  from public, anon, authenticated;
grant execute on function public.verify_pdde_financial_sync_token_v1(text)
  to service_role;

create or replace function public.configure_pdde_financial_sync_v1()
returns bigint
language plpgsql
security definer
set search_path = pg_catalog, public, vault, cron, net
as $$
declare
  v_project_url text;
  v_anon_key text;
  v_trigger_token text;
  v_job_id bigint;
begin
  select decrypted_secret into v_project_url
    from vault.decrypted_secrets
   where name = 'pdde_financial_sync_project_url'
   limit 1;

  select decrypted_secret into v_anon_key
    from vault.decrypted_secrets
   where name = 'pdde_financial_sync_anon_key'
   limit 1;

  select decrypted_secret into v_trigger_token
    from vault.decrypted_secrets
   where name = 'pdde_financial_sync_token'
   limit 1;

  if nullif(v_project_url, '') is null
     or nullif(v_anon_key, '') is null
     or nullif(v_trigger_token, '') is null then
    raise exception 'secrets do sincronizador financeiro nao configurados no Vault'
      using errcode = '22023';
  end if;

  select cron.schedule(
    'pdde-financial-sync-v1',
    '*/5 * * * *',
    $cron$
      select net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'pdde_financial_sync_project_url')
          || '/functions/v1/sync_pdde_financial_snapshot',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' ||
            (select decrypted_secret from vault.decrypted_secrets where name = 'pdde_financial_sync_anon_key'),
          'X-PDDE-Financial-Sync-Token',
            (select decrypted_secret from vault.decrypted_secrets where name = 'pdde_financial_sync_token')
        ),
        body := '{"trigger":"supabase-cron"}'::jsonb,
        timeout_milliseconds := 120000
      );
    $cron$
  ) into v_job_id;

  return v_job_id;
end;
$$;

revoke all on function public.configure_pdde_financial_sync_v1()
  from public, anon, authenticated;
grant execute on function public.configure_pdde_financial_sync_v1()
  to service_role;

comment on function public.configure_pdde_financial_sync_v1() is
  'Agenda no proprio Supabase a verificacao do snapshot financeiro a cada 5 minutos; credenciais de invocacao ficam no Vault e nao no GitHub.';

commit;
