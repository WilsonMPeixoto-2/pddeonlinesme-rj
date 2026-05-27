-- Sub-Marco 6B — Trilha de Auditoria Automática por Triggers Postgres
--
-- Cria triggers de auditoria nas tabelas unidades_escolares e contas_bancarias.
-- Registra inserções, atualizações e exclusões de forma nativa e automática.
-- Evita duplicações em corridas de bulk update verificando a variável de
-- transação 'app.current_bulk_run_id'.

-- ============================================================================
-- 1. TRIGGER FUNCTION: unidades_escolares
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tg_audit_unidades_escolares()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_actor UUID := auth.uid();
  v_bulk_run_id TEXT := current_setting('app.current_bulk_run_id', true);
BEGIN
  -- Se for uma corrida de bulk update, ignoramos no trigger porque a RPC
  -- apply_partial_bulk_update já insere manualmente no audit_logs
  -- com metadados adicionais específicos da corrida.
  IF v_bulk_run_id IS NOT NULL THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    ELSE
      RETURN NEW;
    END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value, source
    ) VALUES (
      v_actor, 'insert', 'unidades_escolares', NEW.id,
      NULL, NULL, to_jsonb(NEW), 'trigger'
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value, source
    ) VALUES (
      v_actor, 'delete', 'unidades_escolares', OLD.id,
      NULL, to_jsonb(OLD), NULL, 'trigger'
    );
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    -- Comparamos cada coluna alterável relevante e inserimos logs individuais
    -- para consistência estrutural com o restante do audit system.
    IF OLD.designacao IS DISTINCT FROM NEW.designacao THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'designacao', to_jsonb(OLD.designacao), to_jsonb(NEW.designacao), 'trigger');
    END IF;

    IF OLD.nome IS DISTINCT FROM NEW.nome THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'nome', to_jsonb(OLD.nome), to_jsonb(NEW.nome), 'trigger');
    END IF;

    IF OLD.inep IS DISTINCT FROM NEW.inep THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'inep', to_jsonb(OLD.inep), to_jsonb(NEW.inep), 'trigger');
    END IF;

    IF OLD.cnpj IS DISTINCT FROM NEW.cnpj THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'cnpj', to_jsonb(OLD.cnpj), to_jsonb(NEW.cnpj), 'trigger');
    END IF;

    IF OLD.diretor IS DISTINCT FROM NEW.diretor THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'diretor', to_jsonb(OLD.diretor), to_jsonb(NEW.diretor), 'trigger');
    END IF;

    IF OLD.email IS DISTINCT FROM NEW.email THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'email', to_jsonb(OLD.email), to_jsonb(NEW.email), 'trigger');
    END IF;

    IF OLD.endereco IS DISTINCT FROM NEW.endereco THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'endereco', to_jsonb(OLD.endereco), to_jsonb(NEW.endereco), 'trigger');
    END IF;

    IF OLD.alunos IS DISTINCT FROM NEW.alunos THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'alunos', to_jsonb(OLD.alunos), to_jsonb(NEW.alunos), 'trigger');
    END IF;

    IF OLD.saldo_anterior IS DISTINCT FROM NEW.saldo_anterior THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'saldo_anterior', to_jsonb(OLD.saldo_anterior), to_jsonb(NEW.saldo_anterior), 'trigger');
    END IF;

    IF OLD.recebido IS DISTINCT FROM NEW.recebido THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'recebido', to_jsonb(OLD.recebido), to_jsonb(NEW.recebido), 'trigger');
    END IF;

    IF OLD.gasto IS DISTINCT FROM NEW.gasto THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'unidades_escolares', NEW.id, 'gasto', to_jsonb(OLD.gasto), to_jsonb(NEW.gasto), 'trigger');
    END IF;

    RETURN NEW;
  END IF;
END;
$$;

-- BIND TRIGGER: unidades_escolares
DROP TRIGGER IF EXISTS trg_audit_unidades_escolares ON public.unidades_escolares;
CREATE TRIGGER trg_audit_unidades_escolares
  AFTER INSERT OR UPDATE OR DELETE ON public.unidades_escolares
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_unidades_escolares();

-- ============================================================================
-- 2. TRIGGER FUNCTION: contas_bancarias
-- ============================================================================

CREATE OR REPLACE FUNCTION public.tg_audit_contas_bancarias()
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
      v_actor, 'insert', 'contas_bancarias', NEW.id,
      NULL, NULL, to_jsonb(NEW), 'trigger'
    );
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value, source
    ) VALUES (
      v_actor, 'delete', 'contas_bancarias', OLD.id,
      NULL, to_jsonb(OLD), NULL, 'trigger'
    );
    RETURN OLD;

  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.banco IS DISTINCT FROM NEW.banco THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'contas_bancarias', NEW.id, 'banco', to_jsonb(OLD.banco), to_jsonb(NEW.banco), 'trigger');
    END IF;

    IF OLD.agencia IS DISTINCT FROM NEW.agencia THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'contas_bancarias', NEW.id, 'agencia', to_jsonb(OLD.agencia), to_jsonb(NEW.agencia), 'trigger');
    END IF;

    IF OLD.conta_corrente IS DISTINCT FROM NEW.conta_corrente THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'contas_bancarias', NEW.id, 'conta_corrente', to_jsonb(OLD.conta_corrente), to_jsonb(NEW.conta_corrente), 'trigger');
    END IF;

    IF OLD.principal IS DISTINCT FROM NEW.principal THEN
      INSERT INTO public.audit_logs (actor_id, action, table_name, record_id, field_name, old_value, new_value, source)
      VALUES (v_actor, 'update', 'contas_bancarias', NEW.id, 'principal', to_jsonb(OLD.principal), to_jsonb(NEW.principal), 'trigger');
    END IF;

    RETURN NEW;
  END IF;
END;
$$;

-- BIND TRIGGER: contas_bancarias
DROP TRIGGER IF EXISTS trg_audit_contas_bancarias ON public.contas_bancarias;
CREATE TRIGGER trg_audit_contas_bancarias
  AFTER INSERT OR UPDATE OR DELETE ON public.contas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.tg_audit_contas_bancarias();
