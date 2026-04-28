# PDDE Online 2026 — Plano Global v4 Consolidado e Atualizado

Versão operacional consolidada — 28/04/2026

Este documento é a referência operacional vigente para execução do Plano Global v4 do PDDE Online 2026. Ele consolida o plano original, o adendo de compatibilização, o escopo atual da migração para Supabase próprio e o estado real do repositório.

## 1. Diretriz executiva

O Plano Global v4 permanece como eixo diretor do projeto. A migração para o Supabase próprio é o parêntese técnico atualmente aberto dentro desse plano. Esta versão consolidada não cria um Plano v5: ela integra o que já foi feito, reposiciona o que foi antecipado e protege a sequência futura contra retrabalho e fragmentação entre ferramentas.

## 2. Fonte de verdade

- O GitHub e a documentação versionada são a fonte oficial do projeto.
- Relatórios externos e memórias de sessão são insumos auxiliares, não fonte definitiva.
- As ferramentas executoras devem ler os documentos de continuidade antes de agir.
- Toda alteração deve terminar com handoff contendo concluído, pendente, bloqueado, riscos e próximo passo.

## 3. Documentos operacionais vigentes

| Documento | Função |
|---|---|
| AGENTS.md | Política de execução por ferramentas, bloqueios, validações e handoff. |
| docs/PROJECT_STATE.md | Fotografia curta do estado operacional atual. |
| docs/DECISIONS_LOG.md | Registro de decisões arquiteturais e estratégicas. |
| docs/UI_CHANGELOG.md | Histórico de decisões visuais e infraestrutura transversal. |
| docs/PLAN_V4_REALITY_ALIGNMENT.md | Adendo que compatibiliza o Plano v4 com o estado real. |
| docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md | Escopo do parêntese atual de migração Supabase. |
| docs/PLAN_GLOBAL_V4_CONSOLIDATED.md | Versão consolidada e operacional vigente do Plano v4. |
| docs/FRONTEND_DATA_CONTRACT.md | A criar: contrato real de dados do frontend. |

## 4. Estado real incorporado ao plano

| Elemento | Estado | Impacto |
|---|---|---|
| TypeScript Strict | Antecipado e validado | Requisito permanente; não reabrir como pendência futura. |
| O6 — seletor global de exercício | Implementado | Tratar como entregue. |
| RBAC/RLS | Esqueleto existente em migrations | Revisar e integrar; não recriar cegamente. |
| Infraestrutura global | QueryClientProvider, ProtectedRoute, TopLoadingBar, CommandPalette, ErrorBoundary, AnimatePresence e Analytics | Registrar como base existente. |
| Importador BASE.xlsx | Implementação inicial real | Revisar antes de uso oficial. |
| FRONTEND_DATA_CONTRACT.md | Ausente | Gate imediato da migração Supabase. |
| Resíduos Lovable | Pendentes | Sanear antes de Preview/produção institucional. |
| ZIP/lote | Ainda aparece na UI | Rebaixar antes da validação do MVP. |

## 5. Ferramentas e responsabilidades

| Ferramenta | Uso recomendado | Limite |
|---|---|---|
| ChatGPT | Planejamento, prompts, análise de coerência, documentos institucionais | Não executa alterações assíncronas; deve produzir prompts e revisar handoffs. |
| Codex | Auditoria operacional, scripts, parser, migrations mecânicas, testes | Deve trabalhar em blocos pequenos e parar se exigir decisão de contrato/segurança. |
| Claude Code | Revisão crítica, leitura longa, logs, troubleshooting e segunda opinião | Uso complementar por cota; não deve divergir do GitHub. |
| Antigravity | UI, prototipação, exploração visual e apoio pontual | Não lidera schema, RLS, auth ou produção. |
| Lovable | Referência visual e eventual polimento controlado | Não deve comandar backend oficial nem sobrescrever decisões de arquitetura. |
| Humano | Aprovação de segurança, dados reais, regras financeiras e documentos oficiais | Obrigatório para produção, RLS, roles e prestação de contas. |

## 6. Mapa consolidado dos marcos

| Marco | Nome | Estado | Leitura atualizada |
|---|---|---|---|
| 0 | Governança e memória operacional | Parcialmente executado | Reforçar documentação, handoff multi-ferramenta e leitura obrigatória dos novos arquivos consolidados. |
| 1 | Fechamento da fase visual atual | Executado em essência | Manter como referência visual; permitir apenas ajustes de coerência do MVP. |
| 2 | Saneamento e fechamento pré-estrutural | Pendente parcial | Sanear resíduos Lovable e rebaixar ZIP/lote antes do Preview institucional. |
| 3 | Congelamento da referência visual | Aguardando saneamento mínimo | Formalizar baseline visual após correções de escopo e metadados. |
| 4 | Validação técnica local | Recorrente | Aplicar build, typecheck, lint e testes conforme o impacto de cada bloco. |
| 5 | Desenho técnico estrutural | Aguardando parêntese Supabase | Retomar monorepo/backend somente depois de Supabase próprio validado. |
| 6 | Supabase Clean Start e segurança mínima | Em execução | Executar como Clean Start revisado, com migrations existentes revisadas e contrato real de dados. |
| 7 | Criação do monorepo | Futuro | Não antecipar durante a migração Supabase. |
| 8 | Backend Fastify mínimo | Futuro | Não iniciar até encerramento do parêntese Supabase. |
| 9 | Migração frontend → backend | Futuro | Depende de monorepo, API e contratos definidos. |
| 10 | Importação real da BASE.xlsx | Antecipado parcialmente | Validar parser existente, regra de upsert, campos textuais e logs antes de carga oficial. |
| 11 | Motor documental v1 | Futuro | Somente após banco, roles, importação e segurança estabilizados. |
| 12 | Geração individual real | Futuro | Prioridade após motor documental; deve preceder lote/ZIP real. |
| 13 | Portal do Diretor funcional | Futuro | Depende de guards, vínculo diretor-escola e RLS por escopo. |
| 14 | Hardening pré-produção | Parcial/futuro | Aplicar gate de segurança antes de produção Supabase e hardening amplo em etapa própria. |
| 15 | Lote/ZIP/Cloud Run opcional | Futuro | Manter como evolução posterior a geração individual e benchmark. |

## 7. Sequência cronológica consolidada

- 1. Criar `docs/CURRENT_GITHUB_AUDIT_2026-04-28.md`.
- 2. Criar `docs/FRONTEND_DATA_CONTRACT.md`.
- 3. Revisar migrations Supabase existentes e registrar ajustes necessários.
- 4. Decidir chaves e campos críticos: designação, código, nome, programa, alunos, parcelas, saldos e import_logs.
- 5. Revisar importador da BASE.xlsx antes de carga oficial.
- 6. Sanear resíduos Lovable e rebaixar ZIP/lote antes do Preview institucional.
- 7. Criar Supabase próprio limpo e aplicar migrations revisadas.
- 8. Gerar types e conectar Vercel Preview.
- 9. Importar e validar as 163 unidades.
- 10. Validar Dashboard, Escolas, EscolaEditar, Base e autenticação.
- 11. Realizar revisão humana de segurança.
- 12. Promover produção e registrar fechamento do parêntese Supabase.
- 13. Retornar ao Plano Global v4: monorepo, backend, motor documental, Portal Diretor e geração real.

## 8. Gates obrigatórios

| Gate | Tema | Momento | Critério |
|---|---|---|---|
| Gate 0 | Memória operacional | Antes de qualquer tarefa | Ferramenta leu AGENTS, PROJECT_STATE, DECISIONS_LOG, UI_CHANGELOG, PLAN_V4_REALITY_ALIGNMENT, SUPABASE_MIGRATION_CURRENT_SCOPE e PLAN_GLOBAL_V4_CONSOLIDATED. |
| Gate 1 | Estado real | Antes de novas mudanças estruturais | CURRENT_GITHUB_AUDIT criado e coerente com o GitHub. |
| Gate 2 | Contrato de dados | Antes de migrations novas | FRONTEND_DATA_CONTRACT criado e revisado. |
| Gate 3 | SQL/Supabase | Antes de aplicar no Supabase próprio | Migrations revisadas; sem DROP perigoso; RLS e roles compreendidos. |
| Gate 4 | Dados | Antes de importar 163 unidades | Parser validado; campos textuais preservados; regra de upsert aprovada. |
| Gate 5 | MVP visual | Antes de Preview institucional | Lovable saneado; ZIP/lote rebaixado; build/typecheck/lint conforme aplicável. |
| Gate 6 | Segurança | Antes de produção | Roles, RLS, cadastro, dados reais e policies revisados por humano. |
| Gate 7 | Fechamento | Após produção | Parêntese Supabase documentado e retorno ao Plano v4 registrado. |

## 9. Detalhamento dos marcos

### Marco 0 — Governança e memória operacional

**Estado:** Parcialmente executado.

**Leitura consolidada:** Reforçar documentação, handoff multi-ferramenta e leitura obrigatória dos novos arquivos consolidados.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 0.1 | Consolidar AGENTS.md e leitura obrigatória | Concluído parcial / atualizar quando necessário | Garantir que toda ferramenta leia AGENTS, PROJECT_STATE, DECISIONS_LOG, UI_CHANGELOG, PLAN_V4_REALITY_ALIGNMENT, SUPABASE_MIGRATION_CURRENT_SCOPE e PLAN_GLOBAL_V4_CONSOLIDATED. |
| 0.2 | Manter PROJECT_STATE.md como fotografia operacional | Atualizado | Registrar estado global, pendências imediatas e limites do parêntese Supabase. |
| 0.3 | Manter DECISIONS_LOG.md | Parcial | Registrar decisões arquiteturais: TypeScript Strict, separação GAD x Diretor, Clean Start revisado, geração individual antes de lote. |
| 0.4 | Estabelecer política quota-resiliente | Consolidado | Tarefas pequenas, retomáveis, com critérios de aceite, comandos e handoff final. |

### Marco 1 — Fechamento da fase visual atual

**Estado:** Executado em essência.

**Leitura consolidada:** Manter como referência visual; permitir apenas ajustes de coerência do MVP.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 1.1 | Confirmar baseline visual | Concluído em essência | Protótipo visual de alta fidelidade validado como referência, sem tratar como sistema final. |
| 1.2 | Preservar componentes principais | Concluído parcial | Dashboard, Escolas, EscolaEditar, Base, DocumentsPanel, Manual, Configurações e Portal Diretor wireframe permanecem como referência. |
| 1.3 | Evitar novas experiências visuais disruptivas | Regra vigente | Mudanças visuais agora devem ser pontuais, justificadas e compatíveis com o MVP. |

### Marco 2 — Saneamento e fechamento pré-estrutural

**Estado:** Pendente parcial.

**Leitura consolidada:** Sanear resíduos Lovable e rebaixar ZIP/lote antes do Preview institucional.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 2.1 | Sanear index.html | Pendente | Corrigir lang, TODOs, metadados Lovable, twitter:site e imagem social externa. |
| 2.2 | Remover lovable-tagger | Pendente | Remover devDependency e import/uso de componentTagger no Vite. |
| 2.3 | Rebaixar ZIP/lote | Pendente | Transformar lote/ZIP em indicação futura discreta, sem CTA principal. |
| 2.4 | Revisar MiniSparkline/reduced motion | Verificar | Manter acessibilidade e evitar regressões visuais. |
| 2.5 | Atualizar registros do saneamento | Pendente após execução | Registrar no UI_CHANGELOG/PROJECT_STATE o que foi saneado. |

### Marco 3 — Congelamento da referência visual

**Estado:** Aguardando saneamento mínimo.

**Leitura consolidada:** Formalizar baseline visual após correções de escopo e metadados.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 3.1 | Registrar baseline congelado | Aguardando saneamento | Criar registro de referência visual após saneamento de metadados e ZIP/lote. |
| 3.2 | Definir regra de mudança visual | A executar | Novas mudanças visuais devem ter justificativa, impacto e validação visual. |

### Marco 4 — Validação técnica local

**Estado:** Recorrente.

**Leitura consolidada:** Aplicar build, typecheck, lint e testes conforme o impacto de cada bloco.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 4.1 | Build | Recorrente | Executar npm run build em alterações de aplicação. |
| 4.2 | TypeScript | Gate permanente | Executar npx tsc --noEmit; não aceitar regressão do Strict Mode. |
| 4.3 | Lint | Recorrente | Executar npm run lint em alterações TS/React. |
| 4.4 | Testes | Recorrente | Executar npm test em parser, motor documental e regras críticas. |
| 4.5 | Smoke visual | Quando houver UI | Validar rotas e fluxo com browser/Playwright quando aplicável. |

### Marco 5 — Desenho técnico estrutural

**Estado:** Aguardando parêntese Supabase.

**Leitura consolidada:** Retomar monorepo/backend somente depois de Supabase próprio validado.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 5.1 | Arquitetura final do monorepo | Postergado | Não iniciar antes de fechar Supabase próprio. |
| 5.2 | Contratos web/api/shared | Postergado | Retomar após banco e importação estabilizados. |
| 5.3 | Plano de migração estrutural | Postergado | Transformar frontend atual em base para apps/web quando chegar o marco. |

### Marco 6 — Supabase Clean Start e segurança mínima

**Estado:** Em execução.

**Leitura consolidada:** Executar como Clean Start revisado, com migrations existentes revisadas e contrato real de dados.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 6.1 | Reconciliar estado real | Próximo gate | Criar CURRENT_GITHUB_AUDIT_2026-04-28.md. |
| 6.2 | Criar contrato real de dados | Próximo gate | Criar FRONTEND_DATA_CONTRACT.md antes de novas migrations. |
| 6.3 | Revisar migrations existentes | Pendente | Avaliar app_role, user_roles, has_role, unidades_escolares, import_logs e policies. |
| 6.4 | Definir schema alvo | Pendente | Decidir designacao/codigo/nome, programa, alunos, saldos, parcelas e chaves. |
| 6.5 | Criar Supabase próprio limpo | Pendente | Aplicar migrations revisadas, não improvisadas. |
| 6.6 | Gerar types e conectar Preview | Pendente | Preview primeiro; produção apenas após validação. |
| 6.7 | Revisão humana de segurança | Obrigatória | Antes de dados reais e produção. |

### Marco 7 — Criação do monorepo

**Estado:** Futuro.

**Leitura consolidada:** Não antecipar durante a migração Supabase.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 7.1 | Scaffolding do monorepo | Futuro | Executar somente após fechamento do parêntese Supabase. |
| 7.2 | Scripts de workspace | Futuro | Definir build/test/lint por package. |
| 7.3 | Revisar boundaries | Futuro | Separar apps/web, apps/api e packages/shared quando aprovado. |

### Marco 8 — Backend Fastify mínimo

**Estado:** Futuro.

**Leitura consolidada:** Não iniciar até encerramento do parêntese Supabase.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 8.1 | Desenhar apps/api | Futuro | Fastify mínimo com healthcheck, env, CORS, logging e validação. |
| 8.2 | Criar Fastify mínimo | Futuro | Sem absorver motor documental antes do contrato. |
| 8.3 | Schemas compartilhados | Futuro | Zod ou equivalente para contratos entre web e api. |

### Marco 9 — Migração frontend → backend

**Estado:** Futuro.

**Leitura consolidada:** Depende de monorepo, API e contratos definidos.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 9.1 | Mapear chamadas Supabase | Já iniciado por necessidade | Formalizar no FRONTEND_DATA_CONTRACT. |
| 9.2 | Criar client HTTP | Futuro | Somente quando backend existir. |
| 9.3 | Migrar telas principais | Futuro | Migrar progressivamente, sem quebrar frontend funcional. |

### Marco 10 — Importação real da BASE.xlsx

**Estado:** Antecipado parcialmente.

**Leitura consolidada:** Validar parser existente, regra de upsert, campos textuais e logs antes de carga oficial.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 10.1 | Contrato de importação | Imediato no parêntese Supabase | Mapear BASE.xlsx, abas, colunas, tipos, chaves e validações. |
| 10.2 | Parser XLSX | Implementação inicial existente | Revisar robustez, campos textuais, zeros à esquerda e erros. |
| 10.3 | Normalização e validação | Parcial | Preservar valor bruto, normalizado e erro/warning. |
| 10.4 | Hash/registro de importação | Pendente ou parcial | Avaliar inclusão de SHA-256 e metadados de auditoria. |
| 10.5 | Integração com API/UI | Parcial no frontend | Por ora validar no frontend; API fica para etapa futura. |

### Marco 11 — Motor documental v1

**Estado:** Futuro.

**Leitura consolidada:** Somente após banco, roles, importação e segurança estabilizados.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 11.1 | Contrato do motor documental | Futuro | Definir entradas, saídas, templates e versionamento. |
| 11.2 | Demonstrativo Básico | Futuro | Primeiro documento real, com testes. |
| 11.3 | Testes do motor | Futuro | Fixtures representativos, valores e proteção de fórmulas. |
| 11.4 | Expansão modular | Futuro | Preparar demais documentos sem acoplamento excessivo. |

### Marco 12 — Geração individual real

**Estado:** Futuro.

**Leitura consolidada:** Prioridade após motor documental; deve preceder lote/ZIP real.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 12.1 | Rota de geração individual | Futuro | Prioridade antes de pacote/lote. |
| 12.2 | Integrar DocumentsPanel | Futuro | Transformar simulação em geração real. |
| 12.3 | Registrar geração leve | Futuro | Salvar status, última geração e metadados mínimos. |

### Marco 13 — Portal do Diretor funcional

**Estado:** Futuro.

**Leitura consolidada:** Depende de guards, vínculo diretor-escola e RLS por escopo.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 13.1 | Escopo inicial do diretor | Futuro | Diretor vê apenas sua escola, documentos e orientações. |
| 13.2 | Guards por perfil | Futuro ligado a segurança | Depende de roles reais no frontend e RLS. |
| 13.3 | Vínculo diretor-escola | Futuro | Modelagem cuidadosa para evitar acesso cruzado. |

### Marco 14 — Hardening pré-produção

**Estado:** Parcial/futuro.

**Leitura consolidada:** Aplicar gate de segurança antes de produção Supabase e hardening amplo em etapa própria.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 14.1 | Revisão cross-layer | Parcial/futuro | Antes de produção Supabase e novamente antes do motor documental. |
| 14.2 | Regressões | Recorrente | Build, typecheck, lint, test e smoke test. |
| 14.3 | Revisão humana de regras sensíveis | Obrigatória | Auth, roles, RLS, dados reais, regras financeiras e documentos oficiais. |

### Marco 15 — Lote/ZIP/Cloud Run opcional

**Estado:** Futuro.

**Leitura consolidada:** Manter como evolução posterior a geração individual e benchmark.

| Tarefa | Descrição | Estado | Ação consolidada |
|---|---|---|---|
| 15.1 | Decidir se lote vale a complexidade | Futuro | Somente após geração individual real e uso validado. |
| 15.2 | Arquitetura de lote | Futuro | Avaliar worker/Cloud Run apenas se necessário. |
| 15.3 | Implementar worker e benchmark | Futuro | Não antecipar no parêntese Supabase. |

## 10. Escopo do parêntese Supabase

Entram no parêntese Supabase apenas as tarefas que condicionam diretamente o Supabase próprio, o contrato real de dados, migrations, RLS, roles, importação da BASE, Preview e produção da migração.

- Criar CURRENT_GITHUB_AUDIT_2026-04-28.md e FRONTEND_DATA_CONTRACT.md.
- Revisar migrations existentes antes de aplicar no Supabase próprio.
- Validar importador da BASE.xlsx e regra de upsert.
- Sanear resíduos Lovable e rebaixar ZIP/lote antes de Preview/produção.
- Criar Supabase próprio, aplicar migrations revisadas, gerar types e conectar Preview.
- Importar e validar 163 unidades escolares.
- Realizar revisão humana de segurança antes de produção.

## 11. Fora do parêntese Supabase

- Monorepo.
- Backend Fastify.
- Migração completa frontend → API.
- Motor documental completo.
- Geração individual real dos documentos.
- Portal do Diretor funcional completo.
- ZIP/lote real, Cloud Run e worker.

## 12. Prompt-padrão para ferramentas

```txt
Esta tarefa pertence ao Plano Global v4 do PDDE Online 2026.
Classificação obrigatória: [Parêntese Supabase | Plano Global v4 | Adendo de compatibilização].
Antes de agir, leia AGENTS.md, PROJECT_STATE.md, DECISIONS_LOG.md, UI_CHANGELOG.md, PLAN_V4_REALITY_ALIGNMENT.md, SUPABASE_MIGRATION_CURRENT_SCOPE.md e PLAN_GLOBAL_V4_CONSOLIDATED.md.
Não presuma contexto por memória de sessão. GitHub e documentação versionada são a fonte oficial.
Não alterar schema, auth, RLS, regras financeiras, regras documentais, produção ou Vercel fora do escopo expresso.
Ao final, entregar handoff com arquivos lidos, arquivos alterados, comandos, validações, concluído, pendente, bloqueado, riscos e próximo passo.
```

## 13. Critério para alterar este plano

O plano só deve ser alterado quando houver fato técnico confirmado no repositório, falha de validação, risco de segurança, incompatibilidade entre frontend e schema, dependência real de dados ou necessidade de governança. Limitação momentânea de cota ou preferência de ferramenta não justifica, por si só, alteração estrutural do plano.

## 14. Próxima ação imediata

Executar tarefa Codex-first, docs-only, para criar CURRENT_GITHUB_AUDIT_2026-04-28.md e FRONTEND_DATA_CONTRACT.md, sem alterar código, migrations, Supabase, Vercel ou produção.

## 15. Critério de conclusão do parêntese Supabase

- Supabase próprio criado e migrations revisadas aplicadas.
- 163 unidades importadas e validadas.
- Frontend conectado ao Supabase próprio em Preview e, depois, produção.
- Papéis, RLS, cadastro e dados reais revisados por humano.
- MVP coerente com geração individual; ZIP/lote não tratado como ação principal.
- Fechamento documentado e retorno ao curso natural do Plano Global v4.
