-- Hardening de funções legadas expostas pelo schema public.
-- Mantém somente os RPCs necessários para usuários autenticados e remove
-- execução direta de funções internas de trigger/event trigger.

ALTER FUNCTION public.tg_document_generation_runs_touch_updated()
  SET search_path = pg_catalog, public;

ALTER FUNCTION public.tg_bulk_update_runs_touch_updated()
  SET search_path = pg_catalog, public;

-- RPCs funcionais: nunca anônimos; autenticados permanecem sujeitos às
-- validações de role já implementadas dentro de cada função.
REVOKE EXECUTE ON FUNCTION public.admin_assign_role(text, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.apply_partial_bulk_update(text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.list_admin_users() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_assign_role(text, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_partial_bulk_update(text, text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;

-- Funções exclusivamente internas: não devem ser invocáveis via RPC.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_audit_contas_bancarias() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_audit_unidades_escolares() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_document_generation_runs_touch_updated() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.tg_bulk_update_runs_touch_updated() FROM PUBLIC, anon, authenticated;
