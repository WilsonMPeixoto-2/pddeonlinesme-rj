# PDDE Online 2026 — Compatibilização do Plano Global v4 com o estado real

Data: 28/04/2026

## 1. Finalidade

Este documento registra a leitura atualizada do Plano Global v4 à luz do estado real do repositório `pddeonlinesme-rj`.

O Plano Global v4 permanece como eixo diretor do projeto. A presente compatibilização não cria um Plano v5, não substitui o planejamento original e não abre novo parêntese paralelo. Ela apenas ajusta a interpretação dos marcos do Plano v4 para evitar retrabalho, reconhecer entregas antecipadas e reposicionar pendências que surgiram ou ficaram para trás.

## 2. Decisão de governança

- O Plano Global v4 continua válido como plano macro.
- O plano de migração para Supabase próprio permanece como o parêntese técnico atualmente aberto.
- As descobertas recentes do GitHub devem ser incorporadas ao parêntese Supabase quando forem pré-condição da migração.
- As tarefas que pertencem a monorepo, backend Fastify, motor documental, Portal do Diretor funcional, hardening amplo e lote/ZIP real permanecem no curso natural do Plano Global v4.
- Não será aberto um segundo parêntese autônomo para auditoria ou saneamento; esses pontos entram como gates internos do parêntese Supabase ou como atualizações do Plano v4.

## 3. Estado real que altera a leitura do Plano v4

| Elemento | Estado identificado | Tratamento no Plano v4 atualizado |
|---|---|---|
| TypeScript Strict | Já foi antecipado e validado. | Tratar como requisito permanente, não como pendência futura. |
| O6 — seletor global de exercício | Já implementado no AppLayout e consumido por telas operacionais. | Marcar como entregue; não reabrir como pendência. |
| RBAC/RLS | Já existe esqueleto em migrations: app_role, user_roles, has_role e policies. | Revisar/integrar, não recriar do zero sem critério. |
| Infraestrutura global | QueryClientProvider, ProtectedRoute, TopLoadingBar, CommandPalette, ErrorBoundary, AnimatePresence e Vercel Analytics já existem. | Registrar como infraestrutura transversal existente. |
| Importação BASE.xlsx | Já existe implementação inicial com parse, validação, upsert e import_logs. | Revisar e robustecer no escopo Supabase; não tratar como inexistente. |
| FRONTEND_DATA_CONTRACT.md | Ainda ausente. | Inserir como gate imediato da migração Supabase. |
| Saneamento Lovable | Ainda pendente em index.html, vite.config.ts e package.json. | Executar antes de Preview/produção institucional. |
| ZIP/lote | Ainda aparece como CTA em telas e CommandPalette. | Rebaixar antes da validação do MVP; lote real permanece no Marco 15. |

## 4. Classificação das pendências

### 4.1. Entram no parêntese Supabase

Entram no escopo atual porque bloqueiam ou condicionam a migração segura:

- criação de `docs/FRONTEND_DATA_CONTRACT.md`;
- reconciliação do estado real do GitHub;
- revisão das migrations existentes;
- decisão sobre `programa`, `designacao`, código/nome da escola, `alunos`, saldos, parcelas e `import_logs`;
- validação do importador da `BASE.xlsx` antes de carga oficial;
- criação do Supabase próprio limpo com migrations revisadas;
- geração de types e conexão por Vercel Preview;
- importação e validação das 163 unidades;
- revisão humana de segurança antes de produção.

### 4.2. Entram como gate pré-Preview ou pré-produção

São relevantes para maturidade técnica/institucional, mas não exigem novo plano paralelo:

- saneamento de `index.html`;
- remoção de `lovable-tagger` e `componentTagger`;
- remoção de metadados Lovable e imagens sociais externas;
- rebaixamento visual/funcional de ZIP/lote;
- validação de build, typecheck, lint e testes.

### 4.3. Permanecem no curso natural do Plano Global v4

Não devem ser antecipados agora:

- monorepo;
- backend Fastify;
- migração progressiva do frontend para API;
- motor documental v1;
- geração individual real;
- Portal do Diretor funcional;
- vínculo diretor-escola;
- hardening amplo;
- ZIP/lote real;
- Cloud Run/worker/benchmark.

## 5. Atualização dos marcos do Plano v4

| Marco | Nome | Leitura atualizada |
|---|---|---|
| 0 | Governança e memória operacional | Parcialmente executado. Reforçar leitura dos documentos de compatibilização e handoff multi-ferramenta. |
| 1 | Fechamento da fase visual atual | Executado em essência. Manter apenas ajustes de coerência do MVP. |
| 2 | Saneamento e fechamento pré-estrutural | Pendente parcial: resíduos Lovable e ZIP/lote ainda precisam ser saneados/rebaixados. |
| 3 | Congelamento da referência visual | Formalizar após saneamento mínimo. |
| 4 | Validação técnica local | Recorrente: acompanhar cada bloco relevante com build/typecheck/lint/test. |
| 5 | Desenho técnico estrutural | Retomar após fechamento do parêntese Supabase. |
| 6 | Supabase Clean Start e segurança mínima | Em execução. Deve ser lido como Clean Start revisado. |
| 7 | Criação do monorepo | Postergado até Supabase próprio validado. |
| 8 | Backend Fastify mínimo | Postergado. |
| 9 | Migração frontend → backend | Postergado. |
| 10 | Importação real da BASE.xlsx | Antecipada parcialmente; revisar e formalizar. |
| 11 | Motor documental v1 | Postergado. |
| 12 | Geração individual real | Postergado. |
| 13 | Portal do Diretor funcional | Postergado até roles/guards/vínculo escola. |
| 14 | Hardening pré-produção | Aplicar parcialmente antes da produção Supabase e integralmente em etapa futura. |
| 15 | Lote/ZIP/Cloud Run opcional | Futuro; manter após geração individual e benchmark. |

## 6. Regra para ferramentas executoras

Todo prompt técnico deve classificar a tarefa antes da execução:

1. **Parêntese Supabase** — quando impactar contrato de dados, Supabase próprio, importação BASE, RLS, roles ou Preview da migração.
2. **Plano Global v4** — quando pertencer a monorepo, backend, motor documental, Portal Diretor, hardening ou lote futuro.
3. **Adendo de compatibilização** — quando apenas atualizar documentação, decisões, estado ou instruções para ferramentas.

A ferramenta executora deve registrar essa classificação no handoff final.

## 7. Critério para alterar o Plano v4

O Plano Global v4 só deve ser alterado quando houver fato técnico confirmado no repositório ou dependência real que torne a sequência anterior inadequada.

Não basta uma preferência de ferramenta, sugestão isolada ou limitação momentânea de cota. Alterações de plano devem decorrer de:

- código real já implementado;
- migrations existentes;
- falha de build/typecheck/lint/test;
- risco de segurança;
- dependência de dados reais;
- incompatibilidade entre frontend e schema;
- requisito de governança/documentação.

## 8. Conclusão

A leitura atualizada é: Plano Global v4 como eixo, migração Supabase como parêntese único atual, e este documento como adendo de compatibilização para evitar retrabalho, fragmentação e colcha de retalhos entre ferramentas.
