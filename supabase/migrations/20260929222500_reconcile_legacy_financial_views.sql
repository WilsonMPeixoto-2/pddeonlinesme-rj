-- Reconcilia as views financeiras legadas com a projeção autoritativa de repasses.
-- Para o exercício 2026 / programa basico, as parcelas passam a refletir exclusivamente
-- valores oficialmente pagos e persistidos em repasses_financeiros.
-- Ausência de um ciclo permanece NULL; nunca é convertida em zero.
-- Reprogramado continua sob responsabilidade de execucao_financeira.

CREATE OR REPLACE VIEW public.vw_unidade_detalhe
WITH (security_invoker = true)
AS
WITH ciclos_pagos AS (
  SELECT
    r.unidade_id,
    r.exercicio,
    SUM(r.custeio_pago) FILTER (
      WHERE r.valor_pago IS NOT NULL
        AND (
          (r.acao = 'PDDE Básico' AND r.parcela = '1ª Parcela')
          OR (r.acao = 'PDDE Básico — Primeira Infância' AND r.parcela = 'P1')
        )
    )::numeric(14,2) AS parcela_1_custeio,
    SUM(r.capital_pago) FILTER (
      WHERE r.valor_pago IS NOT NULL
        AND (
          (r.acao = 'PDDE Básico' AND r.parcela = '1ª Parcela')
          OR (r.acao = 'PDDE Básico — Primeira Infância' AND r.parcela = 'P1')
        )
    )::numeric(14,2) AS parcela_1_capital,
    SUM(r.custeio_pago) FILTER (
      WHERE r.valor_pago IS NOT NULL
        AND (
          (r.acao = 'PDDE Básico' AND r.parcela = '2ª Parcela')
          OR (r.acao = 'PDDE Básico — Primeira Infância' AND r.parcela = 'P2')
        )
    )::numeric(14,2) AS parcela_2_custeio,
    SUM(r.capital_pago) FILTER (
      WHERE r.valor_pago IS NOT NULL
        AND (
          (r.acao = 'PDDE Básico' AND r.parcela = '2ª Parcela')
          OR (r.acao = 'PDDE Básico — Primeira Infância' AND r.parcela = 'P2')
        )
    )::numeric(14,2) AS parcela_2_capital,
    MAX(r.updated_at) AS updated_at
  FROM public.repasses_financeiros AS r
  WHERE r.exercicio = 2026
    AND r.acao IN ('PDDE Básico', 'PDDE Básico — Primeira Infância')
  GROUP BY r.unidade_id, r.exercicio
),
detalhe AS (
  SELECT
    u.id AS unidade_id,
    u.designacao,
    u.nome,
    u.inep,
    u.cnpj,
    u.diretor,
    u.endereco,
    COALESCE(cb.agencia, u.agencia) AS agencia,
    COALESCE(cb.conta_corrente, u.conta_corrente) AS conta_corrente,
    cb.banco,
    ef.exercicio,
    ef.programa,
    ef.reprogramado_custeio,
    ef.reprogramado_capital,
    CASE
      WHEN ef.exercicio = 2026 AND ef.programa = 'basico' THEN cp.parcela_1_custeio
      ELSE ef.parcela_1_custeio
    END::numeric(14,2) AS parcela_1_custeio,
    CASE
      WHEN ef.exercicio = 2026 AND ef.programa = 'basico' THEN cp.parcela_1_capital
      ELSE ef.parcela_1_capital
    END::numeric(14,2) AS parcela_1_capital,
    CASE
      WHEN ef.exercicio = 2026 AND ef.programa = 'basico' THEN cp.parcela_2_custeio
      ELSE ef.parcela_2_custeio
    END::numeric(14,2) AS parcela_2_custeio,
    CASE
      WHEN ef.exercicio = 2026 AND ef.programa = 'basico' THEN cp.parcela_2_capital
      ELSE ef.parcela_2_capital
    END::numeric(14,2) AS parcela_2_capital,
    GREATEST(
      u.updated_at,
      COALESCE(cb.updated_at, u.updated_at),
      COALESCE(ef.updated_at, u.updated_at),
      COALESCE(cp.updated_at, u.updated_at)
    ) AS updated_at
  FROM public.unidades_escolares AS u
  LEFT JOIN LATERAL (
    SELECT
      cb.banco,
      cb.agencia,
      cb.conta_corrente,
      cb.updated_at
    FROM public.contas_bancarias AS cb
    WHERE cb.unidade_id = u.id
    ORDER BY cb.principal DESC, cb.updated_at DESC, cb.created_at DESC
    LIMIT 1
  ) AS cb ON true
  LEFT JOIN public.execucao_financeira AS ef
    ON ef.unidade_id = u.id
  LEFT JOIN ciclos_pagos AS cp
    ON cp.unidade_id = u.id
   AND cp.exercicio = ef.exercicio
)
SELECT
  d.unidade_id,
  d.designacao,
  d.nome,
  d.inep,
  d.cnpj,
  d.diretor,
  d.endereco,
  d.agencia,
  d.conta_corrente,
  d.banco,
  d.exercicio,
  d.programa,
  d.reprogramado_custeio,
  d.reprogramado_capital,
  d.parcela_1_custeio,
  d.parcela_1_capital,
  d.parcela_2_custeio,
  d.parcela_2_capital,
  (COALESCE(d.reprogramado_custeio, 0) + COALESCE(d.reprogramado_capital, 0))::numeric(14,2)
    AS total_reprogramado,
  CASE
    WHEN d.exercicio = 2026 AND d.programa = 'basico'
      AND (
        d.parcela_1_custeio IS NULL
        OR d.parcela_1_capital IS NULL
        OR d.parcela_2_custeio IS NULL
        OR d.parcela_2_capital IS NULL
      )
      THEN NULL
    ELSE (
      COALESCE(d.parcela_1_custeio, 0)
      + COALESCE(d.parcela_1_capital, 0)
      + COALESCE(d.parcela_2_custeio, 0)
      + COALESCE(d.parcela_2_capital, 0)
    )::numeric(14,2)
  END AS total_parcelas,
  CASE
    WHEN d.exercicio = 2026 AND d.programa = 'basico'
      AND (
        d.parcela_1_custeio IS NULL
        OR d.parcela_1_capital IS NULL
        OR d.parcela_2_custeio IS NULL
        OR d.parcela_2_capital IS NULL
      )
      THEN NULL
    ELSE (
      COALESCE(d.reprogramado_custeio, 0)
      + COALESCE(d.reprogramado_capital, 0)
      + COALESCE(d.parcela_1_custeio, 0)
      + COALESCE(d.parcela_1_capital, 0)
      + COALESCE(d.parcela_2_custeio, 0)
      + COALESCE(d.parcela_2_capital, 0)
    )::numeric(14,2)
  END AS total_disponivel_inicial,
  d.updated_at
FROM detalhe AS d;

CREATE OR REPLACE VIEW public.vw_dashboard_basico
WITH (security_invoker = true)
AS
SELECT
  d.exercicio,
  d.programa,
  COUNT(DISTINCT d.unidade_id)::bigint AS total_unidades,
  COALESCE(SUM(d.reprogramado_custeio), 0)::numeric(14,2) AS total_reprogramado_custeio,
  COALESCE(SUM(d.reprogramado_capital), 0)::numeric(14,2) AS total_reprogramado_capital,
  CASE WHEN COUNT(*) FILTER (WHERE d.parcela_1_custeio IS NULL) > 0
    THEN NULL ELSE SUM(d.parcela_1_custeio)::numeric(14,2) END AS total_parcela_1_custeio,
  CASE WHEN COUNT(*) FILTER (WHERE d.parcela_1_capital IS NULL) > 0
    THEN NULL ELSE SUM(d.parcela_1_capital)::numeric(14,2) END AS total_parcela_1_capital,
  CASE WHEN COUNT(*) FILTER (WHERE d.parcela_2_custeio IS NULL) > 0
    THEN NULL ELSE SUM(d.parcela_2_custeio)::numeric(14,2) END AS total_parcela_2_custeio,
  CASE WHEN COUNT(*) FILTER (WHERE d.parcela_2_capital IS NULL) > 0
    THEN NULL ELSE SUM(d.parcela_2_capital)::numeric(14,2) END AS total_parcela_2_capital,
  COALESCE(SUM(d.total_reprogramado), 0)::numeric(14,2) AS total_reprogramado,
  CASE WHEN COUNT(*) FILTER (WHERE d.total_parcelas IS NULL) > 0
    THEN NULL ELSE SUM(d.total_parcelas)::numeric(14,2) END AS total_parcelas,
  CASE WHEN COUNT(*) FILTER (WHERE d.total_disponivel_inicial IS NULL) > 0
    THEN NULL ELSE SUM(d.total_disponivel_inicial)::numeric(14,2) END AS total_disponivel_inicial,
  MAX(d.updated_at) AS updated_at_max
FROM public.vw_unidade_detalhe AS d
WHERE d.exercicio IS NOT NULL
  AND d.programa IS NOT NULL
GROUP BY d.exercicio, d.programa;

GRANT SELECT ON public.vw_unidade_detalhe TO authenticated;
GRANT SELECT ON public.vw_dashboard_basico TO authenticated;
