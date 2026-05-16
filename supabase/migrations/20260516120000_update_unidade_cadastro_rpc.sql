-- Foundation v1 — RPC atomica para edicao cadastral Fase 2B
-- Substitui salvamento em duas etapas (unidades_escolares + contas_bancarias)
-- por uma unica transacao SQL. Resolve risco de estado parcial quando a
-- segunda escrita falha por RLS, rede ou timeout entre as duas chamadas.
--
-- SECURITY INVOKER: respeita policies existentes em unidades_escolares
-- (migration 20260421041017) e contas_bancarias (migration 20260430000300).
-- Ambas policies exigem role admin ou operador via has_role().
--
-- Checagem explicita de role dentro da funcao funciona como defesa em
-- profundidade — protege contra mudanca futura de policy que afrouxar acesso.

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
DECLARE
  v_conta_id uuid;
BEGIN
  -- Defesa em profundidade: exige role admin ou operador mesmo que RLS mude.
  IF NOT (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'permissao negada: requer role admin ou operador'
      USING ERRCODE = '42501';
  END IF;

  -- Lock row da unidade durante a transacao para evitar race entre RPCs
  -- simultaneas sobre a mesma unidade (ex: dois operadores editando ao mesmo
  -- tempo). RLS USING clause aplica aqui via SECURITY INVOKER.
  PERFORM 1
    FROM public.unidades_escolares
   WHERE id = p_unidade_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'unidade nao encontrada: %', p_unidade_id
      USING ERRCODE = 'P0002';
  END IF;

  -- UPDATE cadastral. Campos legados em unidades_escolares (agencia,
  -- conta_corrente) sao mantidos sincronizados para preservar fallback do
  -- COALESCE em vw_unidade_detalhe.
  UPDATE public.unidades_escolares
     SET nome = p_nome,
         diretor = p_diretor,
         endereco = p_endereco,
         agencia = p_agencia,
         conta_corrente = p_conta_corrente
   WHERE id = p_unidade_id;

  -- Localiza conta principal existente. Ordem identica a do hook anterior
  -- para preservar comportamento: principal DESC, updated_at DESC,
  -- created_at DESC. Lock row durante o resto da transacao.
  SELECT id INTO v_conta_id
    FROM public.contas_bancarias
   WHERE unidade_id = p_unidade_id
   ORDER BY principal DESC, updated_at DESC, created_at DESC
   LIMIT 1
   FOR UPDATE;

  IF v_conta_id IS NOT NULL THEN
    -- Atualiza conta principal existente.
    UPDATE public.contas_bancarias
       SET banco = p_banco,
           agencia = p_agencia,
           conta_corrente = p_conta_corrente,
           principal = true
     WHERE id = v_conta_id;
  ELSIF p_banco IS NOT NULL
        OR p_agencia IS NOT NULL
        OR p_conta_corrente IS NOT NULL THEN
    -- Cria nova conta principal apenas se ha pelo menos um dado bancario.
    -- Mantem comportamento do hook anterior (que so inseria com hasContaData).
    INSERT INTO public.contas_bancarias
      (unidade_id, banco, agencia, conta_corrente, principal)
    VALUES
      (p_unidade_id, p_banco, p_agencia, p_conta_corrente, true);
  END IF;

  RETURN p_unidade_id;
END;
$$;

COMMENT ON FUNCTION public.update_unidade_cadastro_minima(
  uuid, text, text, text, text, text, text
) IS
  'Atomic cadastral update for Fase 2B. Updates unidades_escolares and either
   updates the principal conta_bancaria or inserts a new one. Caller must be
   admin or operador (RLS plus explicit role check in function body). Rolls
   back automatically if any step raises.';

GRANT EXECUTE ON FUNCTION public.update_unidade_cadastro_minima(
  uuid, text, text, text, text, text, text
) TO authenticated;
