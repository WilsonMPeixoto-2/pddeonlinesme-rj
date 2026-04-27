-- Migration 0004: import_logs
-- Conforme Plano de Migração Supabase v2.2.1

CREATE TABLE public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL DEFAULT 'BASE.xlsx',
  filename text,
  exercicio integer,
  programa text,
  total_rows integer NOT NULL DEFAULT 0,
  inserted_rows integer NOT NULL DEFAULT 0,
  updated_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

-- Policies restritivas (Emenda E8: não usar USING (true) e bloquear diretor)
CREATE POLICY "Admin e Operador podem ler import_logs"
  ON public.import_logs FOR SELECT
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

CREATE POLICY "Admin e Operador podem inserir import_logs"
  ON public.import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );
