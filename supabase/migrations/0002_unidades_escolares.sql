-- Migration 0002: unidades_escolares
-- Conforme Plano de Migração Supabase v2.2.1

-- Habilitar pg_trgm para buscas
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE public.unidades_escolares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  designacao text NOT NULL UNIQUE,
  nome text NOT NULL,
  inep text,
  cnpj text,
  diretor text,
  endereco text,
  agencia text,
  conta_corrente text,
  email text,
  alunos integer NULL,
  ativo boolean NOT NULL DEFAULT true,
  source_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Índices para busca
CREATE INDEX idx_unidades_nome_trgm ON public.unidades_escolares USING gin (nome gin_trgm_ops);
CREATE INDEX idx_unidades_designacao ON public.unidades_escolares (designacao);
CREATE INDEX idx_unidades_inep ON public.unidades_escolares (inep);

-- Habilitar RLS
ALTER TABLE public.unidades_escolares ENABLE ROW LEVEL SECURITY;

-- Policies (Admin e Operador acesso total de leitura e escrita; diretor não possui acesso global nesta fase)
CREATE POLICY "Admin e Operador podem ler unidades"
  ON public.unidades_escolares FOR SELECT
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

CREATE POLICY "Admin e Operador podem inserir unidades"
  ON public.unidades_escolares FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

CREATE POLICY "Admin e Operador podem atualizar unidades"
  ON public.unidades_escolares FOR UPDATE
  TO authenticated
  USING (
    public.has_role('admin'::public.app_role) OR 
    public.has_role('operador'::public.app_role)
  );

-- O DELETE físico está operacionalmente proibido (Emenda E3). 
-- O delete físico não possui policy de API nesta fase para garantir rastreabilidade. A exclusão/desativação deve ser feita atualizando ativo=false.

CREATE TRIGGER trg_unidades_updated_at
BEFORE UPDATE ON public.unidades_escolares
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
