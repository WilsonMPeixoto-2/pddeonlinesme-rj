-- Financial External Evidence V1
--
-- Evidências complementares recebidas fora do snapshot do motor financeiro
-- permanecem separadas da projeção canônica. A view operacional usa essas
-- evidências apenas quando o motor ainda não publicou o mesmo fato.
--
-- Isso preserva proveniência, impede que uma sincronização posterior apague
-- silenciosamente a evidência e evita atribuir ao snapshot fatos que vieram de
-- outra fonte.

CREATE TABLE IF NOT EXISTS public.repasse_evidencias_financeiras (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repasse_financeiro_id uuid NOT NULL
    REFERENCES public.repasses_financeiros(id) ON DELETE RESTRICT,
  tipo_evidencia text NOT NULL CHECK (btrim(tipo_evidencia) <> ''),
  fonte text NOT NULL CHECK (btrim(fonte) <> ''),
  referencia text NOT NULL CHECK (btrim(referencia) <> ''),
  valor_pago_informado numeric(14,2) CHECK (valor_pago_informado >= 0),
  custeio_pago_informado numeric(14,2) CHECK (custeio_pago_informado >= 0),
  capital_pago_informado numeric(14,2) CHECK (capital_pago_informado >= 0),
  data_pagamento date,
  data_ordem_pagamento date,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (repasse_financeiro_id, tipo_evidencia),
  CONSTRAINT repasse_evidencias_componentes_check CHECK (
    valor_pago_informado IS NULL
    OR custeio_pago_informado IS NULL
    OR capital_pago_informado IS NULL
    OR valor_pago_informado = custeio_pago_informado + capital_pago_informado
  )
);

CREATE INDEX IF NOT EXISTS idx_repasse_evidencias_financeiras_repasse
  ON public.repasse_evidencias_financeiras (repasse_financeiro_id);

ALTER TABLE public.repasse_evidencias_financeiras ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated can read repasse_evidencias_financeiras"
  ON public.repasse_evidencias_financeiras;

CREATE POLICY "Authenticated can read repasse_evidencias_financeiras"
  ON public.repasse_evidencias_financeiras
  FOR SELECT
  TO authenticated
  USING (true);

REVOKE INSERT, UPDATE, DELETE ON public.repasse_evidencias_financeiras FROM anon, authenticated;
GRANT SELECT ON public.repasse_evidencias_financeiras TO authenticated;
GRANT ALL ON public.repasse_evidencias_financeiras TO service_role;

DROP TRIGGER IF EXISTS trg_repasse_evidencias_financeiras_updated_at
  ON public.repasse_evidencias_financeiras;

CREATE TRIGGER trg_repasse_evidencias_financeiras_updated_at
  BEFORE UPDATE ON public.repasse_evidencias_financeiras
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
  coalesce(r.valor_pago, e.valor_pago_informado) AS valor_pago,
  r.custeio_programado,
  r.capital_programado,
  coalesce(r.custeio_pago, e.custeio_pago_informado) AS custeio_pago,
  coalesce(r.capital_pago, e.capital_pago_informado) AS capital_pago,
  coalesce(r.data_pagamento, e.data_pagamento) AS data_pagamento,
  coalesce(r.data_ordem_pagamento, e.data_ordem_pagamento) AS data_ordem_pagamento,
  cb.id AS conta_bancaria_id,
  cb.banco,
  cb.agencia,
  cb.conta_corrente
FROM public.repasses_financeiros AS r
JOIN public.unidades_escolares AS u ON u.id = r.unidade_id
LEFT JOIN public.contas_bancarias AS cb ON cb.id = r.conta_bancaria_id
LEFT JOIN public.repasse_evidencias_financeiras AS e
  ON e.repasse_financeiro_id = r.id
 AND e.tipo_evidencia = 'SITUACAO_ATENDIMENTO_FNDE';

COMMENT ON TABLE public.repasse_evidencias_financeiras IS
  'Evidências financeiras complementares externas ao snapshot canônico. A projeção operacional usa a evidência somente como fallback para fatos ausentes no motor.';

COMMENT ON COLUMN public.repasse_evidencias_financeiras.data_ordem_pagamento IS
  'Data de ordem de pagamento informada pela fonte externa; não implica data de crédito bancário.';
