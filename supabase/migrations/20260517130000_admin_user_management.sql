-- Marco 6B v0 — Gestao administrativa de usuarios e roles via UI
--
-- Habilita admins (via has_role) a listar, atribuir e revogar roles de
-- outros usuarios diretamente pela interface do PDDE Online, sem precisar
-- de SQL manual ou service_role no navegador. Tres operacoes:
--
--   1. list_admin_users() — retorna usuarios + roles agregados para admin
--   2. admin_assign_role(email, role) — atribui role a usuario existente
--   3. admin_revoke_role(user_id, role) — remove role; proibe self-lockout
--
-- Padrao SECURITY DEFINER com checagem explicita de role no inicio de
-- cada funcao. Mantem auth.users fora do alcance direto do cliente.

CREATE OR REPLACE FUNCTION public.list_admin_users()
RETURNS TABLE (
  user_id uuid,
  email text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  email_confirmed_at timestamptz,
  roles text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permissao negada: somente admin pode listar usuarios'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    u.created_at,
    u.last_sign_in_at,
    u.email_confirmed_at,
    COALESCE(
      (
        SELECT array_agg(ur.role::text ORDER BY ur.role)
          FROM public.user_roles ur
         WHERE ur.user_id = u.id
      ),
      ARRAY[]::text[]
    )
  FROM auth.users u
  ORDER BY u.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.list_admin_users() TO authenticated;

COMMENT ON FUNCTION public.list_admin_users() IS
  'Marco 6B v0. Retorna usuarios autenticados com roles agregados.
   Acesso restrito a callers com role admin (validado no inicio).
   Padrao SECURITY DEFINER para acessar auth.users sem expor a tabela.';

CREATE OR REPLACE FUNCTION public.admin_assign_role(
  p_email text,
  p_role public.app_role
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permissao negada: somente admin pode atribuir roles'
      USING ERRCODE = '42501';
  END IF;

  IF p_email IS NULL OR length(trim(p_email)) = 0 THEN
    RAISE EXCEPTION 'email obrigatorio'
      USING ERRCODE = '23502';
  END IF;

  SELECT id INTO v_user_id
    FROM auth.users
   WHERE lower(email) = lower(trim(p_email))
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'usuario nao encontrado: %', p_email
      USING ERRCODE = 'P0002';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_user_id, p_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN v_user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_role(text, public.app_role) TO authenticated;

COMMENT ON FUNCTION public.admin_assign_role(text, public.app_role) IS
  'Marco 6B v0. Atribui role a usuario existente identificado por email.
   Idempotente via ON CONFLICT DO NOTHING. Caller deve ser admin.';

CREATE OR REPLACE FUNCTION public.admin_revoke_role(
  p_user_id uuid,
  p_role public.app_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_deleted boolean;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'permissao negada: somente admin pode revogar roles'
      USING ERRCODE = '42501';
  END IF;

  -- Defesa contra self-lockout: o caller nao pode revogar o proprio
  -- ultimo role admin se for o unico admin remanescente.
  IF p_role = 'admin'::public.app_role AND p_user_id = auth.uid() THEN
    IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin'::public.app_role) <= 1 THEN
      RAISE EXCEPTION 'nao e possivel revogar o ultimo papel de admin'
        USING ERRCODE = '23000';
    END IF;
  END IF;

  WITH deleted AS (
    DELETE FROM public.user_roles
     WHERE user_id = p_user_id AND role = p_role
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM deleted) INTO v_deleted;

  RETURN v_deleted;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) TO authenticated;

COMMENT ON FUNCTION public.admin_revoke_role(uuid, public.app_role) IS
  'Marco 6B v0. Revoga role especifica de um usuario. Caller deve ser admin.
   Bloqueia auto-revogacao do ultimo papel admin remanescente (anti-lockout).';

-- Permite que admins leiam todas as linhas de user_roles (alem do "own").
-- A policy original "Users read own roles" continua valida para nao-admins.
DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));
