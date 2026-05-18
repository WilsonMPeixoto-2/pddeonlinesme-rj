-- Marco 10B v2 — Atualizacao Parcial Assistida da BASE
--
-- Cria infraestrutura minima de auditoria + tabelas de bulk update + RPC
-- transacional para aplicar atualizacoes parciais de cadastro a partir de
-- planilhas enxutas. v1 limita o escopo a um unico campo alteravel:
-- "diretor". A whitelist e aplicada tanto no cliente quanto na RPC como
-- defesa em profundidade.
--
-- Tres tabelas novas:
--
--   1. audit_logs (generica) — registra alteracao efetiva no dado, com
--      antes/depois. Aceita uso por outras features (cadastro individual,
--      futura RPC de roles etc.).
--   2. bulk_update_runs — registra cada corrida de atualizacao em lote
--      (arquivo, hash, contagens, status).
--   3. bulk_update_items — registra cada linha processada no upload.
--
-- Uma RPC: apply_partial_bulk_update — aplica em transacao, com
-- enforcement de whitelist no SQL.

-- ============================================================================
-- TABELA 1: audit_logs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'insert', 'update', 'delete', 'bulk_update', 'system'
  )),

  table_name TEXT NOT NULL,
  record_id UUID,
  field_name TEXT,
  old_value JSONB,
  new_value JSONB,

  source TEXT,
  source_run_id UUID,

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record
  ON public.audit_logs (table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_source_run
  ON public.audit_logs (source_run_id)
  WHERE source_run_id IS NOT NULL;

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_own_or_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (
    actor_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    actor_id = auth.uid()
    OR actor_id IS NULL
  );

COMMENT ON TABLE public.audit_logs IS
  'Marco 10B v2. Trilha generica de auditoria. Cada linha registra uma
   alteracao efetiva em uma tabela do dominio publico. Usada inicialmente
   pelo bulk update parcial; pode ser estendida para outras mutacoes
   sensiveis (cadastro individual, atribuicao de papeis, etc).';

-- ============================================================================
-- TABELA 2: bulk_update_runs
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bulk_update_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  created_by UUID NOT NULL DEFAULT auth.uid()
    REFERENCES auth.users(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_hash TEXT NOT NULL,

  mode TEXT NOT NULL DEFAULT 'partial_update'
    CHECK (mode IN ('partial_update')),
  target_table TEXT NOT NULL DEFAULT 'unidades_escolares',

  total_rows INT NOT NULL CHECK (total_rows >= 0),
  applied_count INT NOT NULL DEFAULT 0 CHECK (applied_count >= 0),
  skipped_count INT NOT NULL DEFAULT 0 CHECK (skipped_count >= 0),
  error_count INT NOT NULL DEFAULT 0 CHECK (error_count >= 0),

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'applied', 'failed', 'partial')),

  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_bulk_update_runs_creator
  ON public.bulk_update_runs (created_by, created_at DESC);

ALTER TABLE public.bulk_update_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_update_runs_select_own_or_admin"
  ON public.bulk_update_runs
  FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- INSERT/UPDATE so via RPC (que e SECURITY DEFINER). Nao criamos policy
-- de INSERT direto para evitar bypass.

CREATE OR REPLACE FUNCTION public.tg_bulk_update_runs_touch_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bulk_update_runs_touch_updated
  ON public.bulk_update_runs;

CREATE TRIGGER trg_bulk_update_runs_touch_updated
  BEFORE UPDATE ON public.bulk_update_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_bulk_update_runs_touch_updated();

COMMENT ON TABLE public.bulk_update_runs IS
  'Marco 10B v2. Cada corrida de atualizacao parcial em lote da BASE.
   1 linha por upload. Status reflete o resultado da aplicacao
   transacional via apply_partial_bulk_update.';

-- ============================================================================
-- TABELA 3: bulk_update_items
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.bulk_update_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  run_id UUID NOT NULL REFERENCES public.bulk_update_runs(id) ON DELETE CASCADE,
  row_number INT NOT NULL,

  unidade_id UUID REFERENCES public.unidades_escolares(id) ON DELETE SET NULL,

  key_type TEXT NOT NULL,
  key_value TEXT NOT NULL,

  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,

  status TEXT NOT NULL
    CHECK (status IN ('applied', 'skipped_unchanged', 'error_not_found',
                      'error_ambiguous', 'error_key_mismatch',
                      'error_duplicate_key', 'error_validation',
                      'error_permission', 'error_other')),

  message TEXT,
  raw_payload JSONB
);

CREATE INDEX IF NOT EXISTS idx_bulk_update_items_run
  ON public.bulk_update_items (run_id, row_number);

CREATE INDEX IF NOT EXISTS idx_bulk_update_items_unidade
  ON public.bulk_update_items (unidade_id, created_at DESC)
  WHERE unidade_id IS NOT NULL;

ALTER TABLE public.bulk_update_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_update_items_select_own_run_or_admin"
  ON public.bulk_update_items
  FOR SELECT
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.bulk_update_runs r
       WHERE r.id = bulk_update_items.run_id
         AND r.created_by = auth.uid()
    )
  );

COMMENT ON TABLE public.bulk_update_items IS
  'Marco 10B v2. Cada linha do arquivo de upload, com seu resultado de
   aplicacao. Permite reconstruir auditoria detalhada de uma corrida sem
   poluir audit_logs com itens sem alteracao efetiva.';

-- ============================================================================
-- RPC: apply_partial_bulk_update
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_partial_bulk_update(
  p_file_name TEXT,
  p_file_hash TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_run_id UUID;
  v_actor UUID := auth.uid();
  v_total INT;
  v_applied INT := 0;
  v_skipped INT := 0;
  v_errors INT := 0;
  v_status TEXT;
  v_item JSONB;
  v_row_number INT;
  v_unidade_id UUID;
  v_field_name TEXT;
  v_new_value TEXT;
  v_old_value TEXT;
  v_key_type TEXT;
  v_key_value TEXT;
  v_item_status TEXT;
  v_item_message TEXT;
BEGIN
  -- Defesa em profundidade: caller precisa ser admin ou operador.
  IF NOT (
    public.has_role(v_actor, 'admin'::public.app_role)
    OR public.has_role(v_actor, 'operador'::public.app_role)
  ) THEN
    RAISE EXCEPTION 'permissao negada: requer role admin ou operador'
      USING ERRCODE = '42501';
  END IF;

  -- Validacao basica do payload.
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'p_items deve ser um array JSON'
      USING ERRCODE = '22023';
  END IF;

  v_total := jsonb_array_length(p_items);

  IF v_total = 0 THEN
    RAISE EXCEPTION 'p_items nao pode estar vazio'
      USING ERRCODE = '22023';
  END IF;

  IF v_total > 200 THEN
    RAISE EXCEPTION 'limite v1: maximo 200 itens por corrida (recebido %)', v_total
      USING ERRCODE = '22023';
  END IF;

  IF p_file_name IS NULL OR length(trim(p_file_name)) = 0 THEN
    RAISE EXCEPTION 'p_file_name obrigatorio'
      USING ERRCODE = '23502';
  END IF;

  IF p_file_hash IS NULL OR length(trim(p_file_hash)) = 0 THEN
    RAISE EXCEPTION 'p_file_hash obrigatorio'
      USING ERRCODE = '23502';
  END IF;

  -- Cria corrida em status pending.
  INSERT INTO public.bulk_update_runs (
    created_by, file_name, file_hash, total_rows, status
  ) VALUES (
    v_actor, p_file_name, p_file_hash, v_total, 'pending'
  )
  RETURNING id INTO v_run_id;

  -- Itera os itens e aplica.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_row_number := COALESCE((v_item->>'rowNumber')::INT, -1);
    v_unidade_id := NULLIF(v_item->>'unidadeId', '')::UUID;
    v_field_name := v_item->>'field';
    v_new_value := v_item->>'newValue';
    v_key_type := v_item->>'keyType';
    v_key_value := v_item->>'keyValue';
    v_item_status := 'error_other';
    v_item_message := NULL;
    v_old_value := NULL;

    -- Whitelist v1: SOMENTE o campo "diretor" pode ser atualizado.
    IF v_field_name IS NULL OR v_field_name NOT IN ('diretor') THEN
      v_item_status := 'error_validation';
      v_item_message := format(
        'campo "%s" nao permitido no v1 (apenas diretor)',
        COALESCE(v_field_name, '<null>')
      );
      v_errors := v_errors + 1;

      INSERT INTO public.bulk_update_items (
        run_id, row_number, unidade_id,
        key_type, key_value,
        field_name, old_value, new_value,
        status, message, raw_payload
      ) VALUES (
        v_run_id, v_row_number, v_unidade_id,
        COALESCE(v_key_type, ''), COALESCE(v_key_value, ''),
        COALESCE(v_field_name, ''), NULL, v_new_value,
        v_item_status, v_item_message, v_item
      );

      CONTINUE;
    END IF;

    -- Validacao do unidade_id.
    IF v_unidade_id IS NULL THEN
      v_item_status := 'error_not_found';
      v_item_message := 'unidade_id ausente no payload';
      v_errors := v_errors + 1;

      INSERT INTO public.bulk_update_items (
        run_id, row_number, unidade_id,
        key_type, key_value,
        field_name, old_value, new_value,
        status, message, raw_payload
      ) VALUES (
        v_run_id, v_row_number, NULL,
        COALESCE(v_key_type, ''), COALESCE(v_key_value, ''),
        v_field_name, NULL, v_new_value,
        v_item_status, v_item_message, v_item
      );

      CONTINUE;
    END IF;

    -- Captura valor anterior para audit.
    SELECT diretor INTO v_old_value
      FROM public.unidades_escolares
     WHERE id = v_unidade_id
     FOR UPDATE;

    IF NOT FOUND THEN
      v_item_status := 'error_not_found';
      v_item_message := format('unidade %s nao encontrada', v_unidade_id);
      v_errors := v_errors + 1;

      INSERT INTO public.bulk_update_items (
        run_id, row_number, unidade_id,
        key_type, key_value,
        field_name, old_value, new_value,
        status, message, raw_payload
      ) VALUES (
        v_run_id, v_row_number, v_unidade_id,
        COALESCE(v_key_type, ''), COALESCE(v_key_value, ''),
        v_field_name, NULL, v_new_value,
        v_item_status, v_item_message, v_item
      );

      CONTINUE;
    END IF;

    -- Se valor antigo igual ao novo (apos trim/normalizacao basica),
    -- pula sem aplicar.
    IF COALESCE(trim(v_old_value), '') = COALESCE(trim(v_new_value), '') THEN
      v_item_status := 'skipped_unchanged';
      v_skipped := v_skipped + 1;

      INSERT INTO public.bulk_update_items (
        run_id, row_number, unidade_id,
        key_type, key_value,
        field_name, old_value, new_value,
        status, message, raw_payload
      ) VALUES (
        v_run_id, v_row_number, v_unidade_id,
        COALESCE(v_key_type, ''), COALESCE(v_key_value, ''),
        v_field_name, v_old_value, v_new_value,
        v_item_status, NULL, v_item
      );

      CONTINUE;
    END IF;

    -- Aplicar UPDATE.
    UPDATE public.unidades_escolares
       SET diretor = v_new_value
     WHERE id = v_unidade_id;

    v_applied := v_applied + 1;
    v_item_status := 'applied';

    INSERT INTO public.bulk_update_items (
      run_id, row_number, unidade_id,
      key_type, key_value,
      field_name, old_value, new_value,
      status, message, raw_payload
    ) VALUES (
      v_run_id, v_row_number, v_unidade_id,
      COALESCE(v_key_type, ''), COALESCE(v_key_value, ''),
      v_field_name, v_old_value, v_new_value,
      v_item_status, NULL, v_item
    );

    -- Audit log do dado alterado.
    INSERT INTO public.audit_logs (
      actor_id, action, table_name, record_id,
      field_name, old_value, new_value,
      source, source_run_id, metadata
    ) VALUES (
      v_actor, 'bulk_update', 'unidades_escolares', v_unidade_id,
      v_field_name, to_jsonb(v_old_value), to_jsonb(v_new_value),
      'partial_bulk_update', v_run_id,
      jsonb_build_object(
        'file_name', p_file_name,
        'file_hash', p_file_hash,
        'row_number', v_row_number,
        'key_type', v_key_type,
        'key_value', v_key_value
      )
    );
  END LOOP;

  -- Determinar status final da corrida.
  IF v_errors = 0 AND v_applied > 0 THEN
    v_status := 'applied';
  ELSIF v_errors = 0 AND v_applied = 0 THEN
    v_status := 'applied'; -- todas eram unchanged, mas o run e sucesso
  ELSIF v_applied > 0 THEN
    v_status := 'partial';
  ELSE
    v_status := 'failed';
  END IF;

  UPDATE public.bulk_update_runs
     SET applied_count = v_applied,
         skipped_count = v_skipped,
         error_count = v_errors,
         status = v_status
   WHERE id = v_run_id;

  RETURN jsonb_build_object(
    'run_id', v_run_id,
    'status', v_status,
    'total', v_total,
    'applied', v_applied,
    'skipped', v_skipped,
    'errors', v_errors
  );
END;
$$;

COMMENT ON FUNCTION public.apply_partial_bulk_update(TEXT, TEXT, JSONB) IS
  'Marco 10B v2. Aplica atualizacoes parciais a public.unidades_escolares em
   uma transacao SQL. Whitelist v1: somente o campo "diretor". Caller precisa
   ser admin ou operador. Para cada item aplicado, registra audit_logs e
   bulk_update_items. Retorna JSON com run_id, status e contagens.';

GRANT EXECUTE ON FUNCTION public.apply_partial_bulk_update(TEXT, TEXT, JSONB)
  TO authenticated;
