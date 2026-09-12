from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "supabase/migrations/20260911065126_financial_publication_pipeline_v1.sql"
TARGET = ROOT / "supabase/migrations/20260911220000_financial_dimension_contract_v2.sql"

source = SOURCE.read_text(encoding="utf-8")
start = source.index("CREATE OR REPLACE FUNCTION public.publish_financial_snapshot_v1")
end = source.index("-- ---------------------------------------------------------------------------\n-- Backfill", start)
fn = source[start:end].rstrip() + "\n"

header = r'''-- Financial Dimension Contract V2
-- Thresholds quantitativos passam a ser governados por contrato no banco.
-- Invariantes semanticas continuam validadas pela RPC antes de qualquer promocao.

ALTER TABLE public.financial_dimension_contracts
  ADD COLUMN IF NOT EXISTS required_for_core_publication boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS validator_key text NOT NULL DEFAULT 'pending';

ALTER TABLE public.financial_dimension_contracts
  DROP CONSTRAINT IF EXISTS financial_dimension_contracts_validator_key_check;

ALTER TABLE public.financial_dimension_contracts
  ADD CONSTRAINT financial_dimension_contracts_validator_key_check
  CHECK (length(btrim(validator_key)) > 0);

UPDATE public.financial_dimension_contracts
SET contract_version = greatest(contract_version, 2),
    required_for_core_publication = true,
    validator_key = CASE dimension_key
      WHEN 'bank_accounts' THEN 'bank_accounts_v1'
      WHEN 'scheduled_repasses' THEN 'scheduled_repasses_v1'
      WHEN 'pdde_basic_first_installment' THEN 'pdde_basic_first_installment_v1'
      WHEN 'pdde_basic_first_installment_breakdown' THEN 'pdde_basic_first_installment_breakdown_v1'
      WHEN 'pdde_basic_second_installment_programmed' THEN 'pdde_basic_second_installment_programmed_v1'
      ELSE validator_key
    END,
    updated_at = now()
WHERE exercise = 2026
  AND dimension_key IN (
    'bank_accounts',
    'scheduled_repasses',
    'pdde_basic_first_installment',
    'pdde_basic_first_installment_breakdown',
    'pdde_basic_second_installment_programmed'
  );

INSERT INTO public.financial_dimension_contracts (
  dimension_key,
  exercise,
  contract_version,
  coverage_expected,
  coverage_required_ratio,
  requirements,
  enabled,
  required_for_core_publication,
  validator_key
)
VALUES (
  'bank_balance_positions',
  2026,
  2,
  163,
  1.000000,
  '{"requires_reference_date":true}'::jsonb,
  true,
  false,
  'pending'
)
ON CONFLICT (dimension_key, exercise) DO UPDATE
SET contract_version = EXCLUDED.contract_version,
    coverage_expected = EXCLUDED.coverage_expected,
    coverage_required_ratio = EXCLUDED.coverage_required_ratio,
    requirements = EXCLUDED.requirements,
    enabled = EXCLUDED.enabled,
    required_for_core_publication = EXCLUDED.required_for_core_publication,
    validator_key = EXCLUDED.validator_key,
    updated_at = now();

CREATE OR REPLACE FUNCTION public.get_financial_dimension_contracts_v1(p_exercise integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT coalesce(
    jsonb_agg(
      jsonb_build_object(
        'dimensionKey', c.dimension_key,
        'exercise', c.exercise,
        'contractVersion', c.contract_version,
        'coverageExpected', c.coverage_expected,
        'coverageRequiredRatio', c.coverage_required_ratio,
        'requirements', c.requirements,
        'enabled', c.enabled,
        'requiredForCorePublication', c.required_for_core_publication,
        'validatorKey', c.validator_key
      ) ORDER BY c.dimension_key
    ),
    '[]'::jsonb
  )
  FROM public.financial_dimension_contracts AS c
  WHERE c.exercise = p_exercise
    AND c.enabled;
$$;

REVOKE ALL ON FUNCTION public.get_financial_dimension_contracts_v1(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_financial_dimension_contracts_v1(integer) TO service_role;

CREATE OR REPLACE FUNCTION public.assert_financial_dimension_contract_v2(
  p_dimension_key text,
  p_exercise integer,
  p_coverage_observed integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_expected integer;
  v_required_ratio numeric(8,6);
  v_enabled boolean;
  v_required boolean;
  v_validator_key text;
BEGIN
  SELECT
    c.coverage_expected,
    c.coverage_required_ratio,
    c.enabled,
    c.required_for_core_publication,
    c.validator_key
  INTO
    v_expected,
    v_required_ratio,
    v_enabled,
    v_required,
    v_validator_key
  FROM public.financial_dimension_contracts AS c
  WHERE c.dimension_key = p_dimension_key
    AND c.exercise = p_exercise;

  IF NOT FOUND OR NOT coalesce(v_enabled, false) OR NOT coalesce(v_required, false) THEN
    RAISE EXCEPTION 'contrato financeiro obrigatorio indisponivel: %', p_dimension_key
      USING ERRCODE = '22023';
  END IF;

  IF v_validator_key = 'pending' THEN
    RAISE EXCEPTION 'dimensao obrigatoria sem validador semantico ativo: %', p_dimension_key
      USING ERRCODE = '22023';
  END IF;

  IF p_coverage_observed IS NULL OR p_coverage_observed < 0
     OR p_coverage_observed::numeric / v_expected::numeric < v_required_ratio THEN
    RAISE EXCEPTION 'dimensao % imatura: cobertura %/% abaixo do threshold %',
      p_dimension_key, coalesce(p_coverage_observed, 0), v_expected, v_required_ratio
      USING ERRCODE = '22023';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.assert_financial_dimension_contract_v2(text, integer, integer)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assert_financial_dimension_contract_v2(text, integer, integer)
  TO service_role;

'''

def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: esperado 1 trecho, encontrado {count}")
    return text.replace(old, new, 1)

fn = replace_once(
    fn,
    """  IF v_account_coverage <> 163 THEN\n    RAISE EXCEPTION 'dimensao bank_accounts imatura: %/163', v_account_coverage\n      USING ERRCODE = '22023';\n  END IF;\n""",
    """  PERFORM public.assert_financial_dimension_contract_v2(\n    'bank_accounts', v_exercise, v_account_coverage\n  );\n""",
    "bank_accounts gate",
)

fn = replace_once(
    fn,
    """  IF v_scheduled_coverage <> 163 THEN\n    RAISE EXCEPTION 'dimensao scheduled_repasses imatura: %/163', v_scheduled_coverage\n      USING ERRCODE = '22023';\n  END IF;\n""",
    """  PERFORM public.assert_financial_dimension_contract_v2(\n    'scheduled_repasses', v_exercise, v_scheduled_coverage\n  );\n""",
    "scheduled gate",
)

fn = replace_once(
    fn,
    """  IF v_first_coverage <> 163 THEN\n    RAISE EXCEPTION 'dimensao pdde_basic_first_installment imatura: %/163', v_first_coverage\n      USING ERRCODE = '22023';\n  END IF;\n""",
    """  PERFORM public.assert_financial_dimension_contract_v2(\n    'pdde_basic_first_installment', v_exercise, v_first_coverage\n  );\n""",
    "first installment gate",
)

fn = replace_once(
    fn,
    """  IF v_invalid_breakdown > 0 OR v_breakdown_coverage <> 163 THEN\n    RAISE EXCEPTION 'dimensao pdde_basic_first_installment_breakdown imatura/invalida: cobertura %, somas invalidas %',\n      v_breakdown_coverage, v_invalid_breakdown\n      USING ERRCODE = '22023';\n  END IF;\n""",
    """  IF v_invalid_breakdown > 0 THEN\n    RAISE EXCEPTION 'dimensao pdde_basic_first_installment_breakdown invalida: somas invalidas %',\n      v_invalid_breakdown\n      USING ERRCODE = '22023';\n  END IF;\n\n  PERFORM public.assert_financial_dimension_contract_v2(\n    'pdde_basic_first_installment_breakdown', v_exercise, v_breakdown_coverage\n  );\n""",
    "breakdown gate",
)

fn = replace_once(
    fn,
    """  IF v_second_coverage <> 163 THEN\n    RAISE EXCEPTION 'dimensao pdde_basic_second_installment_programmed imatura: %/163', v_second_coverage\n      USING ERRCODE = '22023';\n  END IF;\n""",
    """  PERFORM public.assert_financial_dimension_contract_v2(\n    'pdde_basic_second_installment_programmed', v_exercise, v_second_coverage\n  );\n""",
    "second installment gate",
)

fn = replace_once(
    fn,
    """    IF (\n      SELECT count(*) = 5\n        FROM public.financial_dimension_status\n       WHERE integration_run_id = v_existing_run_id\n         AND publication_status = 'PUBLISHED'\n         AND quality_status = 'MATURE'\n    ) THEN\n""",
    """    IF (\n      SELECT count(*) = (\n        SELECT count(*)\n          FROM public.financial_dimension_contracts AS required_contract\n         WHERE required_contract.exercise = v_exercise\n           AND required_contract.enabled\n           AND required_contract.required_for_core_publication\n      )\n        FROM public.financial_dimension_status AS s\n        JOIN public.financial_dimension_contracts AS c\n          ON c.dimension_key = s.dimension_key\n         AND c.exercise = s.exercise\n         AND c.enabled\n         AND c.required_for_core_publication\n       WHERE s.integration_run_id = v_existing_run_id\n         AND s.publication_status = 'PUBLISHED'\n         AND s.quality_status = 'MATURE'\n    ) THEN\n""",
    "idempotence count",
)

regression_pattern = re.compile(
    r"  -- Proteção adicional: uma dimensão publicada não pode regredir cobertura\.\n"
    r"  IF EXISTS \(.*?\n  END IF;\n\n  IF v_existing_run_id IS NULL THEN",
    re.S,
)
fn, count = regression_pattern.subn(
    """  -- Regressao passa a ser governada pelo contrato vigente.\n  -- Reduzir explicitamente o threshold e uma decisao auditavel de configuracao;\n  -- sem essa mudanca, assert_financial_dimension_contract_v2 bloqueia a regressao.\n\n  IF v_existing_run_id IS NULL THEN""",
    fn,
    count=1,
)
if count != 1:
    raise SystemExit(f"regression gate: esperado 1 trecho, encontrado {count}")

fn = replace_once(
    fn,
    """   WHERE exercise = v_exercise\n     AND publication_status = 'PUBLISHED';\n""",
    """   WHERE exercise = v_exercise\n     AND publication_status = 'PUBLISHED'\n     AND dimension_key IN (\n       SELECT c.dimension_key\n         FROM public.financial_dimension_contracts AS c\n        WHERE c.exercise = v_exercise\n          AND c.enabled\n          AND c.required_for_core_publication\n     );\n""",
    "withdraw core only",
)

select_start = fn.index(
    "  SELECT\n    d.dimension_key,\n    v_exercise,\n    v_run_id,\n    d.coverage_observed,\n    163,"
)
select_end_marker = "  ) AS d(dimension_key, coverage_observed, reference_date_min, reference_date_max)\n"
select_end = fn.index(select_end_marker, select_start) + len(select_end_marker)
new_status_select = """  SELECT\n    d.dimension_key,\n    v_exercise,\n    v_run_id,\n    d.coverage_observed,\n    c.coverage_expected,\n    least(d.coverage_observed::numeric / c.coverage_expected::numeric, 1),\n    d.reference_date_min,\n    d.reference_date_max,\n    'MATURE',\n    'PUBLISHED',\n    v_digest,\n    now(),\n    now()\n  FROM (VALUES\n    ('bank_accounts'::text, v_account_coverage, NULL::date, NULL::date),\n    ('scheduled_repasses'::text, v_scheduled_coverage, NULL::date, NULL::date),\n    ('pdde_basic_first_installment'::text, v_first_coverage, v_first_date_min, v_first_date_max),\n    ('pdde_basic_first_installment_breakdown'::text, v_breakdown_coverage, v_first_date_min, v_first_date_max),\n    ('pdde_basic_second_installment_programmed'::text, v_second_coverage, NULL::date, NULL::date)\n  ) AS d(dimension_key, coverage_observed, reference_date_min, reference_date_max)\n  JOIN public.financial_dimension_contracts AS c\n    ON c.dimension_key = d.dimension_key\n   AND c.exercise = v_exercise\n   AND c.enabled\n   AND c.required_for_core_publication\n"""
fn = fn[:select_start] + new_status_select + fn[select_end:]

optional_block = r'''
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
       AND c.exercise = v_exercise
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
    v_exercise,
    v_run_id,
    o."coverageObserved",
    c.coverage_expected,
    least(o."coverageObserved"::numeric / c.coverage_expected::numeric, 1),
    o."referenceDateMin",
    o."referenceDateMax",
    'COLLECTING',
    'UNPUBLISHED',
    v_digest,
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
   AND c.exercise = v_exercise
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

'''

final_return = fn.rfind("  RETURN jsonb_build_object(")
if final_return < 0:
    raise SystemExit("final return nao localizado")
fn = fn[:final_return] + optional_block + fn[final_return:]

fn = fn.replace(
    "'dimensions', 5",
    "'dimensions', (SELECT count(*) FROM public.financial_dimension_contracts AS c WHERE c.exercise = v_exercise AND c.enabled AND c.required_for_core_publication)",
)

fn = fn.replace(
    "'Publica atomicamente o snapshot financeiro 2026 somente após validar identidade, integridade e maturidade das cinco dimensões V1. Uso exclusivo do service_role.';",
    "'Publica atomicamente o snapshot financeiro 2026 usando thresholds do contrato V2; dimensoes opcionais pending permanecem COLLECTING/UNPUBLISHED. Uso exclusivo do service_role.';",
)

footer = r'''
REVOKE ALL ON FUNCTION public.publish_financial_snapshot_v1(jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_financial_snapshot_v1(jsonb) TO service_role;
'''

migration = header + fn
if footer.strip() not in migration:
    # O bloco original ja contem revoke/grant; esta guarda apenas garante a fronteira.
    migration += "\n" + footer

required_fragments = [
    "required_for_core_publication",
    "validator_key",
    "bank_balance_positions",
    "get_financial_dimension_contracts_v1",
    "assert_financial_dimension_contract_v2",
    "coverage_required_ratio",
    "observedDimensions",
    "COLLECTING",
    "UNPUBLISHED",
]
for fragment in required_fragments:
    if fragment not in migration:
        raise SystemExit(f"fragmento obrigatorio ausente na migration gerada: {fragment}")

if "v_second_coverage <> 163" in migration or "v_account_coverage <> 163" in migration:
    raise SystemExit("gate hardcoded de cobertura permaneceu na migration V2")

TARGET.write_text(migration, encoding="utf-8")
print(f"generated {TARGET.relative_to(ROOT)} with {len(migration.splitlines())} lines")
