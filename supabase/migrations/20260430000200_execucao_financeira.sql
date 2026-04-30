-- Foundation v1 — Migration 2/4
-- Cria tabela execucao_financeira: execução por unidade/exercício/programa.
-- Valores financeiros em numeric(14,2). FK para unidades_escolares.
-- Aderente ao Issue #13: "Manter valores financeiros como numeric(14,2)".

CREATE TABLE IF NOT EXISTS public.execucao_financeira (
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

CREATE INDEX IF NOT EXISTS idx_exec_fin_unidade
  ON public.execucao_financeira (unidade_id);

CREATE INDEX IF NOT EXISTS idx_exec_fin_exercicio_programa
  ON public.execucao_financeira (exercicio, programa);

ALTER TABLE public.execucao_financeira ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read execucao_financeira"
  ON public.execucao_financeira FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team can insert execucao_financeira"
  ON public.execucao_financeira FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Team can update execucao_financeira"
  ON public.execucao_financeira FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Admins can delete execucao_financeira"
  ON public.execucao_financeira FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_exec_fin_updated_at
  BEFORE UPDATE ON public.execucao_financeira
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
