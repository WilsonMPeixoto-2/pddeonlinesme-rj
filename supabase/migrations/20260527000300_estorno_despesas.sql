-- Frente Fiscal v1 — Migration 20260527000300
-- Cria a RPC transacional pública para estornar (excluir) despesas fiscais e atualizar gastos de forma atômica.

-- ============================================================================
-- 1. RPC TRANSACIONAL: public.estornar_despesa_fiscal
-- ============================================================================
CREATE OR REPLACE FUNCTION public.estornar_despesa_fiscal(
  p_despesa_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_unidade_id uuid;
  v_exercicio integer;
  v_programa text;
  v_valor numeric(14,2);
  v_has_role boolean;
  v_exists boolean;
BEGIN
  -- 1. Validar privilégio do ator
  v_has_role := public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'operador'::public.app_role);
  
  IF NOT v_has_role THEN
    RAISE EXCEPTION 'Acesso negado: Apenas administradores ou operadores podem estornar despesas.';
  END IF;

  -- 2. Recuperar dados da despesa
  SELECT EXISTS(
    SELECT 1 FROM public.despesas_fiscais WHERE id = p_despesa_id
  ) INTO v_exists;

  IF NOT v_exists THEN
    RAISE EXCEPTION 'Despesa não encontrada para o ID informado.';
  END IF;

  SELECT unidade_id, exercicio, programa, valor
  INTO v_unidade_id, v_exercicio, v_programa, v_valor
  FROM public.despesas_fiscais
  WHERE id = p_despesa_id;

  -- 3. Deletar a despesa da tabela despesas_fiscais
  DELETE FROM public.despesas_fiscais
  WHERE id = p_despesa_id;

  -- 4. Atualizar o gasto total acumulado na tabela unidades_escolares (subtraindo o valor)
  UPDATE public.unidades_escolares
  SET gasto = GREATEST(0, COALESCE(gasto, 0) - v_valor)
  WHERE id = v_unidade_id;

  -- 5. Atualizar o gasto na tabela execucao_financeira (subtraindo o valor)
  UPDATE public.execucao_financeira
  SET gasto = GREATEST(0, COALESCE(gasto, 0) - v_valor),
      updated_at = now()
  WHERE unidade_id = v_unidade_id
    AND exercicio = v_exercicio
    AND programa = v_programa;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.estornar_despesa_fiscal TO authenticated;
