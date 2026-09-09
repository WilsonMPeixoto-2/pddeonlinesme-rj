-- Contrato Financeiro PDDE v1 — hardening
--
-- Objetivos:
-- 1. impedir que o cadastro geral reescreva identidade bancária;
-- 2. vincular cada repasse à carga financeira que o produziu;
-- 3. garantir coerência repasse ↔ unidade ↔ programa ↔ conta;
-- 4. validar componentes financeiros quando o detalhamento é conhecido;
-- 5. tornar repasses importados somente leitura para usuários autenticados.

-- ---------------------------------------------------------------------------
-- Cadastro escolar: compatibilidade sem mutação bancária
-- ---------------------------------------------------------------------------
-- Mantém temporariamente a assinatura legada para que o frontend atualmente em
-- produção não quebre durante a transição. Os três parâmetros bancários são
-- deliberadamente ignorados. A assinatura curta é a que o novo frontend usa.

CREATE OR REPLACE FUNCTION public.update_unidade_cadastro_minima(
  p_unidade_id uuid,
  p_nome text,
  p_diretor text,
  p_endereco text,
  p_banco text,
  p_agencia text,
  p_conta_corrente text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'permissao negada: requer role admin ou operador'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1
    FROM public.unidades_escolares
   WHERE id = p_unidade_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unidade nao encontrada: %', p_unidade_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.unidades_escolares
     SET nome = p_nome,
         diretor = p_diretor,
         endereco = p_endereco
   WHERE id = p_unidade_id;

  RETURN p_unidade_id;
END;
$$;

COMMENT ON FUNCTION public.update_unidade_cadastro_minima(
  uuid, text, text, text, text, text, text
) IS
  'Compatibilidade temporaria. Atualiza apenas cadastro escolar; parametros bancarios legados sao ignorados para preservar a identidade das contas.';

CREATE OR REPLACE FUNCTION public.update_unidade_cadastro_minima(
  p_unidade_id uuid,
  p_nome text,
  p_diretor text,
  p_endereco text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'permissao negada: requer role admin ou operador'
      USING ERRCODE = '42501';
  END IF;

  PERFORM 1
    FROM public.unidades_escolares
   WHERE id = p_unidade_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unidade nao encontrada: %', p_unidade_id
      USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.unidades_escolares
     SET nome = p_nome,
         diretor = p_diretor,
         endereco = p_endereco
   WHERE id = p_unidade_id;

  RETURN p_unidade_id;
END;
$$;

COMMENT ON FUNCTION public.update_unidade_cadastro_minima(
  uuid, text, text, text
) IS
  'Atualiza somente dados cadastrais da unidade. Contas bancarias possuem ciclo de vida separado para preservar historico financeiro.';

GRANT EXECUTE ON FUNCTION public.update_unidade_cadastro_minima(
  uuid, text, text, text
) TO authenticated;

-- ---------------------------------------------------------------------------
-- Rastreabilidade por carga
-- ---------------------------------------------------------------------------
ALTER TABLE public.repasses_financeiros
  ADD COLUMN IF NOT EXISTS integracao_run_id uuid;

UPDATE public.repasses_financeiros AS r
   SET integracao_run_id = (
     SELECT ir.id
       FROM public.integracoes_financeiras_runs AS ir
      WHERE ir.exercicio = r.exercicio
      ORDER BY ir.publicado_em DESC NULLS LAST, ir.criado_em DESC
      LIMIT 1
   )
 WHERE r.integracao_run_id IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
      FROM public.repasses_financeiros
     WHERE integracao_run_id IS NULL
  ) THEN
    RAISE EXCEPTION 'nao foi possivel associar todos os repasses a uma integracao financeira';
  END IF;
END;
$$;

ALTER TABLE public.repasses_financeiros
  ALTER COLUMN integracao_run_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'repasses_financeiros_integracao_run_id_fkey'
       AND conrelid = 'public.repasses_financeiros'::regclass
  ) THEN
    ALTER TABLE public.repasses_financeiros
      ADD CONSTRAINT repasses_financeiros_integracao_run_id_fkey
      FOREIGN KEY (integracao_run_id)
      REFERENCES public.integracoes_financeiras_runs(id)
      ON DELETE RESTRICT;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_repasses_financeiros_integracao_run_id
  ON public.repasses_financeiros (integracao_run_id);

-- ---------------------------------------------------------------------------
-- Integridade dos componentes
-- ---------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'repasses_financeiros_componentes_programados_check'
       AND conrelid = 'public.repasses_financeiros'::regclass
  ) THEN
    ALTER TABLE public.repasses_financeiros
      ADD CONSTRAINT repasses_financeiros_componentes_programados_check
      CHECK (
        custeio_programado IS NULL
        OR capital_programado IS NULL
        OR custeio_programado + capital_programado = valor_programado
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'repasses_financeiros_componentes_pagos_check'
       AND conrelid = 'public.repasses_financeiros'::regclass
  ) THEN
    ALTER TABLE public.repasses_financeiros
      ADD CONSTRAINT repasses_financeiros_componentes_pagos_check
      CHECK (
        custeio_pago IS NULL
        OR capital_pago IS NULL
        OR (
          valor_pago IS NOT NULL
          AND custeio_pago + capital_pago = valor_pago
        )
      );
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- Coerência entre repasse e conta
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validate_repasses_financeiros_account()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_unidade_id uuid;
  v_programa text;
BEGIN
  IF NEW.conta_bancaria_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT cb.unidade_id, cb.programa
    INTO v_unidade_id, v_programa
    FROM public.contas_bancarias AS cb
   WHERE cb.id = NEW.conta_bancaria_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'conta bancaria inexistente: %', NEW.conta_bancaria_id
      USING ERRCODE = '23503';
  END IF;

  IF v_unidade_id IS DISTINCT FROM NEW.unidade_id THEN
    RAISE EXCEPTION 'conta bancaria pertence a outra unidade'
      USING ERRCODE = '23514';
  END IF;

  IF v_programa IS NOT NULL AND v_programa IS DISTINCT FROM NEW.programa THEN
    RAISE EXCEPTION 'programa da conta bancaria diverge do programa do repasse'
      USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_repasses_financeiros_account
  ON public.repasses_financeiros;

CREATE TRIGGER trg_validate_repasses_financeiros_account
  BEFORE INSERT OR UPDATE OF conta_bancaria_id, unidade_id, programa
  ON public.repasses_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_repasses_financeiros_account();

-- ---------------------------------------------------------------------------
-- Repasses importados são leitura operacional
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Team can insert repasses_financeiros"
  ON public.repasses_financeiros;
DROP POLICY IF EXISTS "Team can update repasses_financeiros"
  ON public.repasses_financeiros;
DROP POLICY IF EXISTS "Admins can delete repasses_financeiros"
  ON public.repasses_financeiros;

-- A policy SELECT criada na integração v1 permanece. Cargas controladas usam
-- contexto privilegiado de backend/Edge Function; a interface autenticada não
-- altera diretamente valores importados.
