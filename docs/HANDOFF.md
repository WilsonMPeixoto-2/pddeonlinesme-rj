# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 08/09/2026 16:56 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Fonte de verdade:** código, commits, CI, Supabase e deployments reais. Este documento é um snapshot auxiliar.

## 1. Estado verificado

- `main`: `1722b4b50c5340b39a883220423cc40e2b315eeb`.
- PR #112 — `chore(deps): atualizar lote seguro de dependências`: **merged**.
- Vercel Production: `dpl_EAAQ6mBgPQ1w6EbLXHg83yHasdPr`, estado **READY**, commit `1722b4b50c5340b39a883220423cc40e2b315eeb`.
- Domínio `https://pddeonlinesme-rj.vercel.app/`: HTTP 200 após o deploy.
- Supabase oficial: `raluxyojqosfzrfozmpz` (`pdde-online-2026-dev`).
- Estado do Supabase verificado em 08/09/2026 16:56: **ACTIVE_HEALTHY**.
- Nenhum projeto Supabase externo ao PDDE Online foi pausado ou alterado nesta tarefa.

## 2. Incidente de autenticação

Em 03/09/2026, o login e a recuperação de senha estavam indisponíveis porque o projeto Supabase oficial estava `INACTIVE`. A tentativa de restauração foi inicialmente bloqueada pelo limite de projetos gratuitos ativos.

O defeito independente do fluxo de recuperação foi corrigido no PR #110, merge `48e1a77de901d8b5abf5db273c94639da6aebcc5`:

- redirect de recuperação para `/redefinir-senha`;
- rota pública dedicada;
- atualização de senha via `supabase.auth.updateUser()`;
- tratamento de link inválido/expirado;
- mensagem amigável para indisponibilidade do serviço;
- cobertura E2E do fluxo.

CI final do hotfix: run `33711713326`, integralmente aprovado.

O backend está novamente `ACTIVE_HEALTHY`, mas o incidente de Auth só deve ser considerado encerrado após smoke real de login, reset, Redirect URLs e entrega do e-mail.

## 3. Atualização de dependências — PR #112

Merge: `1722b4b50c5340b39a883220423cc40e2b315eeb`.

Atualizações aplicadas:

- `lucide-react` → `1.40.0`;
- `react-hook-form` → `7.87.0`;
- `@types/react-dom` → `19.2.7`;
- `eslint-plugin-react-refresh` → `0.5.6`;
- `globals` → `17.12.0`;
- `knip` → `6.34.0`;
- `typescript-eslint` → `8.69.0`.

Ficaram deliberadamente fora do lote:

- `@supabase/supabase-js`, enquanto Auth não estiver validado de ponta a ponta;
- majors de Vitest, jsdom, Framer Motion, TypeScript e Node.

### Evidência de validação

Workflow controlado pré-PR: run `34270447310`.

- instalação da baseline com `npm ci`;
- atualização exata das sete dependências;
- remoção de `node_modules` e novo `npm ci` apenas pelo lockfile regenerado;
- typecheck;
- lint;
- 130/130 testes unitários;
- cobertura;
- auditoria do template do Demonstrativo;
- build;
- 11/11 E2E/acessibilidade;
- `npm audit` e `npm audit --omit=dev`: 0 HIGH, 0 CRITICAL, 2 MODERATE conhecidos.

CI oficial do PR #112: run `34270901320`, **success** em todas as etapas.

O diff final do PR #112 continha somente `package.json` e `package-lock.json`.

## 4. Risco residual conhecido de dependências

Permanecem 2 vulnerabilidades moderadas na cadeia `exceljs -> uuid`. O `npm audit` propõe correção incompatível por downgrade/major de `exceljs`; não usar `npm audit fix --force`.

O `knip --production` continua encontrando a baseline preexistente:

- 26 arquivos não usados;
- 22 dependências não usadas;
- 49 exports não usados;
- 14 tipos exportados não usados.

Esses achados foram comparados antes/depois e não são regressão do PR #112. Tratar limpeza de dependências mortas em PR próprio, com revisão de impacto no design system e rotas.

## 5. Produção Vercel

Projeto principal:

- Project ID: `prj_dErjl7LdzTL2412fsw0pyzo3bdp1`;
- runtime: Node `24.x`;
- domínio: `https://pddeonlinesme-rj.vercel.app`.

Produção confirmada em 08/09/2026:

- deployment: `dpl_EAAQ6mBgPQ1w6EbLXHg83yHasdPr`;
- commit: `1722b4b50c5340b39a883220423cc40e2b315eeb`;
- estado: `READY`;
- `main` e Production sincronizadas.

## 6. Proteções técnicas que continuam válidas

### Node

Manter Node 24.x e `@types/node` 24.x. Não migrar para Node/@types 26 sem decisão explícita de runtime e benefício comprovado.

### Code splitting

O PR #98 aplicou `React.lazy()` por rota e causou tela vazia em Production; o PR #99 reverteu. O PR #109 retoma performance/code splitting e deve permanecer separado de Auth e de dependências.

Qualquer retomada exige:

- Preview Vercel validado visualmente;
- sessão limpa e sessão com cache/service worker anterior;
- smoke de `/`, `/dashboard`, `/acesso-negado` e rota autenticada;
- rollback explícito.

### Supabase/Auth

- não trocar o projeto Supabase oficial;
- não pausar ou alterar outro projeto sem autorização explícita;
- não misturar migrations, RLS, dados financeiros ou regras de negócio com correções de Auth;
- não atualizar `@supabase/supabase-js` antes do smoke real de Auth.

## 7. Próxima prioridade

1. Validar em Production login, recuperação de senha, Redirect URLs e e-mail de recuperação com `raluxyojqosfzrfozmpz` em `ACTIVE_HEALTHY`.
2. Com Auth estabilizado, avaliar atualização do cliente `@supabase/supabase-js` em PR isolado.
3. Depois, avaliar majors de ferramentas/testes separadamente.
4. Só então retomar PR #109 ou nova frente de performance.

## 8. Leitura para continuidade

1. `AGENTS.md`;
2. `.continuity/current-state.json`;
3. `.continuity/session-log.jsonl`;
4. `docs/PLANO_GLOBAL_V4_2.md`;
5. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
6. `docs/DECISIONS.md`;
7. `docs/ROADMAP_ADAPTIVE.md`.

Histórico detalhado anterior permanece preservado no Git e no `session-log.jsonl`; este handoff foi consolidado para eliminar snapshots conflitantes e permitir leitura operacional rápida.
