-- Reconciliacao do historico remoto.
-- Esta versao ja estava registrada no Supabase de producao em 24/09/2026,
-- mas o arquivo nao existia no repositorio. O estado efetivo observado no banco
-- mantem a view de maturidade restrita ao backend privilegiado.

revoke all on public.vw_financial_dimension_publication from public, anon, authenticated;
grant select on public.vw_financial_dimension_publication to service_role;
