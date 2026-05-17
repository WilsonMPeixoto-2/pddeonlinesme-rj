-- Marco 9B + Marco 15 (v4.2) — historico persistido de geracoes documentais em lote
--
-- Registra cada corrida de geracao em lote do Demonstrativo Basico (e futuramente
-- outros documentos), permitindo auditoria, retomada e rastreabilidade
-- institucional. Atende §5.3 do Radar de Inteligencia Institucional:
-- "Historico persistido com usuario, timestamp, status, falhas".
--
-- Toda escrita ocorre via cliente do navegador autenticado — nunca via
-- service_role. user_id e auth.uid() no momento do INSERT.

CREATE TABLE IF NOT EXISTS public.document_generation_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,

  doc_type TEXT NOT NULL
    CHECK (doc_type IN (
      'demonstrativo_basico_lote'
    )),
  exercicio INT NOT NULL CHECK (exercicio BETWEEN 2020 AND 2100),
  programa TEXT NOT NULL DEFAULT 'basico',

  total_alvo INT NOT NULL CHECK (total_alvo >= 0),
  total_sucesso INT NOT NULL DEFAULT 0 CHECK (total_sucesso >= 0),
  total_falha INT NOT NULL DEFAULT 0 CHECK (total_falha >= 0),

  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,

  status TEXT NOT NULL DEFAULT 'em_execucao'
    CHECK (status IN ('em_execucao', 'concluido', 'falha', 'cancelado')),

  falhas JSONB NOT NULL DEFAULT '[]'::jsonb,
  metadata JSONB
);

CREATE INDEX IF NOT EXISTS idx_doc_gen_runs_user_started
  ON public.document_generation_runs (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_doc_gen_runs_doc_type_exercicio
  ON public.document_generation_runs (doc_type, exercicio DESC);

ALTER TABLE public.document_generation_runs ENABLE ROW LEVEL SECURITY;

-- Leitura: o proprio usuario ve suas corridas; admin ve todas. Nao expomos
-- corridas de outros operadores entre si por padrao.
CREATE POLICY "doc_gen_runs_select_own_or_admin"
  ON public.document_generation_runs
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- Insercao: somente admin/operador pode iniciar corrida; o registro pertence
-- a quem disparou (defesa em profundidade alem do default DEFAULT auth.uid()).
CREATE POLICY "doc_gen_runs_insert_admin_operador"
  ON public.document_generation_runs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.has_role(auth.uid(), 'admin'::public.app_role)
      OR public.has_role(auth.uid(), 'operador'::public.app_role)
    )
  );

-- Update: dono da corrida atualiza status/contagens/falhas; admin tambem pode.
-- Reusamos o gatilho automatico de updated_at via trigger generico.
CREATE POLICY "doc_gen_runs_update_own_or_admin"
  ON public.document_generation_runs
  FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- DELETE nao e permitido aos usuarios autenticados; admin via SQL apenas.

CREATE OR REPLACE FUNCTION public.tg_document_generation_runs_touch_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_generation_runs_touch_updated
  ON public.document_generation_runs;

CREATE TRIGGER trg_document_generation_runs_touch_updated
  BEFORE UPDATE ON public.document_generation_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_document_generation_runs_touch_updated();

COMMENT ON TABLE public.document_generation_runs IS
  'Historico de corridas de geracao documental em lote. Marco 9B+15 (Plano v4.2).
   Acesso restrito ao dono da corrida ou admin. Insercao gera registro
   imediatamente; status/totais/falhas atualizados ao longo da corrida.';
