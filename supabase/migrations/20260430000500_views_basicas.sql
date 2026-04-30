-- Foundation v1 — Migration 5/5
-- Views mínimas para localizador, detalhe da unidade e dashboard básico.
-- Postgres local roda em 17.6; usamos security_invoker para respeitar RLS
-- das tabelas base sem abrir exceções de privilégio.

CREATE OR REPLACE VIEW public.vw_unidades_localizador
WITH (security_invoker = true)
AS
SELECT
  u.id,
  u.designacao,
  u.nome,
  u.inep,
  u.cnpj,
  u.diretor,
  u.updated_at,
  u.created_at
FROM public.unidades_escolares AS u;

CREATE OR REPLACE VIEW public.vw_unidade_detalhe
WITH (security_invoker = true)
AS
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
  ef.parcela_1_custeio,
  ef.parcela_1_capital,
  ef.parcela_2_custeio,
  ef.parcela_2_capital,
  COALESCE(ef.reprogramado_custeio, 0) + COALESCE(ef.reprogramado_capital, 0) AS total_reprogramado,
  COALESCE(ef.parcela_1_custeio, 0)
    + COALESCE(ef.parcela_1_capital, 0)
    + COALESCE(ef.parcela_2_custeio, 0)
    + COALESCE(ef.parcela_2_capital, 0) AS total_parcelas,
  COALESCE(ef.reprogramado_custeio, 0)
    + COALESCE(ef.reprogramado_capital, 0)
    + COALESCE(ef.parcela_1_custeio, 0)
    + COALESCE(ef.parcela_1_capital, 0)
    + COALESCE(ef.parcela_2_custeio, 0)
    + COALESCE(ef.parcela_2_capital, 0) AS total_disponivel_inicial,
  GREATEST(
    u.updated_at,
    COALESCE(cb.updated_at, u.updated_at),
    COALESCE(ef.updated_at, u.updated_at)
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
  ON ef.unidade_id = u.id;

CREATE OR REPLACE VIEW public.vw_dashboard_basico
WITH (security_invoker = true)
AS
SELECT
  ef.exercicio,
  ef.programa,
  COUNT(DISTINCT ef.unidade_id)::bigint AS total_unidades,
  COALESCE(SUM(ef.reprogramado_custeio), 0)::numeric(14,2) AS total_reprogramado_custeio,
  COALESCE(SUM(ef.reprogramado_capital), 0)::numeric(14,2) AS total_reprogramado_capital,
  COALESCE(SUM(ef.parcela_1_custeio), 0)::numeric(14,2) AS total_parcela_1_custeio,
  COALESCE(SUM(ef.parcela_1_capital), 0)::numeric(14,2) AS total_parcela_1_capital,
  COALESCE(SUM(ef.parcela_2_custeio), 0)::numeric(14,2) AS total_parcela_2_custeio,
  COALESCE(SUM(ef.parcela_2_capital), 0)::numeric(14,2) AS total_parcela_2_capital,
  COALESCE(SUM(ef.reprogramado_custeio + ef.reprogramado_capital), 0)::numeric(14,2) AS total_reprogramado,
  COALESCE(
    SUM(
      ef.parcela_1_custeio
      + ef.parcela_1_capital
      + ef.parcela_2_custeio
      + ef.parcela_2_capital
    ),
    0
  )::numeric(14,2) AS total_parcelas,
  COALESCE(
    SUM(
      ef.reprogramado_custeio
      + ef.reprogramado_capital
      + ef.parcela_1_custeio
      + ef.parcela_1_capital
      + ef.parcela_2_custeio
      + ef.parcela_2_capital
    ),
    0
  )::numeric(14,2) AS total_disponivel_inicial,
  MAX(GREATEST(u.updated_at, ef.updated_at)) AS updated_at_max
FROM public.execucao_financeira AS ef
LEFT JOIN public.unidades_escolares AS u
  ON u.id = ef.unidade_id
GROUP BY ef.exercicio, ef.programa;

GRANT SELECT ON public.vw_unidades_localizador TO authenticated;
GRANT SELECT ON public.vw_unidade_detalhe TO authenticated;
GRANT SELECT ON public.vw_dashboard_basico TO authenticated;
