# Estado do Projeto — PDDE Online 2026

## Status Global

Fase atual: **Plano Global v4 compatibilizado / parêntese Supabase próprio em execução**.

O Plano Global v4 permanece como eixo diretor do projeto. A migração para o Supabase próprio é o parêntese técnico atualmente aberto dentro desse plano, e deve seguir o escopo delimitado em `docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md`.

A compatibilização entre o Plano v4, o estado real do GitHub e o plano de migração Supabase está registrada em `docs/PLAN_V4_REALITY_ALIGNMENT.md`.

## Regra operacional vigente

Antes de qualquer tarefa técnica, as ferramentas executoras devem consultar:

- `AGENTS.md`;
- `docs/PROJECT_STATE.md`;
- `docs/DECISIONS_LOG.md`;
- `docs/UI_CHANGELOG.md`;
- `docs/PLAN_V4_REALITY_ALIGNMENT.md`;
- `docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md`;
- `docs/FRONTEND_DATA_CONTRACT.md`, quando existir.

Nenhuma ferramenta deve presumir contexto apenas por relatórios externos ou por memória de sessão. O GitHub e a documentação versionada são a fonte oficial.

## Gate técnico antecipado — TypeScript Strict Mode

Foi antecipado o gate de endurecimento do TypeScript previsto antes do motor documental. O `tsconfig.json` referencia os tsconfigs específicos do projeto, e o modo estrito está habilitado nos arquivos referenciados (`tsconfig.app.json` e `tsconfig.node.json`) com `strict: true`; verificações como `noImplicitAny` e `strictNullChecks` passam a valer por derivação desse modo estrito.

A validação `npx tsc --noEmit` foi executada sem erros. Essa condição passa a ser requisito permanente do projeto: novas alterações não devem ser aceitas se quebrarem o modo estrito.

## Atualizações já implementadas antes do Marco 2

### Recomendação O6 — Seletor global de exercício

A recomendação O6 do diagnóstico organizacional já foi implementada no frontend.

Estado atual:

- `ExercicioProvider` envolve todo o `App.tsx`, tornando o exercício selecionado disponível globalmente.
- O seletor 2025/2026 está no `AppLayout` como controle global persistente.
- O próprio código identifica a entrega com o comentário `Exercício global (O6)`.
- Telas como Base, Escolas e EscolaEditar já consomem `useExercicio()`.

Impacto para o Plano v4: O6 deve ser tratada como entregue, não como pendência.

### RBAC e RLS — Esqueleto de banco já existente

O repositório já contém uma base funcional de RBAC/RLS em migrations Supabase.

Estado atual:

- A primeira migration cria `public.app_role`, `public.user_roles`, `public.has_role()` e habilita RLS em `unidades_escolares`.
- `public.has_role()` está definida como `security definer` com `set search_path = public`.
- A segunda migration restringe `INSERT` e `UPDATE` em `unidades_escolares` para usuários com papel `admin` ou `operador`.
- `DELETE` permanece restrito a `admin`.
- A leitura de `unidades_escolares` continua liberada para usuários autenticados.

Impacto: o esqueleto de RBAC no banco está pronto; a pendência passa a ser integração efetiva no frontend, guards por perfil e revisão humana de segurança antes de dados reais.

### Infraestrutura transversal da aplicação

A camada de aplicação está mais avançada do que a descrição documental anterior.

Já existem:

- `QueryClientProvider` com `staleTime` de 5 minutos, `retry: 1` e `refetchOnWindowFocus: false`.
- `TooltipProvider`, `Toaster` shadcn e `Sonner`.
- `BrowserRouter` com rotas protegidas por `ProtectedRoute`.
- `TopLoadingBar` e `CommandPalette` globais.
- `ErrorBoundary` envolvendo as rotas.
- `AnimatePresence` no `AppLayout` para transições entre páginas.
- Vercel Web Analytics via `@vercel/analytics/react`.

Essas decisões estão detalhadas em `docs/UI_CHANGELOG.md`.

## Pendências imediatas dentro do parêntese Supabase

- Criar `docs/CURRENT_GITHUB_AUDIT_2026-04-28.md`.
- Criar `docs/FRONTEND_DATA_CONTRACT.md`.
- Revisar migrations Supabase existentes antes de aplicá-las no Supabase próprio.
- Validar o importador atual da `BASE.xlsx` antes de carga oficial.
- Decidir tratamento de `designacao`, código/nome da escola, `programa`, `alunos`, campos financeiros e `import_logs`.
- Sanear resíduos Lovable antes de Preview/produção institucional.
- Rebaixar ZIP/lote antes da validação do MVP.
- Integrar papéis reais no frontend e revisar guards por perfil.
- Realizar revisão humana de segurança antes de dados reais e produção.

## Fora do parêntese Supabase atual

Permanecem no curso natural do Plano Global v4:

- monorepo;
- backend Fastify;
- migração completa do frontend para API;
- motor documental v1;
- geração individual real;
- Portal do Diretor funcional completo;
- vínculo diretor-escola em produção;
- ZIP/lote real;
- Cloud Run/worker/benchmark.

## Próximo passo recomendado

Executar uma tarefa documental e sem alteração de código para criar:

1. `docs/CURRENT_GITHUB_AUDIT_2026-04-28.md`;
2. `docs/FRONTEND_DATA_CONTRACT.md`.

Essa tarefa pertence ao parêntese Supabase e deve anteceder novas migrations, novo Supabase próprio ou alteração de produção.
