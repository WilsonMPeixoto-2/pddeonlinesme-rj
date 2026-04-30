-- Foundation v1 — Migration 1/4
-- Adiciona coluna `nome` separada de `designacao` na tabela unidades_escolares.
-- Mantém todas as colunas existentes intactas (additive only).
-- Critério Issue #13: "designacao e nome permanecem separados".

ALTER TABLE public.unidades_escolares
  ADD COLUMN IF NOT EXISTS nome text;

CREATE INDEX IF NOT EXISTS idx_unidades_nome
  ON public.unidades_escolares (nome);
