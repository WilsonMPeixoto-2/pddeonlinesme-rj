-- Otimizações específicas da integração financeira 2026.

CREATE INDEX IF NOT EXISTS idx_repasses_financeiros_conta_bancaria_id
  ON public.repasses_financeiros (conta_bancaria_id);

ALTER POLICY "Team can insert repasses_financeiros"
  ON public.repasses_financeiros
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'operador'::public.app_role)
  );

ALTER POLICY "Team can update repasses_financeiros"
  ON public.repasses_financeiros
  USING (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'operador'::public.app_role)
  )
  WITH CHECK (
    public.has_role((SELECT auth.uid()), 'admin'::public.app_role)
    OR public.has_role((SELECT auth.uid()), 'operador'::public.app_role)
  );

ALTER POLICY "Admins can delete repasses_financeiros"
  ON public.repasses_financeiros
  USING (public.has_role((SELECT auth.uid()), 'admin'::public.app_role));
