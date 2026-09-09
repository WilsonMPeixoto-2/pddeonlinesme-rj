-- Auditoria interna da integração financeira.
-- Estes dados não pertencem à superfície operacional da aplicação.

CREATE TABLE IF NOT EXISTS public.integracoes_financeiras_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exercicio integer NOT NULL,
  origem text NOT NULL,
  publicado_em timestamptz,
  workflow_run_id bigint,
  artifact_id bigint,
  total_unidades integer NOT NULL DEFAULT 0,
  total_contas integer NOT NULL DEFAULT 0,
  total_repasses integer NOT NULL DEFAULT 0,
  criado_em timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.integracoes_financeiras_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read integracoes_financeiras_runs"
  ON public.integracoes_financeiras_runs FOR SELECT
  TO authenticated
  USING (true);
