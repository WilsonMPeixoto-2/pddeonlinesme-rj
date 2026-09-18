# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 18/09/2026 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`

> Este handoff é uma fotografia operacional. Código, banco, CI e deployment real prevalecem em caso de divergência.

## 1. Estado verificado no fechamento do ciclo funcional

Baseline funcional após a PR #173:

- `main` funcional: `f486f9a53f0a1dd5dad2e9a9059784d93061c6c6`;
- Production Vercel: `dpl_5kdW7ijpMUMws2VzUZu4dNCZTLMp`;
- estado do deployment: `READY`;
- alias principal: `https://pddeonlinesme-rj.vercel.app`;
- CI da PR #173: aplicação e contrato Supabase integralmente verdes;
- smoke autenticado em CI: Dashboard → 2º ciclo → escola → retorno ao recorte aprovado;
- verificação HTTP externa desta sessão: indisponível para o domínio, portanto não foi registrada nova afirmação de HTTP 200;
- Supabase oficial: `raluxyojqosfzrfozmpz`.

PR documental posterior pode alterar o SHA de `main` sem alterar o baseline funcional acima.

## 2. Ciclos financeiros e de UX consolidados até a PR #173

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

- camada `repasse_evidencias_financeiras` separada do snapshot canônico;
- 52 escolas de `PDDE Básico — Primeira Infância — P2`;
- total informado de **R$ 132.630,00**;
- custeio de **R$ 81.034,00**;
- capital de **R$ 51.596,00**;
- 52 ordens de pagamento em **14/09/2026**;
- nenhuma data distinta de crédito bancário confirmada;
- proteção contra sobrescrita/regressão da evidência.

### PR #173 — drill-down operacional do 2º ciclo

Entregue:

- Dashboard com resumo do 2º ciclo, composição custeio/capital e prévia nominal;
- card do 2º ciclo conectado diretamente a `/repasses?ciclo=2`;
- lista nominal das unidades contempladas com INEP, situação, ordem, custeio, capital e total;
- busca, filtro, ordenação e exportação do segundo ciclo;
- navegação unidade → Recursos PDDE → retorno ao mesmo recorte;
- Portal do Diretor com informação da ordem sem alterar `recebido`, saldo ou execução;
- `Pagamento identificado` passou a exigir `data_pagamento`, impedindo que ordem sem crédito seja somada como pagamento confirmado.

A PR #173 foi validada por CI completo antes do merge e implantada em Production.

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
- 52 evidências externas P2 atualmente expostas operacionalmente;
- P2 com ordem emitida: **R$ 132.630,00**;
- composição P2: **R$ 81.034,00 custeio + R$ 51.596,00 capital**;
- data das 52 ordens: **14/09/2026**;
- créditos bancários confirmados para esse recorte: **0**.

Decisões obrigatórias:

- ausência de informação não é zero;
- uma escola pode ter múltiplas contas no mesmo programa;
- hierarquia: `programa → ação → parcela → conta`;
- dimensão coletada só vira informação operacional depois de contrato de maturidade/publicação;
- saldo atual, movimentos posteriores, crédito localizado completo e conciliação documento × débito continuam fora da superfície operacional enquanto não houver contrato próprio e cobertura adequada.

## 5. Sincronização financeira automática

Workflow: `.github/workflows/sync-financial-snapshot.yml`.

O YAML contém `workflow_dispatch` e `schedule`, mas a publicação agendada **não está habilitada operacionalmente**.

Para o job agendado publicar, é obrigatório:

- `vars.PDDE_FINANCIAL_SYNC_ENABLED == 'true'`;
- `PDDE_SUPABASE_URL` configurado no environment `production`;
- `PDDE_SUPABASE_SERVICE_ROLE_KEY` configurado no environment `production`.

Execução manual também valida o destino e exige os secrets. Não contornar ausência de credencial com chave pública/anon.

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
- o rótulo `Pagamento identificado` exige `data_pagamento`;
- ordem sem crédito não altera automaticamente `recebido`, saldo, execução ou Demonstrativo;
- busca global só anuncia funcionalidades reais;
- contexto da carteira deve sobreviver ao drill-down;
- design deve ser institucional, claro e original, sem excesso decorativo.

## 8. Pendências operacionais reais

### 8.1. Ativação da sincronização financeira

Não é bloqueio do funcionamento atual. É uma decisão operacional futura.

Antes de ativar:

1. configurar os dois secrets no environment `production`;
2. manter `PDDE_FINANCIAL_SYNC_ENABLED=false`/ausente;
3. executar manualmente o workflow;
4. validar dry-run, publicação, idempotência e estado do banco;
5. somente depois habilitar a variável de agendamento.

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
3. atualizar o estado da P2 quando surgir evidência de crédito bancário confirmado, sem converter ordem emitida em pagamento por inferência;
4. decidir quando vale ativar a sincronização financeira automática e, nesse momento, configurar secrets + gate com validação manual prévia;
5. continuar hardening de Auth/RLS/auditoria antes de ampliar fluxos de escrita do Portal do Diretor;
6. publicar novas dimensões financeiras apenas quando tiverem contrato próprio e cobertura madura;
7. tratar novos documentos oficiais, importador e frente fiscal em PRs isolados, com fonte estruturada e revisão humana.
