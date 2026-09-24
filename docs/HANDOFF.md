# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 18/09/2026 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`

> Este handoff é uma fotografia operacional. Código, banco, CI e deployment real prevalecem em caso de divergência.

## 1. Estado verificado no fechamento do ciclo funcional

Baseline funcional verificado em 18/09/2026:

- `main`: `b2451447766a3366242d9595bb560ae112404c5e`;
- Production Vercel: `dpl_9UNePVuaekvYQhSg8rjxkUJU9ArD`;
- estado do deployment: `READY`;
- domínio público: `https://pddeonlinesme-rj.vercel.app`;
- CI da PR #173: verde;
- CI da PR #174: verde;
- Supabase oficial: `raluxyojqosfzrfozmpz`;
- RPC `publish_financial_snapshot_with_order_evidence_v1(jsonb)`: instalada;
- nova verificação HTTP externa do domínio: não registrada nesta reconciliação.

PR documental posterior pode alterar o SHA de `main` sem alterar o baseline funcional acima.

## 2. Ciclos funcionais consolidados até a PR #174

### PR #129 — pipeline de publicação financeira por dimensão

Entregue:

- contrato V1 de maturidade/publicação;
- cinco dimensões financeiras com cobertura 163/163;
- publicação transacional no Supabase;
- proteção contra regressão de cobertura;
- idempotência por workflow/artifact;
- replay completo das migrations no CI;
- testes de contrato SQL;
- classificação de ações reais de PDDE Qualidade/Equidade;
- gate operacional para sincronização agendada.

### PR #130 — recorte financeiro principal do Painel

Entregue:

- hero do Painel baseado na 1ª parcela paga do PDDE Básico;
- data, cobertura e composição no mesmo universo do KPI principal;
- remoção de visualização que misturava universos com maturidade desigual;
- ausência de dado preservada sem virar zero.

### PR #131 — busca global operacional

Entregue:

- `Ctrl/Cmd+K` como localizador de áreas reais do produto;
- pesquisa das 163 unidades por designação, nome, diretor, INEP e CNPJ;
- remoção de rotas demo, ações fictícias e pseudoatalhos inexistentes.

### PR #132 — contexto da carteira de escolas

Entregue:

- `q` e `status` na URL da carteira;
- transporte de contexto para a ficha;
- retorno seguro apenas para `/escolas` ou `/escolas?...`;
- preservação do recorte da carteira ao voltar;
- histórico do navegador sem entradas redundantes por digitação/retorno.

### PR #166 — evidência externa da P2

Entregue:

- camada complementar `repasse_evidencias_financeiras`;
- 52 escolas de `PDDE Básico — Primeira Infância — P2`;
- total informado de **R$ 132.630,00**;
- custeio de **R$ 81.034,00**;
- capital de **R$ 51.596,00**;
- ordem de pagamento em **14/09/2026**;
- nenhuma data distinta de crédito bancário confirmada.

### PR #173 — drill-down operacional do 2º ciclo

Entregue:

- resumo do 2º ciclo no Dashboard;
- `/repasses?ciclo=2` com relação nominal, INEP, situação, ordem, custeio, capital e total;
- busca, filtro, ordenação e exportação;
- drill-down para Recursos PDDE e retorno ao mesmo recorte;
- Portal do Diretor com ordem visível sem alterar `recebido`, saldo ou execução;
- agregados de `Pagamento identificado` exigindo `data_pagamento`.

### PR #174 — persistência automática de ordens do FNDE

Entregue:

- RPC transacional `publish_financial_snapshot_with_order_evidence_v1(jsonb)`;
- sincronização de ordens validadas pelo motor em `repasse_evidencias_financeiras`;
- idempotência e bloqueio de divergências;
- preservação de `data_pagamento = NULL` quando existe apenas ordem;
- `repository_dispatch` e fallback diário elegíveis por padrão;
- `PDDE_FINANCIAL_SYNC_ENABLED=false` como kill-switch explícito.

A PR #174 depende de fonte válida e credenciais de backend para publicar. Na verificação de 18/09, ainda não havia nova linha em `integracoes_financeiras_runs` após a ativação; a primeira publicação automática pós-PR #174 ainda precisava ser comprovada.

## 3. Governança documental instituída na PR #133

A documentação passa a usar uma hierarquia explícita:

1. sistema real verificado;
2. `docs/DECISIONS.md`;
3. `.continuity/current-state.json` e `docs/HANDOFF.md`;
4. documentação técnica do domínio;
5. histórico.

`docs/README.md` é a porta de entrada obrigatória.

Foram classificados como históricos, sem apagar sua rastreabilidade:

- Plano Global v4.2 como baseline estratégica de maio/2026;
- `OPPORTUNITIES_BACKLOG.md` como snapshot de maio/2026;
- `DECISIONS_LOG.md` como histórico de decisões antigas;
- specs, planos e handoffs datados.

## 4. Estado financeiro atual

Validado no Supabase oficial:

- 163 escolas;
- 335 contas bancárias;
- 537 registros de repasse/parcela;
- 5 dimensões V1 `MATURE/PUBLISHED`;
- cobertura das dimensões: 163/163;
- 52 evidências financeiras complementares;
- P2 Primeira Infância: **R$ 132.630,00**;
- composição P2: **R$ 81.034,00 custeio + R$ 51.596,00 capital**;
- 52 ordens em **14/09/2026**;
- créditos bancários confirmados nesse recorte: **0**;
- `integracoes_financeiras_runs`: 2;
- última publicação financeira observada: **09/09/2026**.

Decisões obrigatórias:

- ausência de informação não é zero;
- uma escola pode ter múltiplas contas no mesmo programa;
- hierarquia: `programa → ação → parcela → conta`;
- dimensão coletada só vira informação operacional depois de contrato de maturidade/publicação;
- saldo atual, movimentos posteriores, crédito localizado completo e conciliação documento × débito continuam fora da superfície operacional enquanto não houver contrato próprio e cobertura adequada.

## 5. Sincronização financeira automática

Workflow: `.github/workflows/sync-financial-snapshot.yml`.

Desde a PR #174, `repository_dispatch` e o fallback diário estão habilitados por padrão no código:

```text
vars.PDDE_FINANCIAL_SYNC_ENABLED != 'false'
```

`PDDE_FINANCIAL_SYNC_ENABLED=false` é o kill-switch explícito. A publicação automática usa **GitHub OIDC**: o job solicita um token efêmero com audience `pdde-online-financial-publisher`, e a Edge Function do Supabase valida repositório, environment `production`, branch `main`, workflow e evento antes de chamar a RPC transacional.

A publicação real continua exigindo:

- destino fixo `https://raluxyojqosfzrfozmpz.supabase.co`;
- snapshot/proveniência válidos;
- gates de maturidade, cobertura e regressão aprovados;
- read-after-write da view operacional.

A chave administrativa não é armazenada no GitHub Actions; permanece restrita ao runtime do Supabase. Configuração ativa continua não equivalendo a publicação comprovada.

## 6. CI atual

`.github/workflows/ci.yml` possui dois jobs principais:

### Aplicação

- `npm ci`;
- typecheck;
- lint;
- testes unitários e cobertura;
- auditoria do template do Demonstrativo;
- build;
- bundle budget;
- Playwright E2E + acessibilidade;
- Knip de produção;
- auditoria de vulnerabilidades.

### Contrato Supabase

- sobe Supabase local;
- reconstrói todo o banco pelas migrations;
- roda `supabase test db`;
- encerra a stack local.

Execuções obsoletas do mesmo PR são canceladas por `concurrency`.

## 7. Decisões de produto vigentes

Fonte canônica: `docs/DECISIONS.md`.

Resumo do ciclo atual:

- **Dados → análise → escola → ação → evidência**;
- publicar somente dimensões maduras;
- não completar lacunas por inferência;
- 1ª parcela paga do PDDE Básico é o recorte financeiro principal enquanto for o universo integralmente validado;
- preservar múltiplas contas;
- manter proveniência técnica fora da superfície operacional comum;
- agregados relevantes devem levar a detalhe/filtro/ação;
- ordem de pagamento e crédito bancário são estados distintos;
- `Pagamento identificado` exige `data_pagamento`;
- automação financeira é elegível por padrão; `false` é o kill-switch;
- configuração de automação não substitui prova de publicação;
- busca global só anuncia funcionalidades reais;
- contexto da carteira deve sobreviver ao drill-down;
- design deve ser institucional, claro e original, sem excesso decorativo.

## 8. Pendências operacionais reais

### 8.1. Confirmar a primeira publicação automática pós-PR #174

A automação já está habilitada no código. A pendência agora é **provar a execução real ponta a ponta**.

Na primeira execução válida após a PR #174, confirmar:

1. workflow concluído com sucesso;
2. `workflow_run_id` e `artifact_id` esperados;
3. nova linha ou retorno idempotente em `integracoes_financeiras_runs`;
4. 163 escolas e dimensões maduras preservadas;
5. evidências de ordem sincronizadas sem inventar `data_pagamento`;
6. ausência de regressão nos 52 fatos P2 já preservados.

Se houver incidente, `PDDE_FINANCIAL_SYNC_ENABLED=false` deve ser usado como kill-switch.

### 8.2. Smoke autenticado periódico

CI/Preview não substituem smoke autenticado de fluxos críticos. Priorizar, quando houver mudança nessas áreas:

- login/recuperação;
- carteira → ficha → retorno;
- Repasses → detalhe da unidade;
- edição cadastral;
- geração documental;
- permissões/RLS.

### 8.3. Auth/RLS/auditoria

Continuar hardening antes de ampliar o Portal do Diretor ou expor novos fluxos de escrita para perfis escolares.

## 9. O que não deve ser reaberto por engano

Não tratar como “próxima frente” itens já concluídos:

- Painel Executivo-Operacional básico;
- geração em lote dos 163 Demonstrativos;
- integração financeira V1;
- página operacional de Repasses com 1ª parcela paga e drill-down do 2º ciclo;
- busca global operacional;
- preservação de contexto da carteira;
- stack React/Vite/Vitest atualizada;
- Supabase Foundation como frente genérica.

Novas evoluções podem ampliar essas áreas, mas devem partir do estado atual, não dos planos de maio.

## 10. Roteiro obrigatório para continuidade

1. `AGENTS.md`;
2. `docs/README.md`;
3. `.continuity/current-state.json`;
4. `docs/HANDOFF.md`;
5. `docs/DECISIONS.md`;
6. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
7. documentação técnica da tarefa;
8. `main`, PRs, CI, Supabase e Production conforme o escopo.

`docs/PLANO_GLOBAL_V4_2.md`, `docs/OPPORTUNITIES_BACKLOG.md` e documentos em `docs/superpowers/` são referências estratégicas/históricas, não fotografia atual.

## 11. Próximos movimentos recomendados

1. manter o roteiro obrigatório de leitura e evitar novas fontes concorrentes de estado/decisões;
2. manter smoke autenticado proporcional ao risco das próximas mudanças;
3. confirmar e auditar a primeira publicação automática pós-PR #174;
4. atualizar a P2 somente quando surgir evidência de crédito bancário confirmado;
5. continuar hardening de Auth/RLS/auditoria antes de ampliar fluxos de escrita do Portal do Diretor;
6. publicar novas dimensões financeiras apenas quando tiverem contrato próprio e cobertura madura;
7. tratar novos documentos oficiais, importador e frente fiscal em PRs isolados, com fonte estruturada e revisão humana.
