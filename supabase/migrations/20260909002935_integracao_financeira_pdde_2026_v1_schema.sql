-- Integração Financeira PDDE 2026 V1
-- Estrutura normalizada para programas, ações, parcelas e contas bancárias.

ALTER TABLE public.contas_bancarias
  ADD COLUMN IF NOT EXISTS programa text;

ALTER TABLE public.contas_bancarias
  ADD COLUMN IF NOT EXISTS exercicio integer;

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_unidade_programa
  ON public.contas_bancarias (unidade_id, programa);

-- Campos de compatibilidade para a estrutura financeira legada.
ALTER TABLE public.execucao_financeira
  ADD COLUMN IF NOT EXISTS acao text;

ALTER TABLE public.execucao_financeira
  ADD COLUMN IF NOT EXISTS parcela_1_total numeric(14,2);

ALTER TABLE public.execucao_financeira
  ADD COLUMN IF NOT EXISTS parcela_1_data_pagamento date;

ALTER TABLE public.execucao_financeira
  ADD COLUMN IF NOT EXISTS parcela_2_total_programado numeric(14,2);

CREATE TABLE IF NOT EXISTS public.repasses_financeiros (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES public.unidades_escolares(id) ON DELETE RESTRICT,
  exercicio integer NOT NULL,
  programa text NOT NULL,
  acao text NOT NULL,
  parcela text NOT NULL,
  ordem_exibicao smallint NOT NULL DEFAULT 1,
  valor_programado numeric(14,2) NOT NULL CHECK (valor_programado >= 0),
  valor_pago numeric(14,2) CHECK (valor_pago >= 0),
  custeio_programado numeric(14,2) CHECK (custeio_programado >= 0),
  capital_programado numeric(14,2) CHECK (capital_programado >= 0),
  custeio_pago numeric(14,2) CHECK (custeio_pago >= 0),
  capital_pago numeric(14,2) CHECK (capital_pago >= 0),
  data_pagamento date,
  data_ordem_pagamento date,
  conta_bancaria_id uuid REFERENCES public.contas_bancarias(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, exercicio, acao, parcela)
);

CREATE INDEX IF NOT EXISTS idx_repasses_financeiros_unidade_exercicio
  ON public.repasses_financeiros (unidade_id, exercicio);

CREATE INDEX IF NOT EXISTS idx_repasses_financeiros_programa
  ON public.repasses_financeiros (programa, exercicio);

ALTER TABLE public.repasses_financeiros ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read repasses_financeiros"
  ON public.repasses_financeiros FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team can insert repasses_financeiros"
  ON public.repasses_financeiros FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Team can update repasses_financeiros"
  ON public.repasses_financeiros FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Admins can delete repasses_financeiros"
  ON public.repasses_financeiros FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_repasses_financeiros_updated_at
  BEFORE UPDATE ON public.repasses_financeiros
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE VIEW public.vw_repasses_financeiros_unidade
WITH (security_invoker = true)
AS
SELECT
  r.id,
  r.unidade_id,
  u.inep,
  u.designacao,
  u.nome,
  r.exercicio,
  r.programa,
  r.acao,
  r.parcela,
  r.ordem_exibicao,
  r.valor_programado,
  r.valor_pago,
  r.custeio_programado,
  r.capital_programado,
  r.custeio_pago,
  r.capital_pago,
  r.data_pagamento,
  r.data_ordem_pagamento,
  cb.id AS conta_bancaria_id,
  cb.banco,
  cb.agencia,
  cb.conta_corrente
FROM public.repasses_financeiros r
JOIN public.unidades_escolares u ON u.id = r.unidade_id
LEFT JOIN public.contas_bancarias cb ON cb.id = r.conta_bancaria_id;
