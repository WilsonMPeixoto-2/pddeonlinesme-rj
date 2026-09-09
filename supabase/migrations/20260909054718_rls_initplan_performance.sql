-- Otimiza políticas RLS legadas sem alterar a autorização efetiva.
-- Chamadas a auth.uid()/has_role são convertidas em initplans por consulta.
-- Também elimina políticas permissivas duplicadas em user_roles e indexa FK de import_logs.

CREATE INDEX IF NOT EXISTS idx_import_logs_user_id
  ON public.import_logs (user_id);

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_authenticated"
  ON public.audit_logs FOR INSERT TO authenticated
  WITH CHECK (actor_id = (SELECT auth.uid()) OR actor_id IS NULL);

DROP POLICY IF EXISTS "audit_logs_select_own_or_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own_or_admin"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    actor_id = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );

DROP POLICY IF EXISTS "bulk_update_items_select_own_run_or_admin" ON public.bulk_update_items;
CREATE POLICY "bulk_update_items_select_own_run_or_admin"
  ON public.bulk_update_items FOR SELECT TO authenticated
  USING (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR EXISTS (
      SELECT 1
      FROM public.bulk_update_runs AS r
      WHERE r.id = bulk_update_items.run_id
        AND r.created_by = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "bulk_update_runs_select_own_or_admin" ON public.bulk_update_runs;
CREATE POLICY "bulk_update_runs_select_own_or_admin"
  ON public.bulk_update_runs FOR SELECT TO authenticated
  USING (
    created_by = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins can delete contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Admins can delete contas_bancarias"
  ON public.contas_bancarias FOR DELETE TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Team can insert contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Team can insert contas_bancarias"
  ON public.contas_bancarias FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Team can update contas_bancarias" ON public.contas_bancarias;
CREATE POLICY "Team can update contas_bancarias"
  ON public.contas_bancarias FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  )
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "doc_gen_runs_insert_admin_operador" ON public.document_generation_runs;
CREATE POLICY "doc_gen_runs_insert_admin_operador"
  ON public.document_generation_runs FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND (
      (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
      OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
    )
  );

DROP POLICY IF EXISTS "doc_gen_runs_select_own_or_admin" ON public.document_generation_runs;
CREATE POLICY "doc_gen_runs_select_own_or_admin"
  ON public.document_generation_runs FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );

DROP POLICY IF EXISTS "doc_gen_runs_update_own_or_admin" ON public.document_generation_runs;
CREATE POLICY "doc_gen_runs_update_own_or_admin"
  ON public.document_generation_runs FOR UPDATE TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins can delete execucao_financeira" ON public.execucao_financeira;
CREATE POLICY "Admins can delete execucao_financeira"
  ON public.execucao_financeira FOR DELETE TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Team can insert execucao_financeira" ON public.execucao_financeira;
CREATE POLICY "Team can insert execucao_financeira"
  ON public.execucao_financeira FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Team can update execucao_financeira" ON public.execucao_financeira;
CREATE POLICY "Team can update execucao_financeira"
  ON public.execucao_financeira FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  )
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Team can insert import_logs" ON public.import_logs;
CREATE POLICY "Team can insert import_logs"
  ON public.import_logs FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins can delete unidades" ON public.unidades_escolares;
CREATE POLICY "Admins can delete unidades"
  ON public.unidades_escolares FOR DELETE TO authenticated
  USING ((SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role)));

DROP POLICY IF EXISTS "Team can insert unidades" ON public.unidades_escolares;
CREATE POLICY "Team can insert unidades"
  ON public.unidades_escolares FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Team can update unidades" ON public.unidades_escolares;
CREATE POLICY "Team can update unidades"
  ON public.unidades_escolares FOR UPDATE TO authenticated
  USING (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  )
  WITH CHECK (
    (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
    OR (SELECT public.has_role((SELECT auth.uid()), 'operador'::public.app_role))
  );

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles or admins read all"
  ON public.user_roles FOR SELECT TO authenticated
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT public.has_role((SELECT auth.uid()), 'admin'::public.app_role))
  );
