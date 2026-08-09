# Dependency Maintenance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar dependências do PDDE Online 2026 com risco controlado e adicionar proteção browser-level em frente separada.

**Architecture:** A manutenção será dividida em três PRs independentes. O primeiro atualiza apenas versões permitidas pelos ranges existentes e aplica correções de auditoria sem breaking change; o segundo trata dependências sensíveis; o terceiro introduz Playwright e smoke tests. O repositório e o SHA-base são guardas obrigatórios antes de cada frente.

**Tech Stack:** React 19, Vite 8, TypeScript 6, Node 24, Vitest 4, Supabase JS/CLI, npm, GitHub Actions, Vercel, Playwright.

## Global Constraints

- Repositório exclusivo: `WilsonMPeixoto-2/pddeonlinesme-rj`.
- Baseline inicial: `16b2409d7186dca5c4e148b107e6804ac1276787`.
- Node permanece `24.x`.
- Não atualizar `@types/node` para série incompatível com Node 24.
- Não rebaixar ExcelJS nem executar `npm audit fix --force`.
- Preservar `@rolldown/plugin-babel: 0.1.7` até prova contrária em instalação limpa.
- Não alterar migrations, Auth/RLS, Supabase remoto, dados, templates oficiais ou regras financeiras.
- Não retomar route-level code splitting.

---

### Task 1: Auditoria reproduzível e atualização segura dentro dos ranges

**Files:**
- Modify: `package-lock.json`
- Modify only if required by npm without changing intended ranges: `package.json`
- Create temporarily: `.github/workflows/dependency-refresh-once.yml`
- Create: `docs/quality/DEPENDENCY_REFRESH_2026-08-09.md`

**Interfaces:**
- Consumes: `package.json`, `package-lock.json`, CI atual e Node 24.
- Produces: lockfile atualizado, relatório de versões remanescentes e resultado de auditoria.

- [ ] **Step 1: Confirmar identidade do projeto**

Confirmar que o remoto é `WilsonMPeixoto-2/pddeonlinesme-rj` e que a branch partiu de `16b2409d7186dca5c4e148b107e6804ac1276787`.

- [ ] **Step 2: Executar instalação limpa antes da atualização**

```bash
npm ci
```

Esperado: instalação concluída sem `--force` e sem `--legacy-peer-deps`.

- [ ] **Step 3: Registrar baseline**

```bash
npm outdated --json || true
npm audit --json > dependency-audit-before.json || true
npm audit --omit=dev --json > dependency-audit-prod-before.json || true
```

- [ ] **Step 4: Atualizar apenas dentro dos ranges declarados**

```bash
npm update
npm audit fix
```

Não usar `--force`. O objetivo é atualizar `wanted` dentro das faixas já aceitas pelo projeto.

- [ ] **Step 5: Validar lockfile atualizado**

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

- [ ] **Step 6: Registrar o que permaneceu fora dos ranges**

```bash
npm outdated --json || true
```

Classificar cada major ou mudança sensível como candidata da Task 2, sem atualizá-la nesta task.

- [ ] **Step 7: Remover workflow temporário**

Excluir `.github/workflows/dependency-refresh-once.yml` antes do merge. A branch final deve depender apenas do CI permanente do projeto.

- [ ] **Step 8: Commit e PR**

Commitar lockfile/relatório e abrir PR exclusivo da Frente A. O PR deve descrever versões alteradas, auditoria antes/depois e gates executados.

---

### Task 2: Atualizações sensíveis e Supabase

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Test: testes existentes de auth/data access afetados pelas versões escolhidas
- Create: `docs/quality/SENSITIVE_DEPENDENCIES_2026-08-09.md`

**Interfaces:**
- Consumes: resultado de `npm outdated` da Task 1.
- Produces: decisão explícita por pacote sensível e atualização somente quando benefício/compatibilidade forem comprovados.

- [ ] **Step 1: Criar branch nova a partir da main após a Frente A**

Não empilhar sobre branch não mergeada.

- [ ] **Step 2: Revisar changelogs oficiais**

Priorizar `@supabase/supabase-js`, `supabase`, Vite/PWA/React Router e quaisquer packages fora do range. Registrar breaking changes e compatibilidade com Node 24.

- [ ] **Step 3: Atualizar um grupo sensível por vez**

Usar npm normal, sem `--force`. Não modificar Auth/RLS ou migrations para acomodar atualização de pacote salvo se houver decisão humana específica, o que está fora desta rodada.

- [ ] **Step 4: Executar gates completos**

```bash
npm ci
npx tsc --noEmit
npm run lint
npm test
npm run build
npm audit
npm audit --omit=dev
```

- [ ] **Step 5: Preview e smoke**

Validar login/redirecionamentos e rotas principais em Vercel Preview antes do merge.

- [ ] **Step 6: Commit e PR independente**

Documentar ganhos, riscos, rollback e pacotes explicitamente mantidos.

---

### Task 3: Playwright e smoke browser-level

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `playwright.config.ts`
- Create: `tests/e2e/smoke.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Create: `docs/quality/PLAYWRIGHT_SMOKE_2026-08-09.md`

**Interfaces:**
- Consumes: aplicação Vite existente e rotas definidas em `src/App.tsx`.
- Produces: comando E2E reproduzível e gate de navegador para regressões de renderização/navegação.

- [ ] **Step 1: Escrever o smoke test antes da configuração final**

O teste deve cobrir, no mínimo, `/`, `/dashboard` sem sessão e `/acesso-negado`, verificando renderização e ausência de tela vazia. Para rotas protegidas, confirmar redirecionamento ao login sem depender de credenciais reais.

- [ ] **Step 2: Executar e confirmar falha por Playwright ausente**

```bash
npx playwright test tests/e2e/smoke.spec.ts
```

Esperado: falha por dependência/configuração ainda inexistente, demonstrando o RED do TDD.

- [ ] **Step 3: Instalar Playwright como devDependency**

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

- [ ] **Step 4: Configurar servidor Vite e Chromium**

`playwright.config.ts` deve iniciar `npm run dev -- --host 127.0.0.1` e usar `baseURL` local. Não usar credenciais de produção.

- [ ] **Step 5: Executar smoke e suite existente**

```bash
npx playwright test
npm test
npx tsc --noEmit
npm run lint
npm run build
```

- [ ] **Step 6: Integrar ao CI**

Adicionar instalação do Chromium e execução do smoke após build/testes, mantendo Node 24.

- [ ] **Step 7: Commit e PR independente**

Registrar que o novo gate existe para prevenir regressões semelhantes ao incidente de renderização dos PRs #98/#99.

---

## Self-review

- Cobertura: as três frentes aprovadas estão separadas em tasks/PRs independentes.
- Sem placeholders: cada task contém arquivos, comandos e critérios de aceite.
- Consistência: Node 24, ExcelJS 4.4.0 e override Rolldown são preservados em todas as frentes.
- Escopo: nenhuma task exige alteração de Supabase remoto, migrations, Auth/RLS ou regras financeiras.