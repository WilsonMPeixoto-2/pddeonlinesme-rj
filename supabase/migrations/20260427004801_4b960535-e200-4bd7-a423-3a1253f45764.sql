-- 1. Expand unidades_escolares with BASE.xlsx fields
ALTER TABLE public.unidades_escolares
  ADD COLUMN IF NOT EXISTS endereco text,
  ADD COLUMN IF NOT EXISTS agencia text,
  ADD COLUMN IF NOT EXISTS conta_corrente text,
  ADD COLUMN IF NOT EXISTS parcela_1_custeio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcela_1_capital numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcela_2_custeio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS parcela_2_capital numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reprogramado_custeio numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reprogramado_capital numeric NOT NULL DEFAULT 0;

-- Unique designacao for upsert
CREATE UNIQUE INDEX IF NOT EXISTS unidades_escolares_designacao_key
  ON public.unidades_escolares (designacao);

-- 2. Import logs table
CREATE TABLE IF NOT EXISTS public.import_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  source text NOT NULL DEFAULT 'BASE.xlsx',
  filename text,
  total_rows integer NOT NULL DEFAULT 0,
  inserted_rows integer NOT NULL DEFAULT 0,
  updated_rows integer NOT NULL DEFAULT 0,
  skipped_rows integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'success',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read import_logs"
  ON public.import_logs FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Team can insert import_logs"
  ON public.import_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'operador'::app_role)
  );