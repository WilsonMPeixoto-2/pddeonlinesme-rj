-- Otimizações de Banco de Dados — PDDE Online 2026
-- Índices para melhorar o tempo de resposta do Dashboard e das consultas rápidas.

-- 1. Índice composto na tabela de execução financeira
-- Melhora significativamente as buscas filtradas e agrupadas por unidade_id, exercicio e programa.
CREATE INDEX IF NOT EXISTS idx_execucao_financeira_unidade_exercicio_prog 
ON public.execucao_financeira(unidade_id, exercicio, programa);

-- 2. Índice composto na tabela de contas bancárias para carregamento de ficha rápida
-- Acelera a junção lateral da view vw_unidade_detalhe que busca a conta principal da unidade.
CREATE INDEX IF NOT EXISTS idx_contas_bancarias_unidade_principal 
ON public.contas_bancarias(unidade_id, principal);
