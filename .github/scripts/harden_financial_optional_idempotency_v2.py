from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MIGRATION = ROOT / "supabase/migrations/20260911220000_financial_dimension_contract_v2.sql"
TEST = ROOT / "supabase/tests/financial_publication_pipeline_v1.sql"

migration = MIGRATION.read_text(encoding="utf-8")
test = TEST.read_text(encoding="utf-8")

helper_marker = "CREATE OR REPLACE FUNCTION public.publish_financial_snapshot_v1(p_payload jsonb)"
if "record_optional_financial_dimensions_v2" in migration:
    raise SystemExit("helper opcional ja existe; abortando patch duplicado")

helper = r'''CREATE OR REPLACE FUNCTION public.record_optional_financial_dimensions_v2(
  p_payload jsonb,
  p_exercise integer,
  p_run_id uuid,
  p_digest text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_payload ? 'observedDimensions'
     AND jsonb_typeof(p_payload->'observedDimensions') IS DISTINCT FROM 'array' THEN
    RAISE EXCEPTION 'observedDimensions deve ser um array JSON'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
        "dimensionKey" text,
        "coverageObserved" integer,
        "referenceDateMin" date,
        "referenceDateMax" date
      )
      LEFT JOIN public.financial_dimension_contracts AS c
        ON c.dimension_key = o."dimensionKey"
       AND c.exercise = p_exercise
     WHERE c.dimension_key IS NULL
        OR NOT c.enabled
        OR c.required_for_core_publication
        OR c.validator_key <> 'pending'
        OR o."coverageObserved" IS NULL
        OR o."coverageObserved" < 0
        OR o."coverageObserved" > c.coverage_expected
        OR (
          o."referenceDateMin" IS NOT NULL
          AND o."referenceDateMax" IS NOT NULL
          AND o."referenceDateMin" > o."referenceDateMax"
        )
  ) THEN
    RAISE EXCEPTION 'observacao de dimensao opcional invalida ou sem contrato pending habilitado'
      USING ERRCODE = '22023';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
        "dimensionKey" text,
        "coverageObserved" integer,
        "referenceDateMin" date,
        "referenceDateMax" date
      )
     GROUP BY o."dimensionKey"
    HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'observedDimensions contem dimensao duplicada'
      USING ERRCODE = '23505';
  END IF;

  INSERT INTO public.financial_dimension_status (
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
    published_at
  )
  SELECT
    c.dimension_key,
    p_exercise,
    p_run_id,
    o."coverageObserved",
    c.coverage_expected,
    least(o."coverageObserved"::numeric / c.coverage_expected::numeric, 1),
    o."referenceDateMin",
    o."referenceDateMax",
    'COLLECTING',
    'UNPUBLISHED',
    p_digest,
    now(),
    NULL
  FROM jsonb_to_recordset(coalesce(p_payload->'observedDimensions', '[]'::jsonb)) AS o(
    "dimensionKey" text,
    "coverageObserved" integer,
    "referenceDateMin" date,
    "referenceDateMax" date
  )
  JOIN public.financial_dimension_contracts AS c
    ON c.dimension_key = o."dimensionKey"
   AND c.exercise = p_exercise
   AND c.enabled
   AND NOT c.required_for_core_publication
   AND c.validator_key = 'pending'
  ON CONFLICT (dimension_key, integration_run_id) DO UPDATE
    SET coverage_observed = EXCLUDED.coverage_observed,
        coverage_expected = EXCLUDED.coverage_expected,
        coverage_ratio = EXCLUDED.coverage_ratio,
        reference_date_min = EXCLUDED.reference_date_min,
        reference_date_max = EXCLUDED.reference_date_max,
        quality_status = 'COLLECTING',
        publication_status = 'UNPUBLISHED',
        source_snapshot_digest = EXCLUDED.source_snapshot_digest,
        validated_at = EXCLUDED.validated_at,
        published_at = NULL,
        withdrawn_at = NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.record_optional_financial_dimensions_v2(jsonb, integer, uuid, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_optional_financial_dimensions_v2(jsonb, integer, uuid, text)
  TO service_role;

'''

if migration.count(helper_marker) != 1:
    raise SystemExit("marcador da RPC principal nao encontrado de forma unica")
migration = migration.replace(helper_marker, helper + helper_marker, 1)

idempotence_marker = """    IF (\n      SELECT count(*) = (\n        SELECT count(*)\n          FROM public.financial_dimension_contracts AS required_contract\n"""
if migration.count(idempotence_marker) != 1:
    raise SystemExit("bloco de idempotencia nao encontrado de forma unica")
migration = migration.replace(
    idempotence_marker,
    """    PERFORM public.record_optional_financial_dimensions_v2(\n      p_payload, v_exercise, v_existing_run_id, v_digest\n    );\n\n""" + idempotence_marker,
    1,
)

optional_start = migration.find("  IF p_payload ? 'observedDimensions'", migration.find(helper_marker))
final_return = migration.rfind("  RETURN jsonb_build_object(")
if optional_start < 0 or final_return < 0 or optional_start >= final_return:
    raise SystemExit("bloco inline opcional nao encontrado antes do retorno final")
migration = (
    migration[:optional_start]
    + """  PERFORM public.record_optional_financial_dimensions_v2(\n    p_payload, v_exercise, v_run_id, v_digest\n  );\n\n"""
    + migration[final_return:]
)

if migration.count("record_optional_financial_dimensions_v2(") < 4:
    raise SystemExit("helper opcional nao foi referenciado como esperado")
if migration.count("observedDimensions deve ser um array JSON") != 1:
    raise SystemExit("validacao observedDimensions ficou duplicada ou ausente")

if "select plan(33);" not in test:
    raise SystemExit("plano pgTAP 33 nao encontrado")
test = test.replace("select plan(33);", "select plan(34);", 1)

second_marker = """create temp table _second_publication as\nselect public.publish_financial_snapshot_v1(payload) as result\nfrom _financial_payload;\n"""
if test.count(second_marker) != 1:
    raise SystemExit("segunda publicacao idempotente nao encontrada")
delete_block = """delete from public.financial_dimension_status\n where integration_run_id = (\n   select (result->>'integrationRunId')::uuid from _first_publication\n )\n   and dimension_key = 'bank_balance_positions';\n\n"""
test = test.replace(second_marker, delete_block + second_marker, 1)

idempotent_assert = """select is(\n  (select result->>'status' from _second_publication),\n  'idempotent',\n  'segunda chamada da mesma proveniencia e idempotente'\n);\n"""
if test.count(idempotent_assert) != 1:
    raise SystemExit("assert de idempotencia nao encontrado")
optional_reconcile_assert = """\nselect ok(\n  exists (\n    select 1\n      from public.financial_dimension_status\n     where integration_run_id = (\n       select (result->>'integrationRunId')::uuid from _second_publication\n     )\n       and dimension_key = 'bank_balance_positions'\n       and coverage_observed = 37\n       and quality_status = 'COLLECTING'\n       and publication_status = 'UNPUBLISHED'\n  ),\n  'chamada idempotente reconcilia observacao opcional ausente da mesma proveniencia'\n);\n"""
test = test.replace(idempotent_assert, idempotent_assert + optional_reconcile_assert, 1)

MIGRATION.write_text(migration, encoding="utf-8")
TEST.write_text(test, encoding="utf-8")
print("patched migration and pgTAP contract for optional idempotency")
