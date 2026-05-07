# Workflow: supabase-safe-change

Use para mudancas Supabase.

1. Ler governanca, decisoes e handoff.
2. Confirmar o projeto alvo e classificar ambiente.
3. Comecar por leitura: schema, types, logs, advisors e migrations.
4. Nao usar `supabase db push` sem autorizacao explicita.
5. Nao alterar RLS, auth, roles, policies ou secrets sem revisao humana.
6. Preferir migration revisavel e pequena.
7. Validar localmente quando for criterio de aceite.
8. Gerar types somente apos schema aprovado.
9. Registrar risco e rollback em `docs/HANDOFF.md`.

