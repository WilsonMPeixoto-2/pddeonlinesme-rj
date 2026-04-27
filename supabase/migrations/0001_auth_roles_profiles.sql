-- Migration 0001: Auth, profiles, roles e has_role
-- Conforme Plano de Migração Supabase v2.2.1

CREATE TYPE public.app_role AS ENUM ('admin', 'operador', 'diretor');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

CREATE OR REPLACE FUNCTION public.has_role(_role public.app_role, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Policies para profiles
CREATE POLICY "Usuário pode ler seu próprio profile"
  ON public.profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admin pode ler todos os profiles"
  ON public.profiles FOR SELECT
  TO authenticated USING (public.has_role('admin'::public.app_role));

CREATE POLICY "Admin pode gerenciar profiles"
  ON public.profiles FOR ALL
  TO authenticated USING (public.has_role('admin'::public.app_role));

-- Policies para user_roles
CREATE POLICY "Usuário pode ler seus próprios roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admin pode ler todos os roles"
  ON public.user_roles FOR SELECT
  TO authenticated USING (public.has_role('admin'::public.app_role));

CREATE POLICY "Admin pode gerenciar user_roles"
  ON public.user_roles FOR ALL
  TO authenticated USING (public.has_role('admin'::public.app_role));


-- Fun��o gen�rica para auto-atualizar updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS `$$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
`$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
