-- Frente Fiscal v1 — Migration 20260527000200
-- Cria tabela de despesas fiscais homologadas, triggers de auditoria automatizados
-- e a RPC transacional pública para homologar e atualizar gastos de forma atômica.

-- ============================================================================
-- 1. TABELA: despesas_fiscais
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.despesas_fiscais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES public.unidades_escolares(id) ON DELETE RESTRICT,
  exercicio integer NOT NULL,
  fornecedor_cnpj text NOT NULL,
  fornecedor_nome text NOT NULL,
  numero_nota text NOT NULL,
  chave_acesso text,
  data_emissao date NOT NULL,
  valor numeric(14,2) NOT NULL CHECK (valor >= 0),
  tipo_gasto text NOT NULL CHECK (tipo_gasto IN ('custeio', 'capital')),
  programa text NOT NULL DEFAULT 'basico',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_despesas_fiscais_unidade_exercicio
  ON public.despesas_fiscais (unidade_id, exercicio);

CREATE INDEX IF NOT EXISTS idx_despesas_fiscais_cnpj
  ON public.despesas_fiscais (fornecedor_cnpj);

-- ============================================================================
-- 2. SEGURANÇA: Row Level Security (RLS)
-- ============================================================================
ALTER TABLE public.despesas_fiscais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read despesas_fiscais"
  ON public.despesas_fiscais FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team can insert despesas_fiscais"
  ON public.despesas_fiscais FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Team can update despesas_fiscais"
  ON public.despesas_fiscais FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Admins can delete despesas_fiscais"
  ON public.despesas_fiscais FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- ============================================================================
-- 3. AUDITORIA: Trigger de Auditoria Nativada
-- ============================================================================
CREATE OR REPLACE FUNCTION public.tg_audit_despesas_fiscais()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor UUID := auth.uid();
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value, source
    ) VALUES (
      v_actor, 'insert', 'despesas_fiscais', NEW.id,
      NULL, NULL, to_jsonb(NEW), 'trigger'
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value, source
    ) VALUES (
      v_actor, 'delete', 'despesas_fiscais', OLD.id,
      NULL, to_jsonb(OLD), NULL, 'trigger'
    );
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.fornecedor_cnpj IS DISTINCT FROM NEW.fornecedor_cnpj THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'despesas_fiscais', NEW.id, 'fornecedor_cnpj', to_jsonb(OLD.fornecedor_cnpj), to_jsonb(NEW.fornecedor_cnpj), 'trigger');
    END IF;

    IF OLD.fornecedor_nome IS DISTINCT FROM NEW.fornecedor_nome THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'despesas_fiscais', NEW.id, 'fornecedor_nome', to_jsonb(OLD.fornecedor_nome), to_jsonb(NEW.fornecedor_nome), 'trigger');
    END IF;

    IF OLD.numero_nota IS DISTINCT FROM NEW.numero_nota THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'despesas_fiscais', NEW.id, 'numero_nota', to_jsonb(OLD.numero_nota), to_jsonb(NEW.numero_nota), 'trigger');
    END IF;

    IF OLD.valor IS DISTINCT FROM NEW.valor THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'despesas_fiscais', NEW.id, 'valor', to_jsonb(OLD.valor), to_jsonb(NEW.valor), 'trigger');
    END IF;

    IF OLD.tipo_gasto IS DISTINCT FROM NEW.tipo_gasto THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'despesas_fiscais', NEW.id, 'tipo_gasto', to_jsonb(OLD.tipo_gasto), to_jsonb(NEW.tipo_gasto), 'trigger');
    END IF;

    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_despesas_fiscais ON public.despesas_fiscais;
CREATE TRIGGER trg_audit_despesas_fiscais
  AFTER INSERT OR UPDATE OR DELETE ON public.despesas_fiscais
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_despesas_fiscais();

-- ============================================================================
-- 4. RPC TRANSACIONAL: public.homologar_despesa_fiscal
-- ============================================================================
CREATE OR REPLACE FUNCTION public.homologar_despesa_fiscal(
  p_unidade_id uuid,
  p_exercicio integer,
  p_fornecedor_cnpj text,
  p_fornecedor_nome text,
  p_numero_nota text,
  p_chave_acesso text,
  p_data_emissao date,
  p_valor numeric(14,2),
  p_tipo_gasto text,
  p_programa text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_despesa_id uuid;
  v_has_role boolean;
BEGIN
  -- 1. Validar privilégio do ator
  v_has_role := public.has_role(auth.uid(), 'admin'::public.app_role)
                OR public.has_role(auth.uid(), 'operador'::public.app_role);
  
  IF NOT v_has_role THEN
    RAISE EXCEPTION 'Acesso negado: Apenas administradores ou operadores podem homologar despesas.';
  END IF;

  -- 2. Inserir a despesa na tabela despesas_fiscais
  INSERT INTO public.despesas_fiscais (
    unidade_id, exercicio, fornecedor_cnpj, fornecedor_nome,
    numero_nota, chave_acesso, data_emissao, valor, tipo_gasto, programa
  ) VALUES (
    p_unidade_id, p_exercicio, p_fornecedor_cnpj, p_fornecedor_nome,
    p_numero_nota, p_chave_acesso, p_data_emissao, p_valor, p_tipo_gasto, p_programa
  ) RETURNING id INTO v_despesa_id;

  -- 3. Atualizar o gasto total acumulado na tabela unidades_escolares
  UPDATE public.unidades_escolares
  SET gasto = COALESCE(gasto, 0) + p_valor
  WHERE id = p_unidade_id;

  -- 4. Atualizar o gasto na tabela execucao_financeira
  INSERT INTO public.execucao_financeira (
    unidade_id, exercicio, programa, gasto
  ) VALUES (
    p_unidade_id, p_exercicio, p_programa, p_valor
  )
  ON CONFLICT (unidade_id, exercicio, programa)
  DO UPDATE SET
    gasto = COALESCE(public.execucao_financeira.gasto, 0) + EXCLUDED.gasto,
    updated_at = now();

  RETURN v_despesa_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.homologar_despesa_fiscal TO authenticated;
