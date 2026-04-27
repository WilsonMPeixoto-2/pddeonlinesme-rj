-- Migration 0006: views_frontend_status
-- Conforme Plano de Migração Supabase v2.2.1

CREATE VIEW public.vw_unidades_escolares_frontend 
WITH (security_invoker = true) AS
SELECT
  ue.id,
  ue.designacao,
  ue.nome,
  (ue.designacao || ' — ' || ue.nome) AS unidade_label,
  ue.inep,
  ue.cnpj,
  ue.diretor,
  ue.endereco,
  ue.agencia,
  ue.conta_corrente,
  ue.email,
  ue.alunos,
  ue.ativo,
  ef.exercicio,
  ef.programa,
  ef.reprogramado_custeio,
  ef.reprogramado_capital,
  ef.parcela_1_custeio,
  ef.parcela_1_capital,
  ef.parcela_2_custeio,
  ef.parcela_2_capital,
  (ef.reprogramado_custeio + ef.reprogramado_capital) AS saldo_anterior,
  (ef.parcela_1_custeio + ef.parcela_1_capital + ef.parcela_2_custeio + ef.parcela_2_capital) AS recebido,
  ef.gasto,
  (ef.reprogramado_custeio + ef.reprogramado_capital + ef.parcela_1_custeio + ef.parcela_1_capital + ef.parcela_2_custeio + ef.parcela_2_capital - ef.gasto) AS saldo_estimado,
  ue.created_at,
  ue.updated_at
FROM public.unidades_escolares ue
JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id
WHERE ue.ativo = true;

-- OBS: O JOIN (Inner Join) não "mitiga" falso negativo sozinho; ele EXIGE que o importador 
-- inicialize execucao_financeira para todas as unidades ativas. 
-- Validar que não existe unidade ativa sem execucao_financeira é um GATE OBRIGATÓRIO antes do cutover.

CREATE VIEW public.vw_unidades_status 
WITH (security_invoker = true) AS
SELECT
  ue.id AS unidade_id,
  ef.exercicio,
  ef.programa,
  CASE
    WHEN ue.designacao IS NOT NULL AND ue.nome IS NOT NULL AND ue.inep IS NOT NULL 
         AND ue.cnpj IS NOT NULL AND ue.agencia IS NOT NULL AND ue.conta_corrente IS NOT NULL
         AND (ef.reprogramado_custeio + ef.reprogramado_capital + ef.parcela_1_custeio + ef.parcela_1_capital + ef.parcela_2_custeio + ef.parcela_2_capital > 0 OR ef.created_at IS NOT NULL)
    THEN 'pronta'
    WHEN ue.designacao IS NOT NULL AND ue.nome IS NOT NULL AND ef.id IS NOT NULL
    THEN 'incompleta'
    ELSE 'pendente'
  END AS status
FROM public.unidades_escolares ue
JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id
WHERE ue.ativo = true;
