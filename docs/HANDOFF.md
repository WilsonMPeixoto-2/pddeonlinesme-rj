# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 28/09/2026 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`

> Este handoff registra o estado verificado do produto. Código, schema/migrations, banco, CI e deployment real prevalecem em caso de divergência.

## 1. Estado corrente verificado

### Aplicação

- `main`: `a2e2de69aa3e85ae4920e8af70529db39fc0a4ad`;
- PR #194: Visão anual e dashboard analítico do PDDE Básico — mergeada;
- PR #195: timeline interativa e filtros cruzados — mergeada;
- CI final da PR #195: run #506 (`36379480409`) integralmente verde;
- evidência visual do CI: artifact `visual-evidence` (`10952163028`);
- domínio público: `https://pddeonlinesme-rj.vercel.app`;
- último deployment Production confirmado no momento desta reconciliação: `dpl_7n5kHr7xU9upydK4MXX6ByUTsFAn`, commit `7c83d53fb2d6c3bea8741346c9aebb614e3a3147`, estado `READY`;
- o merge mais recente `a2e2de69...` ainda não havia aparecido na listagem de deployments Vercel durante esta reconciliação; publicação do código mais novo permanece como verificação operacional imediata, não como suposição.

### Supabase

Projeto oficial: `raluxyojqosfzrfozmpz`.

Verificado em 28/09/2026:

- 163 unidades escolares;
- 169 contas bancárias na projeção corrente;
- 459 registros de repasse;
- 6 dimensões financeiras `MATURE/PUBLISHED`;
- 757 tentativas registradas pelo sincronizador nativo;
- tentativa mais recente: `ALREADY_CURRENT`;
- 163 escolas observadas;
- 459 repasses observados;
- 459 linhas verificadas semanticamente;
- 2º ciclo de repasses: 163 escolas / R$ 765.215,00;
- erro da tentativa mais recente: nenhum;
- sincronização nativa v8 ativa no Supabase, com cron recorrente.

## 2. Modelo financeiro vigente

### Total anual do PDDE Básico

A visão principal do exercício é:

`1º ciclo de repasses + 2º ciclo de repasses = total anual do PDDE Básico`

Estado verificado de 2026:

- 1º ciclo de repasses: **163 unidades / R$ 765.215,00**;
- 2º ciclo de repasses: **163 unidades / R$ 765.215,00**;
- total anual do PDDE Básico: **R$ 1.530.430,00**;
- cobertura dos dois ciclos: **163/163**.

O cálculo usa somente pagamentos oficiais com `valor_pago` e `data_pagamento`. Ordem sem data de pagamento, valor programado, saldo bancário, rendimento ou inferência não entram nesse total.

### Linha temporal oficial

Marcos do dataset corrente:

- 30/04/2026 — 1º ciclo — 57 unidades — R$ 261.455,00;
- 22/05/2026 — 1º ciclo — 33 unidades — R$ 85.155,00;
- 08/07/2026 — 1º ciclo — 1 unidade — R$ 2.015,00;
- 05/08/2026 — 1º ciclo — 72 unidades — R$ 416.590,00;
- 15/09/2026 — 2º ciclo — 52 unidades — R$ 132.630,00;
- 17/09/2026 — 2º ciclo — 111 unidades — R$ 632.585,00.

## 3. Semântica obrigatória

### Repasse oficial

Pagamento informado pelo FNDE/SIGEF com valor e data conhecidos é um fato oficial suficiente para compor o valor de repasses.

### Camada bancária

Saldo, extrato, crédito individual e conciliação são dimensões independentes.

- ausência de extrato atualizado não invalida pagamento oficial;
- ausência de crédito localizado não é divergência;
- crédito localizado pode ser exibido como evidência positiva;
- divergência bancária só pode ser criada quando a fonte cobre temporalmente a data relevante e a correspondência esperada não é localizada;
- saldo contemporâneo não prova individualmente um crédito.

### Ausência de informação

- `NULL` continua sendo ausência;
- zero só representa zero informado pela fonte;
- nenhuma dimensão parcial pode ser apresentada como universo completo.

## 4. Superfícies financeiras entregues

### Painel

O hero prioriza o total anual do PDDE Básico quando os dois ciclos estão completos. KPIs relevantes levam ao detalhe correspondente.

### Repasses

`/repasses` abre a **Visão anual**.

Navegação:

- Visão anual;
- 1º ciclo de repasses;
- 2º ciclo de repasses.

A Visão anual oferece:

- total anual e composição entre ciclos;
- cobertura;
- média, mediana, menor e maior total por escola;
- distribuição por faixas;
- linha do tempo clicável;
- filtros cruzados por data, faixa e busca;
- estado de análise ativa;
- tabela por unidade;
- exportação do recorte;
- drill-down preservando os filtros na URL.

### Unidade escolar

`/escolas/:id/recursos` apresenta:

- total anual do PDDE Básico;
- 1º e 2º ciclos de repasses;
- datas oficiais;
- relação proporcional;
- timeline compacta;
- programa, ação, parcela e contas vinculadas.

## 5. Validação da PR #195

CI final: run #506, ID `36379480409`.

Passaram:

- política Vercel;
- contrato de upload Vercel;
- TypeScript;
- lint;
- testes unitários;
- cobertura;
- auditoria do Demonstrativo;
- build;
- bundle budget;
- Playwright E2E;
- acessibilidade;
- evidência visual;
- Knip;
- auditoria de vulnerabilidades de produção;
- Supabase local;
- rebuild integral das migrations;
- testes de contrato SQL.

### Revisão visual

As capturas automatizadas usam dados mockados, nunca dados reais de escolas.

Foram revisadas:

- Visão anual com timeline/filtro ativo;
- ficha de Recursos PDDE da escola.

A revisão final ajustou a proporção entre distribuição e tabela e simplificou o cabeçalho para `Total anual`.

## 6. Sincronização financeira corrente

A arquitetura antiga dependente do workflow GitHub + service role não representa mais a operação principal.

A arquitetura corrente usa sincronização financeira nativa v8 no Supabase:

- Edge Function de sincronização;
- cron nativo recorrente;
- tentativas registradas em `financial_sync_attempts`;
- read-after-write;
- status de maturidade/publicação;
- frontend consultando maturidade e saúde por RPCs de leitura.

Em estado saudável, a infraestrutura fica visualmente silenciosa. A interface sinaliza atraso ou falha somente quando existe incidente real.

## 7. Governança documental

Precedência:

1. código, banco, CI e deployment verificados;
2. `docs/DECISIONS.md`;
3. `.continuity/current-state.json` e este handoff;
4. documentação técnica do domínio;
5. planos, specs e históricos.

Documentos atualizados nesta fase:

- `docs/DECISIONS.md`;
- `docs/technical/repasses-operacionais-2026-v1.md`;
- `docs/ROADMAP_ADAPTIVE.md`;
- `docs/HANDOFF.md`;
- `.continuity/current-state.json`.

## 8. Próximas prioridades

1. confirmar a sincronização do merge funcional mais recente com Vercel Production e registrar deployment/SHA;
2. manter observabilidade da sincronização nativa v8;
3. aprofundar análises visuais apenas quando houver ganho operacional, sem multiplicar cards/gráficos decorativos;
4. estudar saldo bancário como dimensão própria, com competência explícita, antes de qualquer exposição;
5. só criar conciliação negativa quando houver cobertura bancária temporal suficiente;
6. manter smoke autenticado proporcional ao risco;
7. continuar hardening de Auth/RLS/auditoria antes de ampliar fluxos de escrita.

## 9. Escopo protegido

- não trocar o Supabase oficial;
- não misturar este projeto com RADAR PDDE ou outros sistemas;
- não expor `service_role` no browser;
- não converter ausência em zero;
- não rebaixar pagamento oficial por falta de extrato;
- não publicar dimensão imatura como conclusiva;
- não alterar Auth/RLS/secrets/templates oficiais sem revisão apropriada.
