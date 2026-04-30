-- Foundation v1 — Migration 3/4
-- Cria tabela contas_bancarias: conta(s) bancária(s) por unidade.
-- Identificadores agencia e conta_corrente como text para preservar zeros à esquerda
-- e caracteres como `X`, conforme Issue #13.

CREATE TABLE IF NOT EXISTS public.contas_bancarias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unidade_id uuid NOT NULL REFERENCES public.unidades_escolares(id) ON DELETE RESTRICT,
  banco text,
  agencia text,
  conta_corrente text,
  principal boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (unidade_id, agencia, conta_corrente)
);

CREATE INDEX IF NOT EXISTS idx_contas_bancarias_unidade
  ON public.contas_bancarias (unidade_id);

-- Garante no máximo uma conta principal por unidade.
CREATE UNIQUE INDEX IF NOT EXISTS uq_contas_bancarias_unidade_principal
  ON public.contas_bancarias (unidade_id)
  WHERE principal = true;

ALTER TABLE public.contas_bancarias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read contas_bancarias"
  ON public.contas_bancarias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Team can insert contas_bancarias"
  ON public.contas_bancarias FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Team can update contas_bancarias"
  ON public.contas_bancarias FOR UPDATE
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR public.has_role(auth.uid(), 'operador'::public.app_role)
  );

CREATE POLICY "Admins can delete contas_bancarias"
  ON public.contas_bancarias FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_contas_bancarias_updated_at
  BEFORE UPDATE ON public.contas_bancarias
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
