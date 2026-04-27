-- Migration 0003: execucao_financeira
-- Conforme Plano de Migração Supabase v2.2.1

CREATE TABLE public.execucao_financeira (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES public.unidades_escolares(id) ON DELETE RESTRICT,
  exercicio integer NOT NULL,
  programa text NOT NULL DEFAULT 'basico',
  reprogramado_custeio numeric(14,2) NOT NULL DEFAULT 0 CHECK (reprogramado_custeio >= 0),
  reprogramado_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (reprogramado_capital >= 0),
  parcela_1_custeio numeric(14,2) NOT NULL DEFAULT 0 CHECK (parcela_1_custeio >= 0),
  parcela_1_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (parcela_1_capital >= 0),
  parcela_2_custeio numeric(14,2) NOT NULL DEFAULT 0 CHECK (parcela_2_custeio >= 0),
  parcela_2_capital numeric(14,2) NOT NULL DEFAULT 0 CHECK (parcela_2_capital >= 0),
  gasto numeric(14,2) NOT NULL DEFAULT 0 CHECK (gasto >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, exercicio, programa)
);

-- Índices para busca
CREATE INDEX idx_exec_fin_exercicio_programa ON public.execucao_financeira (exercicio, programa);

-- Habilitar RLS
ALTER TABLE public.execucao_financeira ENABLE ROW LEVEL SECURITY;

-- Policies (Admin e Operador)
CREATE POLICY "Admin e Operador podem ler execução"
  ON public.execucao_financeira FOR SELECT
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

CREATE POLICY "Admin e Operador podem inserir execução"
  ON public.execucao_financeira FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

CREATE POLICY "Admin e Operador podem atualizar execução"
  ON public.execucao_financeira FOR UPDATE
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );
