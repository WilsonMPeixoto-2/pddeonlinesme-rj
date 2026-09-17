-- Financial Evidence Monotonicity
--
-- Uma sincronização posterior não pode apagar evidência financeira já conhecida
-- apenas porque o novo snapshot chegou com campos nulos. Pagamento informado,
-- composição paga e datas permanecem monotônicos na projeção operacional.
-- Correções destrutivas exigem tratamento explícito fora do fluxo normal de sync.

CREATE OR REPLACE FUNCTION public.preserve_financial_evidence_on_sync_v1()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
  -- O pipeline troca integracao_run_id quando tenta promover um novo snapshot.
  -- Atualizações operacionais que não alteram a run continuam livres para correção
  -- administrativa explícita.
  IF NEW.integracao_run_id IS DISTINCT FROM OLD.integracao_run_id THEN
    IF OLD.valor_pago IS NOT NULL AND NEW.valor_pago IS NULL THEN
      NEW.valor_pago := OLD.valor_pago;
    END IF;

    IF OLD.custeio_pago IS NOT NULL AND NEW.custeio_pago IS NULL THEN
      NEW.custeio_pago := OLD.custeio_pago;
    END IF;

    IF OLD.capital_pago IS NOT NULL AND NEW.capital_pago IS NULL THEN
      NEW.capital_pago := OLD.capital_pago;
    END IF;

    IF OLD.data_pagamento IS NOT NULL AND NEW.data_pagamento IS NULL THEN
      NEW.data_pagamento := OLD.data_pagamento;
    END IF;

    IF OLD.data_ordem_pagamento IS NOT NULL AND NEW.data_ordem_pagamento IS NULL THEN
      NEW.data_ordem_pagamento := OLD.data_ordem_pagamento;
    END IF;

    -- Se, depois de restaurar a evidência mais forte, não restar mudança de negócio,
    -- cancela o UPDATE para preservar identidade física e a run que efetivamente
    -- introduziu a evidência vigente.
    IF (
      NEW.programa,
      NEW.ordem_exibicao,
      NEW.valor_programado,
      NEW.valor_pago,
      NEW.custeio_programado,
      NEW.capital_programado,
      NEW.custeio_pago,
      NEW.capital_pago,
      NEW.data_pagamento,
      NEW.data_ordem_pagamento,
      NEW.conta_bancaria_id
    ) IS NOT DISTINCT FROM (
      OLD.programa,
      OLD.ordem_exibicao,
      OLD.valor_programado,
      OLD.valor_pago,
      OLD.custeio_programado,
      OLD.capital_programado,
      OLD.custeio_pago,
      OLD.capital_pago,
      OLD.data_pagamento,
      OLD.data_ordem_pagamento,
      OLD.conta_bancaria_id
    ) THEN
      RETURN NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_preserve_financial_evidence_on_sync_v1
  ON public.repasses_financeiros;

CREATE TRIGGER trg_preserve_financial_evidence_on_sync_v1
  BEFORE UPDATE ON public.repasses_financeiros
  FOR EACH ROW
  EXECUTE FUNCTION public.preserve_financial_evidence_on_sync_v1();

COMMENT ON FUNCTION public.preserve_financial_evidence_on_sync_v1() IS
  'Impede que snapshots posteriores apaguem pagamento, composição paga ou datas já conhecidas na projeção operacional quando a atualização provém de nova integration run.';
