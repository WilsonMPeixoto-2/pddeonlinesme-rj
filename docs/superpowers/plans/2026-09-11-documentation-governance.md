# Documentation Governance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reconciliar a documentação do PDDE Online 2026 com o estado real de Production em 11/09/2026 e instituir um roteiro obrigatório de leitura com hierarquia documental explícita.

**Architecture:** A mudança não reorganiza fisicamente o histórico. Cria uma camada de governança sobre a árvore existente: `docs/README.md` vira a porta de entrada, `docs/DECISIONS.md` vira a fonte canônica das decisões vigentes, `current-state/HANDOFF/ROADMAP` formam a camada operacional e os documentos antigos passam a ser classificados como históricos. O código e os ambientes reais continuam acima da documentação na ordem de precedência.

**Tech Stack:** Markdown, JSON, GitHub, documentação versionada.

**Spec:** `docs/superpowers/specs/2026-09-11-documentation-governance-design.md`

## Global Constraints

- Nenhum arquivo de aplicação, migration, workflow ou configuração de runtime deve ser alterado.
- A fonte de verdade técnica continua sendo código, banco, CI e deployment real.
- Não renomear ou mover em massa documentos históricos nesta etapa.
- `docs/DECISIONS.md` deve concentrar decisões vigentes; `docs/DECISIONS_LOG.md` fica histórico.
- O roteiro obrigatório deve diferenciar leitura geral de leitura técnica por domínio.
- Dados financeiros ausentes nunca devem ser documentados como zero.
- A automação financeira não pode ser descrita como ativa enquanto `PDDE_FINANCIAL_SYNC_ENABLED` e secrets de backend não estiverem configurados.

---

### Task 1: Criar a porta de entrada documental

**Files:**
- Create: `docs/README.md`

**Interfaces:**
- Consumes: árvore documental atual e ordem de precedência definida no spec.
- Produces: mapa de autoridade, roteiro obrigatório, matriz por tipo de tarefa e classificação de documentos.

- [ ] **Step 1:** Criar `docs/README.md` com classes CANÔNICO, OPERACIONAL, TÉCNICO POR DOMÍNIO e HISTÓRICO.
- [ ] **Step 2:** Inserir a ordem de precedência `sistema real → decisões → estado/handoff → técnico → histórico`.
- [ ] **Step 3:** Inserir roteiro obrigatório de leitura e matriz “se a tarefa é X, leia Y”.
- [ ] **Step 4:** Validar manualmente todos os caminhos internos referenciados.
- [ ] **Step 5:** Commitar a entrega documental.

### Task 2: Reconciliar regras gerais e apresentação do projeto

**Files:**
- Modify: `AGENTS.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: `docs/README.md`, `package.json`, estado de Production e decisões vigentes.
- Produces: instruções atuais para agentes e visão pública/técnica do projeto sem snapshots obsoletos.

- [ ] **Step 1:** Remover de `AGENTS.md` o estado antigo como verdade corrente e substituir por regra de consulta a `docs/README.md` + verificação real.
- [ ] **Step 2:** Atualizar o roteiro “antes de qualquer tarefa” e política “depois de tarefa relevante”.
- [ ] **Step 3:** Atualizar `README.md` para stack atual: Node 24, React 19, Vite 8, TypeScript 6, Tailwind 4, Vitest 5, jsdom 30 e Supabase.
- [ ] **Step 4:** Documentar pipeline financeiro, recorte confiável, busca global e navegação contextual sem fixar contagens voláteis de testes.
- [ ] **Step 5:** Conferir que o README não descreva automação financeira como ativa.

### Task 3: Consolidar decisões vigentes

**Files:**
- Modify: `docs/DECISIONS.md`
- Modify: `docs/DECISIONS_LOG.md`

**Interfaces:**
- Consumes: PRs #129–#132, contratos financeiros recentes e Radar institucional.
- Produces: uma única fonte canônica de decisões vigentes e um log histórico claramente rotulado.

- [ ] **Step 1:** Adicionar em `DECISIONS.md` uma seção de governança documental e precedência.
- [ ] **Step 2:** Registrar decisões de negócio do ciclo setembro/2026: maturidade, NULL ≠ zero, recorte principal, hierarquia financeira, múltiplas contas, proveniência, drill-down, busca real, preservação de contexto e gate de automação.
- [ ] **Step 3:** Marcar decisões antigas que foram superadas sem apagar o histórico necessário.
- [ ] **Step 4:** Transformar `DECISIONS_LOG.md` em registro histórico com ponte explícita para `DECISIONS.md`.

### Task 4: Atualizar a camada operacional

**Files:**
- Modify: `.continuity/current-state.json`
- Modify: `docs/HANDOFF.md`
- Modify: `docs/ROADMAP_ADAPTIVE.md`

**Interfaces:**
- Consumes: `main`/Production em 11/09/2026, estado do Supabase e PRs #129–#132.
- Produces: fotografia corrente legível por ferramentas e por humanos.

- [ ] **Step 1:** Atualizar `current-state.json` para o ciclo atual, removendo PRs #109/#111/#112 como frente vigente.
- [ ] **Step 2:** Registrar `main` base anterior à PR documental, Production READY, 163 escolas, 335 contas, 537 repasses e cinco dimensões 163/163.
- [ ] **Step 3:** Reescrever `HANDOFF.md` como estado operacional de 11/09/2026 e indicar que não há PR recente aberto no fechamento do ciclo.
- [ ] **Step 4:** Atualizar `ROADMAP_ADAPTIVE.md` para retirar como próximas tarefas entregas já concluídas e separar “entregue”, “pendência operacional” e “candidatas futuras”.
- [ ] **Step 5:** Validar o JSON com parser e revisar datas/SHAs.

### Task 5: Classificar baseline estratégica e corrigir contrato financeiro documental

**Files:**
- Modify: `docs/PLANO_GLOBAL_V4_2.md`
- Modify: `docs/technical/financial-publication-contract-v1.md`

**Interfaces:**
- Consumes: estado atual e workflow `sync-financial-snapshot.yml`.
- Produces: plano histórico corretamente contextualizado e contrato financeiro sem falsa afirmação de automação ativa.

- [ ] **Step 1:** Adicionar banner no Plano Global v4.2 informando que ele é baseline estratégica de maio/2026 e que status corrente vem do roteiro canônico.
- [ ] **Step 2:** Preservar seus 15 marcos como referência, sem reescrever toda a história.
- [ ] **Step 3:** Corrigir a seção Automação do contrato financeiro: workflow existe; `schedule` fica inerte enquanto o gate não for habilitado; manual também exige secrets válidos.
- [ ] **Step 4:** Referenciar `docs/README.md` como ponto de entrada para estado corrente.

### Task 6: Verificação documental adversarial e PR

**Files:**
- Review: todos os arquivos alterados nesta branch.

**Interfaces:**
- Consumes: Tasks 1–5.
- Produces: diff documental consistente e PR pronto para revisão.

- [ ] **Step 1:** Comparar branch contra `main` e confirmar que o diff contém apenas documentação/continuidade.
- [ ] **Step 2:** Validar sintaxe de `.continuity/current-state.json`.
- [ ] **Step 3:** Verificar referências a documentos internos adicionadas nesta PR.
- [ ] **Step 4:** Procurar termos obsoletos críticos (`PR #109`, `PR #111`, `Vite 7`, `Vitest 4`, “próxima frente = Painel”) nos documentos canônicos/operacionais.
- [ ] **Step 5:** Abrir PR documental com resumo das fontes de verdade, decisões consolidadas e validações executadas.
