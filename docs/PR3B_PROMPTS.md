# PR3B - Registro de prompts e restricoes

Data da retomada: 2026-04-27
Branch: `feature/pr3b-frontend-semantic-schema`

## Objetivo deste arquivo

Preservar a trilha de prompts usada para retomar o PR 3B no PC de casa e executar apenas o subpasso **3B.0**, sem iniciar **3B.1**.

## Prompt inicial de retomada

Resumo operacional recebido:

```text
Voce e Codex atuando no projeto PDDE Online 2026.

Objetivo imediato:
Retomar no PC de casa a linha tecnica do PR 3B e finalizar a rastreabilidade do 3B.0, sem iniciar 3B.1.

Contexto oficial:
- main = producao restaurada. Nao usar como referencia tecnica da migracao.
- feature/pr3b-frontend-semantic-schema = branch tecnica correta.
- PR3B.-1 esta publicado no GitHub.
- 3B.0 foi executado localmente no notebook de trabalho segundo logs, mas ainda nao esta preservado no remoto.
- Neste PC de casa, devemos confirmar estado e, se necessario, refazer o 3B.0 localmente.
```

## Skills/capacidades solicitadas

O usuario solicitou considerar, se disponiveis:

```text
- pdde-online
- pdde-finance-data
- supabase
- supabase-postgres-best-practices
- security-best-practices
- spreadsheet/excel
- github
```

Aplicacao no 3B.0:

- `pdde-online`: usado para contrato do projeto e leitura obrigatoria de contexto.
- `pdde-finance-data`: usado para validacao da BASE de teste, contagens e regras financeiras.
- `supabase`: usado para CLI local, reset, queries e seguranca Supabase.
- `supabase-postgres-best-practices`: aplicado na checagem de RLS, views `security_invoker` e integridade relacional.
- `security-best-practices`: aplicado passivamente para nao expor `service_role`, segredos, env vars remotas ou Production.
- `spreadsheet/excel`: usado conceitualmente no tratamento da BASE `.xlsx`; nao foi necessario gerar workbook novo.
- `github`: usado via MCP para confirmar branch, commit e compare remoto.

## Regras Git recebidas

```text
Se a branch atual nao for feature/pr3b-frontend-semantic-schema:
- nao improvisar;
- alternar para a branch correta apenas se ela existir localmente ou em origin:
  git switch feature/pr3b-frontend-semantic-schema
  ou
  git switch -c feature/pr3b-frontend-semantic-schema --track origin/feature/pr3b-frontend-semantic-schema

Confirmar que o HEAD esperado e:
e1f12f3e0559494e6a2f75c9a0f520787af161a7

Comparar a branch com o commit base tecnico:
git log --oneline 50e7904d6261fea210be2b2217e590996a0ef5a2..HEAD

Resultado esperado:
somente e1f12f3 acima de 50e7904.

Verificar se docs/PR3B_LOCAL_TESTING.md existe:
- se existir, relatar conteudo/resumo e status git;
- se nao existir, relatar que 3B.0 ainda precisa ser refeito ou documentado neste PC.

Verificar se docs/PR3B_PROMPTS.md existe:
- se nao existir, relatar como pendencia documental pos-3B.0.
```

Resultado:

- branch correta ja estava ativa em `pddeonlinesme-rj-pr3b`;
- HEAD local confirmado em `e1f12f3e0559494e6a2f75c9a0f520787af161a7`;
- log contra `50e7904` retornou somente `e1f12f3`;
- `docs/PR3B_LOCAL_TESTING.md` nao existia;
- `docs/PR3B_PROMPTS.md` nao existia;
- 3B.0 foi refeito e documentado.

## Regras MCP recebidas

```text
Se houver MCPs disponiveis no ambiente, ative e use:

- Supabase MCP para inspecao de schema, tabelas, policies, views e consultas SQL controladas;
- GitHub MCP para confirmar branch, commits, arquivos e historico;
- Vercel MCP apenas em modo leitura, sem alterar env vars, deploys ou Production;
- Playwright/browser MCP apenas para validacao visual quando chegarmos as telas.

Regra:
O MCP nao substitui a Supabase CLI nos gates oficiais.
Para migrations, reset local, typegen e eventual db push, usar Supabase CLI.
Para inspecao e auditoria, usar MCP quando disponivel.

Nao executar mutacoes remotas via MCP sem autorizacao expressa.
Nao usar service_role no frontend.
Nao alterar Production.
```

Aplicacao:

- GitHub MCP: usado em leitura para branch, commit e compare remoto.
- Vercel MCP: usado em leitura para time, projeto e deployments.
- Supabase MCP: nao apareceu como ferramenta chamavel nesta sessao; inspecoes foram feitas por Supabase CLI contra banco local.
- Playwright/browser MCP: nao usado, porque 3B.0 nao chegou a telas.

## Escopo efetivamente executado no 3B.0

```text
1. Confirmar branch/HEAD/log local.
2. Confirmar branch/commit remoto por GitHub MCP.
3. Confirmar contexto Vercel por MCP em leitura.
4. Subir/confirmar Supabase local.
5. Rodar supabase db reset --local.
6. Validar schema, enum, RLS e views.
7. Rodar typegen local e comparar com types.ts.
8. Rodar dry-run da BASE de teste.
9. Instalar psycopg[binary] no Python local para permitir apply transacional.
10. Rodar apply local com DATABASE_URL local.
11. Validar contagens, formato de CNPJ/INEP, view frontend/status, import_logs e delete restrito.
12. Rodar npx tsc --noEmit, npm run lint, npm test e npm run build.
13. Criar docs/PR3B_LOCAL_TESTING.md e docs/PR3B_PROMPTS.md.
```

## Limite explicito

Nada de 3B.1 foi iniciado.

Arquivos `src/`, migrations, tipos Supabase versionados, env vars, Vercel Production e deploy remoto nao foram alterados por este subpasso.
