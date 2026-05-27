-- Expansão de Atualização em Lote (Whitelist de E-mail e Endereço)
--
-- Redefine a RPC apply_partial_bulk_update para:
-- 1. Suportar a whitelist ampliada: 'diretor', 'email' e 'endereco'.
-- 2. Definir a variável de transação 'app.current_bulk_run_id' para que as triggers
--    nativas do Postgres saibam que é uma operação de lote e não dupliquem logs.
-- 3. Atualizar dinamicamente a coluna correta de forma imune a injeções SQL.

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

  -- Define a variável de transação para as triggers de auditoria saberem que
  -- é uma corrida bulk e não gerarem logs de alteração duplicados.
  PERFORM set_config('app.current_bulk_run_id', v_run_id::text, true);

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

    -- Whitelist expandida: 'diretor', 'email' ou 'endereco'
    IF v_field_name IS NULL OR v_field_name NOT IN ('diretor', 'email', 'endereco') THEN
      v_item_status := 'error_validation';
      v_item_message := format(
        'campo "%s" nao permitido (apenas diretor, email, endereco)',
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

    -- Captura valor anterior para audit e trava a linha para update
    IF v_field_name = 'diretor' THEN
      SELECT diretor INTO v_old_value FROM public.unidades_escolares WHERE id = v_unidade_id FOR UPDATE;
    ELSIF v_field_name = 'email' THEN
      SELECT email INTO v_old_value FROM public.unidades_escolares WHERE id = v_unidade_id FOR UPDATE;
    ELSIF v_field_name = 'endereco' THEN
      SELECT endereco INTO v_old_value FROM public.unidades_escolares WHERE id = v_unidade_id FOR UPDATE;
    END IF;

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

    -- Aplicar UPDATE conforme o campo
    IF v_field_name = 'diretor' THEN
      UPDATE public.unidades_escolares SET diretor = v_new_value WHERE id = v_unidade_id;
    ELSIF v_field_name = 'email' THEN
      UPDATE public.unidades_escolares SET email = v_new_value WHERE id = v_unidade_id;
    ELSIF v_field_name = 'endereco' THEN
      UPDATE public.unidades_escolares SET endereco = v_new_value WHERE id = v_unidade_id;
    END IF;

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
  'Redefinida para suportar a whitelist expandida (diretor, email, endereco) e bypass de trigger de auditoria.';
