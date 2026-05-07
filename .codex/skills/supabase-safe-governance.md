# Skill: supabase-safe-governance

Use para tarefas que envolvam Supabase, schema, migrations, RLS, Auth, policies ou generated types.

Regras:

- Tratar producao como somente leitura salvo autorizacao explicita.
- Nao usar `supabase db push` sem aprovacao humana explicita.
- Nao alterar Auth, RLS, roles, policies ou secrets sem revisao humana.
- Preferir migrations pequenas, revisaveis e testaveis.
- MCP nao substitui gates oficiais via CLI/local quando forem criterio de aceite.

