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
- Create: `src/test/financial-publication.test.mjs`

**Interfaces:**
- Consumes: snapshot reidratado no formato humano do `pdde-repasse-conciliador`.
- Produces: `buildNormalizedPublicationPayload(snapshot, manifest)` e `evaluatePublicationDimensions(payload)`.

- [x] **Step 1: Escrever testes RED para classificação de programa/ação, múltiplas contas, centavos→reais e NULL preservado**
- [x] **Step 2: Executar testes e confirmar RED antes da implementação**
- [x] **Step 3: Implementar transformação para o payload `{ accounts, repasses, dimensions, source }`**
- [x] **Step 4: Confirmar GREEN após implementação**
- [x] **Step 5: Cobrir as cinco dimensões, inclusive cobertura 162/163 e breakdown incompleto**
- [x] **Step 6: Implementar `evaluatePublicationDimensions` sem preencher ausência com zero**
- [x] **Step 7: Validar também o snapshot real publicado pelo conciliador e suas ações canônicas**

### Task 2: Contrato SQL de dimensões e publicação atômica

**Files:**
- Create: `supabase/migrations/20260911065126_financial_publication_pipeline_v1.sql`
- Create: `supabase/tests/financial_publication_pipeline_v1.sql`

**Interfaces:**
- Consumes: payload normalizado gerado pela Task 1.
- Produces: `financial_dimension_contracts`, `financial_dimension_status`, `vw_financial_dimension_publication` e RPC `publish_financial_snapshot_v1(...)`.

- [x] **Step 1: Escrever pgTAP/SQL de contrato esperando tabelas, constraints, RLS e RPC**
- [x] **Step 2: Criar tabelas de contrato/status com estados separados de qualidade/publicação**
- [x] **Step 3: Semear contratos das cinco dimensões V1 com `coverage_expected=163` e `coverage_required_ratio=1`**
- [x] **Step 4: Implementar RPC SECURITY DEFINER restrita ao `service_role`, com `search_path` fixo, idempotência e bloqueio de run regressiva**
- [x] **Step 5: Validar INEPs, duplicidades, valores, contas e componentes antes de modificar a projeção operacional**
- [x] **Step 6: Publicar contas/repasses e status na mesma transação; qualquer exceção faz rollback total**
- [x] **Step 7: Fazer backfill do snapshot vigente sem inventar cobertura**
- [x] **Step 8: Rebuild local completo e testes SQL verdes no CI**

### Task 3: Cliente de sincronização do snapshot publicado

**Files:**
- Create: `scripts/sync-financial-snapshot.mjs`
- Modify: `package.json`
- Modify: testes financeiros.

**Interfaces:**
- Consumes: manifesto `public/data/pdde-2026-snapshot.json` do motor.
- Produces: chamada única à RPC `publish_financial_snapshot_v1`.

- [x] **Step 1: Implementar reidratação `gzip-base64-parts` com limites de tamanho**
- [x] **Step 2: Validar manifesto, proveniência e digest SHA-256**
- [x] **Step 3: Implementar cliente Supabase REST usando somente `SUPABASE_SERVICE_ROLE_KEY` no processo backend**
- [x] **Step 4: Adicionar `npm run sync:financial:snapshot` e `--dry-run`**
- [x] **Step 5: Validar o snapshot real vigente: 163 escolas, 335 contas, 537 repasses e 5 dimensões MATURE**

### Task 4: Workflow automático controlado

**Files:**
- Create: `.github/workflows/sync-financial-snapshot.yml`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: `PDDE_SUPABASE_URL` e `PDDE_SUPABASE_SERVICE_ROLE_KEY` como GitHub Actions secrets.
- Produces: sincronização controlada, sem mudanças de código e sem deployment Vercel desnecessário.

- [x] **Step 1: Criar workflow com `workflow_dispatch`, agendamento, concorrência e permissões mínimas**
- [x] **Step 2: Fixar destino ao projeto Supabase `raluxyojqosfzrfozmpz` e fonte pública do conciliador/main**
- [x] **Step 3: Falhar explicitamente em execução manual se as credenciais obrigatórias estiverem ausentes**
- [x] **Step 4: Manter o agendamento inerte por `PDDE_FINANCIAL_SYNC_ENABLED` até os secrets serem configurados**
- [x] **Step 5: Adicionar CI de contrato, transformador e workflow**

### Task 5: Aplicação segura e prova de produção

- [x] **Step 1: Rodar CI completo e testes SQL**
- [x] **Step 2: Aplicar migration no projeto `raluxyojqosfzrfozmpz`**
- [x] **Step 3: Confirmar invariantes de Production: 163 escolas, 335 contas, 537 repasses e cinco dimensões 163/163**
- [x] **Step 4: Provar a RPC em Production dentro de transação com `ROLLBACK`: primeira chamada `published`, segunda `idempotent`**
- [x] **Step 5: Confirmar RLS e execução exclusiva por `service_role`**
- [ ] **Step 6: Configurar os secrets `PDDE_SUPABASE_URL` e `PDDE_SUPABASE_SERVICE_ROLE_KEY` no environment `production` do GitHub**
- [ ] **Step 7: Habilitar `PDDE_FINANCIAL_SYNC_ENABLED=true` somente após os secrets existirem**

A ausência dos secrets não bloqueia o contrato financeiro nem a aplicação da migration, mas mantém o agendamento deliberadamente inerte. Isso evita falhas recorrentes e impede publicação sem credencial operacional explícita.
