# Financial Dimension Contract V2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tornar `financial_dimension_contracts` a fonte efetiva dos thresholds quantitativos do gate e permitir registrar dimensões opcionais parciais sem bloquear a publicação do núcleo financeiro.

**Architecture:** A migration V2 amplia contratos com `required_for_core_publication` e `validator_key`, preserva validadores semânticos versionados e mantém a assinatura `publish_financial_snapshot_v1(jsonb)`. O worker busca contratos do Supabase e avalia dimensões com esses parâmetros; a RPC recalcula o núcleo e registra observações opcionais `COLLECTING/UNPUBLISHED` quando ainda não há validador de servidor.

**Tech Stack:** PostgreSQL/Supabase, PL/pgSQL, Node.js 24, JavaScript ESM, Vitest, pgTAP, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-11-financial-dimension-contract-v2-design.md`

## Global Constraints

- Não editar a migration V1 já aplicada.
- Não alterar a assinatura externa `publish_financial_snapshot_v1(jsonb)`.
- Não conceder acesso a `anon` ou `authenticated` aos contratos/status/RPCs internos.
- `service_role` permanece a única credencial de publicação.
- Thresholds vêm do contrato; invariantes financeiras continuam em código/SQL.
- Dimensão `validator_key='pending'` nunca vira `MATURE` ou `PUBLISHED`.
- Os cinco contratos V1 permanecem obrigatórios para substituir a projeção operacional.
- A identidade do snapshot 4ª CRE 2026 continua exigindo exatamente 163 INEPs únicos.

---

### Task 1: Contrato V2 e testes SQL RED

**Files:**
- Create: `supabase/migrations/20260911220000_financial_dimension_contract_v2.sql`
- Modify: `supabase/tests/financial_publication_pipeline_v1.sql`

**Interfaces:**
- Produces columns `required_for_core_publication boolean` and `validator_key text` on `financial_dimension_contracts`.
- Produces optional contract `bank_balance_positions`.
- Preserves `publish_financial_snapshot_v1(jsonb)`.

- [ ] **Step 1:** adicionar pgTAP que exige as duas novas colunas, cinco contratos obrigatórios, contrato opcional `bank_balance_positions` e ausência de grants para `anon/authenticated`.
- [ ] **Step 2:** adicionar pgTAP que publica payload núcleo válido com `observedDimensions=[{dimensionKey:'bank_balance_positions',coverageObserved:37,...}]` e verifica `MATURE/PUBLISHED` para o núcleo e `COLLECTING/UNPUBLISHED` para saldo.
- [ ] **Step 3:** adicionar pgTAP que desabilita temporariamente um contrato obrigatório e espera falha transacional da RPC; restaurar o contrato dentro do teste.
- [ ] **Step 4:** adicionar pgTAP que altera threshold de um contrato em transação de teste e demonstra que a decisão usa o valor da tabela, não literal no código.
- [ ] **Step 5:** confirmar RED no replay local/CI antes da implementação SQL.

### Task 2: Migration V2

**Files:**
- Create: `supabase/migrations/20260911220000_financial_dimension_contract_v2.sql`

**Interfaces:**
- Adds contract metadata.
- Adds `get_financial_dimension_contracts_v1(integer) returns jsonb` restricted to `service_role`.
- Replaces implementation of `publish_financial_snapshot_v1(jsonb)` without changing signature.

- [ ] **Step 1:** `ALTER TABLE` adiciona `required_for_core_publication` e `validator_key`, ambos `NOT NULL` após backfill seguro.
- [ ] **Step 2:** atualizar os cinco contratos existentes com `required_for_core_publication=true` e validator keys explícitas.
- [ ] **Step 3:** inserir `bank_balance_positions` como enabled, opcional, `validator_key='pending'`, expected 163, ratio 1.
- [ ] **Step 4:** criar RPC service-role-only que retorna contratos habilitados do exercício ordenados por `dimension_key`.
- [ ] **Step 5:** substituir `publish_financial_snapshot_v1` para consultar contratos obrigatórios, usar `coverage_expected`/`coverage_required_ratio`, tornar contagem idempotente dinâmica e inserir observações opcionais como `COLLECTING/UNPUBLISHED`.
- [ ] **Step 6:** marcar `WITHDRAWN` somente os status `PUBLISHED` das dimensões obrigatórias que estão sendo substituídas.
- [ ] **Step 7:** manter advisory lock, proveniência, identidade escolar, contas, repasses, duplicidades, somas, vínculos e proteção contra run regressiva.
- [ ] **Step 8:** preservar `REVOKE` de PUBLIC/anon/authenticated e grants apenas para `service_role`.
- [ ] **Step 9:** executar replay completo + pgTAP até verde.

### Task 3: Worker orientado por contrato

**Files:**
- Modify: `scripts/lib/financial-publication.mjs`
- Modify: `scripts/sync-financial-snapshot.mjs`
- Modify: `src/test/sync-financial-snapshot.test.ts`
- Create: `src/test/financial-dimension-contract-v2.test.ts`

**Interfaces:**
- `evaluatePublicationDimensions(payload, contracts)` requires explicit contract array.
- `fetchFinancialDimensionContracts(env)` reads service-role-only contract RPC.
- publication payload includes `dimensions` for core and `observedDimensions` when present.

- [ ] **Step 1:** testes RED exigem que `evaluatePublicationDimensions` rejeite ausência de contrato obrigatório e use `coverageExpected/coverageRequiredRatio` recebidos.
- [ ] **Step 2:** criar mapa de validadores semânticos por `validatorKey`; remover `EXPECTED_SCHOOLS` do cálculo de maturidade por dimensão.
- [ ] **Step 3:** manter exatamente 163 como invariável global de identidade do snapshot, separada do threshold de dimensão.
- [ ] **Step 4:** implementar fetch dos contratos no Supabase via backend service_role, validando destino oficial e formato retornado.
- [ ] **Step 5:** `main()` busca contratos antes do dry-run/publicação e os passa ao avaliador.
- [ ] **Step 6:** dimensões opcionais `pending` não entram no array de dimensões maduras; observações futuras continuam separadas em `observedDimensions`.
- [ ] **Step 7:** unitários e CI ficam verdes.

### Task 4: Documentação e rollout

**Files:**
- Modify: `docs/technical/financial-publication-contract-v1.md`
- Modify: `docs/DECISIONS.md`
- Modify: `.continuity/current-state.json`
- Modify: `docs/HANDOFF.md`

**Interfaces:**
- Documents V2 contract semantics without claiming optional data is operationally published.

- [ ] **Step 1:** registrar distinção entre configuração quantitativa e validação semântica.
- [ ] **Step 2:** documentar `bank_balance_positions` como contrato opcional em coleta, não dado operacional.
- [ ] **Step 3:** documentar que cinco dimensões obrigatórias continuam gate da projeção V1.
- [ ] **Step 4:** rodar CI completo e database-contract no HEAD final.
- [ ] **Step 5:** aplicar migration em Production somente após replay/pgTAP verdes e preflight de contratos/status atuais.
- [ ] **Step 6:** pós-migration confirmar 163 escolas, 335 contas, 537 repasses, cinco dimensões `MATURE/PUBLISHED` e contrato opcional sem publicação indevida.
- [ ] **Step 7:** merge com SHA esperado e validar Production.
