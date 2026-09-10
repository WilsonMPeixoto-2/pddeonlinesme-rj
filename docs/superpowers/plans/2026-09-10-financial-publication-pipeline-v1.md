# Financial Publication Pipeline V1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatizar a publicação do snapshot financeiro validado do `pdde-repasse-conciliador` no Supabase do PDDE Online, com gate explícito de maturidade por dimensão, idempotência e proteção contra regressão.

**Architecture:** O motor continua responsável pela coleta e pelo snapshot validado. O PDDE Online adiciona um transformador determinístico, um contrato de dimensões persistido e uma RPC PostgreSQL única que valida e publica a projeção operacional atomicamente. O frontend continua lendo o Supabase e não recebe metadados técnicos.

**Tech Stack:** Node 24, JavaScript ESM, Vitest 5, GitHub Actions, Supabase/PostgreSQL, React/Vite existente.

**Spec:** `docs/technical/financial-publication-contract-v1.md`

## Global Constraints

- Projeto Supabase correto: `raluxyojqosfzrfozmpz`.
- Repositório operacional correto: `WilsonMPeixoto-2/pddeonlinesme-rj`.
- Fonte: `WilsonMPeixoto-2/pdde-repasse-conciliador`.
- Exercício operacional inicial: 2026.
- Universo esperado da V1: 163 escolas.
- Ausência de informação permanece `NULL`; zero exige valor explícito da fonte.
- Nenhum workflow/artifact/hash/metodologia deve aparecer na interface operacional.
- Publicação deve ser idempotente, transacional e bloquear regressão de cobertura.
- Não ampliar permissões de `anon`/`authenticated` para realizar importação.

---

### Task 1: Transformador e gate determinístico

**Files:**
- Create: `scripts/lib/financial-publication.mjs`
- Create: `src/test/financial-publication.test.ts`

**Interfaces:**
- Consumes: snapshot reidratado no formato humano do `pdde-repasse-conciliador`.
- Produces: `buildNormalizedPublicationPayload(snapshot, manifest)` e `evaluatePublicationDimensions(payload)`.

- [ ] **Step 1: Escrever testes RED para classificação de programa/ação, múltiplas contas, centavos→reais e NULL preservado**
- [ ] **Step 2: Executar `npm test -- src/test/financial-publication.test.ts` e confirmar falha por módulo inexistente**
- [ ] **Step 3: Implementar transformação mínima para o payload `{ accounts, repasses, dimensions, source }`**
- [ ] **Step 4: Executar o teste e confirmar GREEN**
- [ ] **Step 5: Adicionar testes RED para as cinco dimensões, inclusive cobertura 162/163 e breakdown incompleto**
- [ ] **Step 6: Implementar `evaluatePublicationDimensions` sem preencher ausência com zero**
- [ ] **Step 7: Executar os testes e confirmar GREEN**

### Task 2: Contrato SQL de dimensões e publicação atômica

**Files:**
- Create: `supabase/migrations/20260910152000_financial_publication_pipeline_v1.sql`
- Create: `supabase/tests/financial_publication_pipeline_v1.sql`

**Interfaces:**
- Consumes: payload normalizado gerado pela Task 1.
- Produces: `financial_dimension_contracts`, `financial_dimension_status`, `vw_financial_dimension_publication` e RPC `publish_financial_snapshot_v1(...)`.

- [ ] **Step 1: Escrever pgTAP/SQL de contrato esperando tabelas, constraints, RLS e RPC ainda inexistentes**
- [ ] **Step 2: Executar reset/teste local no CI de banco e confirmar RED**
- [ ] **Step 3: Criar tabelas de contrato/status com estados separados de qualidade/publicação**
- [ ] **Step 4: Semear contratos das cinco dimensões V1 com `coverage_expected=163` e `coverage_required_ratio=1`**
- [ ] **Step 5: Implementar RPC SECURITY DEFINER restrita ao `service_role`, com `search_path` fixo, idempotência e bloqueio de run regressiva**
- [ ] **Step 6: Na RPC, validar INEPs, duplicidades, valores, contas e componentes antes de modificar a projeção operacional**
- [ ] **Step 7: Publicar contas/repasses e status na mesma transação; qualquer exceção deve fazer rollback total**
- [ ] **Step 8: Backfill do snapshot vigente para o último `integracoes_financeiras_runs` sem inventar cobertura**
- [ ] **Step 9: Executar testes SQL e confirmar GREEN**

### Task 3: Cliente de sincronização do snapshot publicado

**Files:**
- Create: `scripts/sync-financial-snapshot.mjs`
- Modify: `package.json`
- Modify: `src/test/financial-publication.test.ts`

**Interfaces:**
- Consumes: manifesto `public/data/pdde-2026-snapshot.json` do motor.
- Produces: chamada única à RPC `publish_financial_snapshot_v1`.

- [ ] **Step 1: Escrever teste RED para reidratação `gzip-base64-parts` com fixture local**
- [ ] **Step 2: Implementar `hydratePublishedSnapshot` com limite de tamanho e validação do manifesto**
- [ ] **Step 3: Escrever teste RED para rejeitar manifesto sem `workflowRunId`, `artifactId` ou `publishedAt`**
- [ ] **Step 4: Implementar validação dos metadados e digest SHA-256 do snapshot reidratado**
- [ ] **Step 5: Implementar cliente Supabase REST usando somente `SUPABASE_SERVICE_ROLE_KEY` no processo backend**
- [ ] **Step 6: Adicionar `npm run sync:financial:snapshot`**
- [ ] **Step 7: Confirmar testes, typecheck/lint aplicáveis e execução `--dry-run`**

### Task 4: Workflow automático controlado

**Files:**
- Create: `.github/workflows/sync-financial-snapshot.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` como GitHub Actions secrets.
- Produces: sincronização horária/manual, sem mudanças de código e sem deployment Vercel desnecessário.

- [ ] **Step 1: Criar workflow com `workflow_dispatch` e `schedule`, `concurrency` e permissões mínimas**
- [ ] **Step 2: Fixar origem ao repositório/branch `pdde-repasse-conciliador/main`**
- [ ] **Step 3: Executar o script em modo real apenas quando ambos os segredos existirem; falhar explicitamente caso contrário**
- [ ] **Step 4: Adicionar ao CI teste do transformador e validação sintática do workflow**
- [ ] **Step 5: Confirmar que não há escrita com chave anon nem checkout do RADAR PDDE**

### Task 5: Aplicação segura e prova de produção

**Files:**
- Modify apenas se a validação apontar defeito comprovado nas Tasks 1–4.

**Interfaces:**
- Consumes: migration e script validados.
- Produces: banco preparado e uma sincronização idempotente comprovada contra o snapshot vigente.

- [ ] **Step 1: Rodar `npm run validate`, testes SQL e auditoria de dependências**
- [ ] **Step 2: Aplicar migration no projeto `raluxyojqosfzrfozmpz`**
- [ ] **Step 3: Executar consulta de invariantes: 163 escolas, 335 contas, 537 repasses, 169 pagos e status das cinco dimensões**
- [ ] **Step 4: Executar sincronização do snapshot vigente; a primeira chamada deve registrar/publicar ou reconhecer idempotência**
- [ ] **Step 5: Reexecutar a mesma sincronização e provar que nenhuma duplicidade foi criada**
- [ ] **Step 6: Criar PR, aguardar CI completo, revisar diff e somente então fazer merge**
- [ ] **Step 7: Verificar que frontend continua funcionando e que nenhum metadado técnico surgiu na UI**
