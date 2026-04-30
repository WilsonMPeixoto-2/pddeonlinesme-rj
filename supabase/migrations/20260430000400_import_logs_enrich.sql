-- Foundation v1 — Migration 4/4
-- Enriquece import_logs com:
--   - FK explícita user_id -> auth.users(id) ON DELETE SET NULL;
--   - colunas exercicio e programa para rastreabilidade da carga BASE.xlsx.
-- Aditivo: não remove nem renomeia colunas existentes consumidas pelo frontend.

-- 1. Permite user_id nulo para suportar ON DELETE SET NULL.
ALTER TABLE public.import_logs
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Adiciona FK para auth.users com ON DELETE SET NULL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'import_logs_user_id_fkey'
      AND conrelid = 'public.import_logs'::regclass
  ) THEN
    ALTER TABLE public.import_logs
      ADD CONSTRAINT import_logs_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES auth.users(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- 3. Adiciona campos de rastreabilidade da importação.
ALTER TABLE public.import_logs
  ADD COLUMN IF NOT EXISTS exercicio integer,
  ADD COLUMN IF NOT EXISTS programa text;

CREATE INDEX IF NOT EXISTS idx_import_logs_exercicio_programa
  ON public.import_logs (exercicio, programa);
