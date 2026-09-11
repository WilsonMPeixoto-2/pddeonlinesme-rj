# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 11/09/2026 (America/Sao_Paulo)  
**Repositório:** `WilsonMPeixoto-2/pddeonlinesme-rj`  
**Entrada obrigatória da documentação:** `docs/README.md`

> Este handoff é uma fotografia operacional. Código, banco, CI e deployment real prevalecem em caso de divergência.

## 1. Estado verificado no fechamento do ciclo funcional

Baseline funcional antes desta reconciliação documental:

- `main`: `b60fb04b360eefb7dc0d92cc39064ee8a019724b`;
- Production Vercel: `dpl_FdQY3St4xHQpSgept47jobMcvE4Y`;
- estado do deployment: `READY`;
- domínio público: `https://pddeonlinesme-rj.vercel.app`;
- smoke público: HTTP 200;
- erros de runtime observados após o deploy: nenhum no intervalo verificado;
- Supabase oficial: `raluxyojqosfzrfozmpz`.

A PR documental pode produzir um novo SHA de `main` sem alterar o baseline funcional acima.

## 2. Ciclo #129 → #132 concluído em Production

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

No início desta reconciliação documental havia **0 PRs de produto abertos**.

## 3. Estado financeiro atual

Validado no Supabase oficial:

- 163 escolas;
- 335 contas bancárias;
- 537 registros de repasse/parcela;
- 5 dimensões V1 `MATURE/PUBLISHED`;
- cobertura das dimensões: 163/163.

Decisões obrigatórias:

- ausência de informação não é zero;
- uma escola pode ter múltiplas contas no mesmo programa;
- hierarquia: `programa → ação → parcela → conta`;
- dimensão coletada só vira informação operacional depois de contrato de maturidade/publicação;
- saldo atual, movimentos posteriores, crédito localizado completo e conciliação documento × débito continuam fora da superfície operacional enquanto não houver contrato próprio e cobertura adequada.

## 4. Sincronização financeira automática

Workflow: `.github/workflows/sync-financial-snapshot.yml`.

O YAML contém `workflow_dispatch` e `schedule`, mas a publicação agendada **não está habilitada operacionalmente**.

Para o job agendado publicar, é obrigatório:

- `vars.PDDE_FINANCIAL_SYNC_ENABLED == 'true'`;
- `PDDE_SUPABASE_URL` configurado no environment `production`;
- `PDDE_SUPABASE_SERVICE_ROLE_KEY` configurado no environment `production`.

Execução manual também valida o destino e exige os secrets. Não contornar ausência de credencial com chave pública/anon.

## 5. CI atual

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

## 6. Decisões de produto vigentes

Fonte canônica: `docs/DECISIONS.md`.

Resumo do ciclo atual:

- **Dados → análise → escola → ação → evidência**;
- publicar somente dimensões maduras;
- não completar lacunas por inferência;
- 1ª parcela paga do PDDE Básico é o recorte financeiro principal enquanto for o universo integralmente validado;
- preservar múltiplas contas;
- manter proveniência técnica fora da superfície operacional comum;
- agregados relevantes devem levar a detalhe/filtro/ação;
- busca global só anuncia funcionalidades reais;
- contexto da carteira deve sobreviver ao drill-down;
- design deve ser institucional, claro e original, sem excesso decorativo.

## 7. Pendências operacionais reais

### 7.1. Ativação da sincronização financeira

Não é bloqueio do funcionamento atual. É uma decisão operacional futura.

Antes de ativar:

1. configurar os dois secrets no environment `production`;
2. manter `PDDE_FINANCIAL_SYNC_ENABLED=false`/ausente;
3. executar manualmente o workflow;
4. validar dry-run, publicação, idempotência e estado do banco;
5. somente depois habilitar a variável de agendamento.

### 7.2. Smoke autenticado periódico

CI/Preview não substituem smoke autenticado de fluxos críticos. Priorizar, quando houver mudança nessas áreas:

- login/recuperação;
- carteira → ficha → retorno;
- Repasses → detalhe da unidade;
- edição cadastral;
- geração documental;
- permissões/RLS.

### 7.3. Auth/RLS/auditoria

Continuar hardening antes de ampliar o Portal do Diretor ou expor novos fluxos de escrita para perfis escolares.

## 8. O que não deve ser reaberto por engano

Não tratar como “próxima frente” itens já concluídos:

- Painel Executivo-Operacional básico;
- geração em lote dos 163 Demonstrativos;
- integração financeira V1;
- página operacional de Repasses V1;
- busca global operacional;
- preservação de contexto da carteira;
- stack React/Vite/Vitest atualizada;
- Supabase Foundation como frente genérica.

Novas evoluções podem ampliar essas áreas, mas devem partir do estado atual, não dos planos de maio.

## 9. Roteiro obrigatório para continuidade

1. `AGENTS.md`;
2. `docs/README.md`;
3. `.continuity/current-state.json`;
4. `docs/HANDOFF.md`;
5. `docs/DECISIONS.md`;
6. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
7. documentação técnica da tarefa;
8. `main`, PRs, CI, Supabase e Production conforme o escopo.

`docs/PLANO_GLOBAL_V4_2.md`, `docs/OPPORTUNITIES_BACKLOG.md` e documentos em `docs/superpowers/` são referências estratégicas/históricas, não fotografia atual.

## 10. Próximos movimentos recomendados

1. concluir e mergear esta reconciliação documental;
2. manter smoke autenticado proporcional ao risco das próximas mudanças;
3. decidir quando vale ativar a sincronização financeira automática e, nesse momento, configurar secrets + gate com validação manual prévia;
4. continuar hardening de Auth/RLS/auditoria antes de ampliar o Portal do Diretor;
5. publicar novas dimensões financeiras apenas quando tiverem contrato próprio e cobertura madura;
6. tratar novos documentos oficiais, importador e frente fiscal em PRs isolados, com fonte estruturada e revisão humana.
