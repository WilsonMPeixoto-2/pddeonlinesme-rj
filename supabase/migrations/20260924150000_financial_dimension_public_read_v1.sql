begin;

create or replace function public.get_financial_dimension_publication_v1(p_exercise integer)
returns table (
  dimension_key text,
  exercise integer,
  coverage_observed integer,
  coverage_expected integer,
  coverage_ratio numeric,
  reference_date_min date,
  reference_date_max date,
  quality_status text,
  publication_status text,
  validated_at timestamptz,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select
    s.dimension_key,
    s.exercise,
    s.coverage_observed,
    s.coverage_expected,
    s.coverage_ratio,
    s.reference_date_min,
    s.reference_date_max,
    s.quality_status,
    s.publication_status,
    s.validated_at,
    s.published_at
  from public.financial_dimension_status as s
  join public.financial_dimension_contracts as c
    on c.dimension_key = s.dimension_key
   and c.exercise = s.exercise
  where s.exercise = p_exercise
    and s.publication_status = 'PUBLISHED'
    and c.enabled = true
  order by s.dimension_key;
$$;

revoke all on function public.get_financial_dimension_publication_v1(integer)
  from public, anon;
grant execute on function public.get_financial_dimension_publication_v1(integer)
  to authenticated, service_role;

comment on function public.get_financial_dimension_publication_v1(integer) is
  'Expõe aos usuários autenticados apenas cobertura, maturidade e datas de referência das dimensões financeiras publicadas; não expõe auditoria interna nem credenciais.';

commit;
