# PR3B.0 - Preflight local Supabase e dados de teste

Data da retomada local: 2026-04-27
Branch: `feature/pr3b-frontend-semantic-schema`
HEAD esperado: `e1f12f3e0559494e6a2f75c9a0f520787af161a7`
Commit base tecnico: `50e7904d6261fea210be2b2217e590996a0ef5a2`

## Objetivo

Retomar no PC de casa a linha tecnica do PR 3B e preservar a rastreabilidade do subpasso **3B.0**, sem iniciar **3B.1**.

O escopo deste subpasso foi:

- confirmar que a branch tecnica correta esta preservada localmente e no remoto;
- confirmar que a branch tem somente o commit PR3B.-1 acima do base tecnico;
- refazer localmente o preflight Supabase;
- carregar uma BASE de teste em banco local;
- validar integridade minima do schema, RLS, views e dados;
- registrar os prompts de retomada em `docs/PR3B_PROMPTS.md`.

## Restricoes respeitadas

- Nao usar `main` como referencia tecnica da migracao.
- Nao iniciar 3B.1.
- Nao alterar telas React.
- Nao alterar migrations.
- Nao rodar `supabase db push`.
- Nao alterar Vercel Production.
- Nao alterar variaveis de ambiente remotas.
- Nao usar `service_role` no frontend.
- Nao commitar segredos.

## Confirmacao Git local

Checkout usado:

```text
C:\Users\okidata\.gemini\antigravity\scratch\pddeonlinesme-rj-pr3b
```

Estado confirmado:

```text
git status --short --branch
## feature/pr3b-frontend-semantic-schema...origin/feature/pr3b-frontend-semantic-schema

git rev-parse HEAD
e1f12f3e0559494e6a2f75c9a0f520787af161a7

git log --oneline 50e7904d6261fea210be2b2217e590996a0ef5a2..HEAD
e1f12f3 chore(pr3b): preserve preview diagnosis and fix frontend environment contract
```

Resultado: branch correta, HEAD esperado e somente `e1f12f3` acima de `50e7904`.

## Confirmacao GitHub MCP

O GitHub MCP foi usado em modo leitura para confirmar o remoto:

- branch `feature/pr3b-frontend-semantic-schema` existe no GitHub;
- commit remoto `e1f12f3e0559494e6a2f75c9a0f520787af161a7` existe;
- comparacao `50e7904..feature/pr3b-frontend-semantic-schema`: `ahead_by=1`, `behind_by=0`, `total_commits=1`;
- arquivos remotos acima do base tecnico:
  - `.env.example`;
  - `docs/PR3B_PREFLIGHT_REPOSITORY_HYGIENE.md`;
  - `docs/PREVIEW_BLUE_SCREEN_DIAGNOSIS.md`.

Conclusao: antes deste 3B.0, `docs/PR3B_LOCAL_TESTING.md` e `docs/PR3B_PROMPTS.md` ainda nao estavam preservados no remoto.

## Vercel MCP - leitura somente

O Vercel MCP foi usado apenas em modo leitura.

Projeto identificado:

```text
team: wilson-m-peixotos-projects
project: pddeonlinesme-rj
projectId: prj_dErjl7LdzTL2412fsw0pyzo3bdp1
framework: vite
nodeVersion: 24.x
```

Achados de leitura:

- existe deployment READY para `feature/pr3b-frontend-semantic-schema` em `e1f12f3`;
- deployment Production restaurado segue em `main` / `decc727`;
- nenhuma alteracao foi feita em env vars, deploys, aliases ou Production.

## Supabase MCP

Nao apareceu ferramenta Supabase MCP chamavel nesta sessao Codex via discovery de ferramentas.

O `supabase start` informou endpoint MCP local em `http://127.0.0.1:54321/mcp`, mas a auditoria executavel desta sessao ficou pela Supabase CLI e por SQL controlado contra o banco local, conforme regra do projeto.

## Ambiente local

Comandos de ambiente:

```text
supabase --version
2.95.3

C:\Program Files\Docker\Docker\resources\bin\docker.exe --version
Docker version 29.4.0, build 9d7ad9f

C:\Program Files\Docker\Docker\resources\bin\docker.exe info --format '{{.ServerVersion}}'
29.4.0

node --version
v24.15.0

npm --version
11.12.0

python --version
Python 3.14.4
```

Observacao: `docker` nao estava no PATH da sessao PowerShell, mas o Docker Desktop estava instalado e funcional. Nos comandos deste preflight, o PATH foi ajustado apenas na sessao de comando:

```powershell
$env:PATH = $env:PATH + ';C:\Program Files\Docker\Docker\resources\bin'
```

## Supabase local

`supabase start` retornou ambiente local ja em execucao:

```text
Project URL: http://127.0.0.1:54321
Database URL: postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio: http://127.0.0.1:54323
```

As chaves locais impressas pela CLI nao foram copiadas para este relatorio.

Reset local:

```text
supabase db reset --local
Resetting local database...
Applying migration 20260427000100_auth_roles_profiles.sql...
Applying migration 20260427000200_unidades_escolares.sql...
Applying migration 20260427000300_execucao_financeira.sql...
Applying migration 20260427000400_import_logs.sql...
Applying migration 20260427000500_document_types_documentos_gerados.sql...
Applying migration 20260427000600_views_frontend_status.sql...
WARN: no files matched pattern: supabase/seed.sql
Finished supabase db reset on branch main.
```

Observacao: a mensagem `branch main` e texto da CLI Supabase local; a branch Git permaneceu `feature/pr3b-frontend-semantic-schema`.

Migrations locais:

```text
20260427000100
20260427000200
20260427000300
20260427000400
20260427000500
20260427000600
```

## Schema e seguranca local

Objetos publicos confirmados:

```text
document_types                 BASE TABLE
documentos_gerados             BASE TABLE
execucao_financeira            BASE TABLE
import_logs                    BASE TABLE
profiles                       BASE TABLE
unidades_escolares             BASE TABLE
user_roles                     BASE TABLE
vw_unidades_escolares_frontend VIEW
vw_unidades_status             VIEW
```

Enum confirmado:

```text
app_role: admin
app_role: operador
app_role: diretor
```

RLS confirmado nas tabelas publicas:

```text
document_types      relrowsecurity=true
documentos_gerados  relrowsecurity=true
execucao_financeira relrowsecurity=true
import_logs         relrowsecurity=true
profiles            relrowsecurity=true
unidades_escolares  relrowsecurity=true
user_roles          relrowsecurity=true
```

Views com `security_invoker=true` confirmadas por `pg_class.reloptions`:

```text
vw_unidades_escolares_frontend -> security_invoker=true
vw_unidades_status             -> security_invoker=true
```

## Typegen

Comando:

```powershell
supabase gen types --local --schema public
```

Resultado:

- comparacao literal com `src/integrations/supabase/types.ts`: diferenca de uma linha em branco final no arquivo gerado;
- comparacao com `--ignore-blank-lines`: sem diferenca real.

Status: `types.ts` permanece compativel com o schema local validado. Nenhuma regeneracao foi aplicada no 3B.0.

## Dados de teste

Arquivo usado:

```text
C:\Users\okidata\.gemini\antigravity\scratch\DEMO_BASE_TEMP.xlsx
```

Dry-run:

```text
python scripts\import_base_xlsx.py C:\Users\okidata\.gemini\antigravity\scratch\DEMO_BASE_TEMP.xlsx --exercicio 2026 --programa basico
Válidas: 163
Puladas: 0
Erros de Validação: 0
Modo: PREVIEW ONLY
```

Dependencia ausente antes do apply:

```text
ModuleNotFoundError: No module named 'psycopg'
```

Acao local executada:

```text
python -m pip install --user "psycopg[binary]"
```

Apply local, usando apenas `DATABASE_URL` local:

```powershell
$env:DATABASE_URL='postgresql://postgres:postgres@127.0.0.1:54322/postgres'
python scripts\import_base_xlsx.py C:\Users\okidata\.gemini\antigravity\scratch\DEMO_BASE_TEMP.xlsx --exercicio 2026 --programa basico --apply
```

Resultado:

```text
Inseridas no DB: 163
Atualizadas no DB: 0
Puladas vazias: 0
Erros Totais (Validacao + DB): 0
Modo: GRAVADO NO BANCO DE DADOS.
```

## Gates SQL de dados

Contagens:

```text
unidades_ativas: 163
execucao_financeira 2026/basico: 163
unidades_ativas_sem_execucao_2026: 0
import_logs_sucesso: 1
ultimo import_log: inserted_rows=163, updated_rows=0, skipped_rows=0, total_rows=163, status=sucesso
```

Semantica e qualidade:

```text
designacoes_contaminadas: 0
nomes_vazios: 0
designacoes_duplicadas: 0
cnpj_tamanho_invalido: 0
inep_tamanho_invalido: 0
cnpj_formato_invalido: 0
inep_formato_invalido: 0
gasto_maior_que_disponivel: 0
```

Views:

```text
vw_unidades_escolares_frontend 2026/basico: 163
execucao_financeira 2026/basico: 163
vw_unidades_status: pronta=163
```

Totais financeiros de teste:

```text
saldo_anterior_total: 15326.16
recebido_total: 0.00
gasto_total: 0.00
menor_saldo_estimado: 0.00
maior_saldo_estimado: 12731.63
```

Teste controlado de delete fisico:

```text
DELETE FROM public.unidades_escolares
WHERE id = (
  SELECT ue.id
  FROM public.unidades_escolares ue
  JOIN public.execucao_financeira ef ON ef.unidade_id = ue.id
  WHERE ue.ativo = true
  LIMIT 1
);
```

Resultado esperado e obtido:

```text
ERROR: update or delete on table "unidades_escolares" violates foreign key constraint "execucao_financeira_unidade_id_fkey"
unidades_ativas_pos_teste_delete: 163
```

## Gates de codigo

```text
npx tsc --noEmit
exit 0

npm run lint
exit 0; 1 warning pre-existente em src/hooks/useExercicio.tsx

npm test
exit 0; 1 arquivo, 1 teste aprovado

npm run build
exit 0; Vite build aprovado
```

Warnings preservados como fora de escopo 3B.0:

- `react-refresh/only-export-components` em `src/hooks/useExercicio.tsx`;
- chunk Vite acima de 500 kB apos minificacao.

## Arquivos alterados por este subpasso

Arquivos intencionais de rastreabilidade:

- `docs/PR3B_LOCAL_TESTING.md`
- `docs/PR3B_PROMPTS.md`

Arquivos nao alterados:

- `src/`
- `supabase/migrations/`
- `src/integrations/supabase/types.ts`
- `package.json`
- `package-lock.json`
- configuracoes de Vercel
- Production

## Status

`3B.0` foi refeito localmente neste PC e agora esta documentado.

Status tecnico:

- branch correta confirmada;
- remoto confirmado por GitHub MCP;
- Vercel consultada apenas em leitura;
- Supabase local resetado por CLI;
- migrations aplicadas localmente;
- dados de teste carregados localmente;
- gates SQL principais aprovados;
- gates TypeScript/lint/test/build aprovados;
- nenhuma tela adaptada;
- 3B.1 nao iniciado.

Proximo passo permitido, somente apos decisao humana: iniciar 3B.1 em escopo separado.
