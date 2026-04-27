-- Migration 0005: document_types_documentos_gerados
-- Conforme Plano de Migração Supabase v2.2.1

CREATE TABLE public.document_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  format text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.documentos_gerados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES public.unidades_escolares(id) ON DELETE RESTRICT,
  document_type_id uuid NOT NULL REFERENCES public.document_types(id) ON DELETE RESTRICT,
  exercicio integer NOT NULL,
  programa text NOT NULL DEFAULT 'basico',
  status text NOT NULL DEFAULT 'pendente',
  generated_at timestamptz,
  generated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  file_path text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, document_type_id, exercicio, programa)
);

-- Seed inicial de document_types
INSERT INTO public.document_types (code, name, description, sort_order) VALUES
  ('demonstrativo_basico', 'Demonstrativo Básico', 'Documento contábil resumido', 10),
  ('relacao_bens', 'Relação de Bens', 'Lista de bens adquiridos ou baixados', 20),
  ('termo_doacao', 'Termo de Doação', 'Termo de doação ao patrimônio', 30),
  ('consolidacao_precos', 'Consolidação de Preços', 'Quadro de cotação e pesquisa', 40),
  ('ata_conselho', 'Ata do Conselho', 'Ata de aprovação do CEC', 50),
  ('parecer_fiscal', 'Parecer Fiscal', 'Aprovação do Conselho Fiscal', 60);

-- Habilitar RLS
ALTER TABLE public.document_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_gerados ENABLE ROW LEVEL SECURITY;

-- Policies: admin e operador apenas.
CREATE POLICY "Admin e Operador podem ler document_types"
  ON public.document_types FOR SELECT TO authenticated
  USING (public.has_role('admin'::public.app_role) OR public.has_role('operador'::public.app_role));

CREATE POLICY "Admin e Operador podem ler documentos_gerados"
  ON public.documentos_gerados FOR SELECT TO authenticated
  USING (public.has_role('admin'::public.app_role) OR public.has_role('operador'::public.app_role));

CREATE POLICY "Admin e Operador podem gerenciar documentos_gerados"
  ON public.documentos_gerados FOR ALL TO authenticated
  USING (public.has_role('admin'::public.app_role) OR public.has_role('operador'::public.app_role));
