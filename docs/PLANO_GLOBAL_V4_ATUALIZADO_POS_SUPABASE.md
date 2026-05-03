# PDDE Online 2026 — Plano Global v4.1 atualizado após Supabase Foundation v1

Data: 2026-05-02

## 1. Finalidade

Este documento consolida uma versão operacional atualizada do **Plano Global v4** após a conclusão da Supabase Foundation v1 e após as alterações recentes incorporadas à `main`.

Ele existe para evitar que ferramentas futuras precisem reconstruir o estado do projeto consultando vários documentos isolados. Os documentos de encerramento e reconciliação permanecem válidos como justificativa histórica, mas este arquivo passa a ser a referência prática de planejamento.

## 2. Relação com a versão original do Plano Global v4

Este documento não cria um plano paralelo. Ele atualiza o Plano Global v4 mantendo sua estrutura de 15 marcos:

| Marco | Nome original | Status atualizado |
|---:|---|---|
| 0 | Governança e memória operacional | Em continuidade permanente |
| 1 | Fechamento da fase visual atual | Concluído, com Light Mode incorporado |
| 2 | Saneamento e fechamento pré-estrutural | Parcial; requer auditoria curta |
| 3 | Congelamento da referência visual | Reabrir apenas para registrar dual theme |
| 4 | Validação técnica local | Gate permanente |
| 5 | Desenho técnico estrutural com Cursor | Pendente/revisar antes de monorepo/backend |
| 6 | Supabase Clean Start e segurança mínima | Parcial: Foundation concluída; segurança final pendente |
| 7 | Criação do monorepo | Pendente/reavaliar |
| 8 | Backend Fastify mínimo | Pendente/reavaliar |
| 9 | Migração frontend → backend | Parcial: telas principais com views Supabase |
| 10 | Importação real da BASE.xlsx | Parcial: carga inicial feita; importador UI pendente |
| 11 | Motor documental v1 | Pendente |
| 12 | Geração individual real | Pendente |
| 13 | Portal do Diretor funcional | Pendente |
| 14 | Hardening pré-produção | Parcial/contínuo; etapa final ainda pendente |
| 15 | Lote/ZIP/Cloud Run opcional | Pendente e opcional |

## 3. Decisão central pós-migração

A **Supabase Foundation v1 está concluída como migração fundacional**.

Isso significa:

- o Supabase próprio está operacional;
- os dados reais da planilha BASE foram importados;
- as telas `/escolas` e `/escolas/:id` consomem views reais do Supabase próprio;
- a dependência operacional do backend Lovable foi superada nas telas principais.

A partir deste ponto, qualquer tarefa que envolva Supabase deve ser classificada pelo seu objetivo funcional no Plano Global v4. Não reabrir a Foundation v1 salvo se houver falha comprovada nos critérios de encerramento.

## 4. Entregas recentes incorporadas ao plano

| PR | Entrega | Alocação no Plano Global v4 |
|---:|---|---|
| #27 | Script administrativo de importação remota da BASE | Marco 10A concluído |
| #29 | `/escolas` com `vw_unidades_localizador` | Marco 9A concluído |
| #30 | `/escolas/:id` com `vw_unidade_detalhe`, read-only | Marco 9A concluído / base da Fase 2B |
| #31 | Scaffold Zod e dependências essenciais | Preparação Fase 2B |
| #33 | Light Mode institucional premium + ThemeToggle | Marcos 1, 3 e 14; design system |
| #32 | Premium UI Kit + `MaskedInput` | Preparação Fase 2B, Marco 10 e documentos |

## 5. Plano atualizado marco a marco

### Marco 0 — Governança e memória operacional

**Objetivo atualizado:** manter o GitHub como fonte única de verdade, preservar handoffs explícitos e impedir que múltiplas ferramentas trabalhem a partir de estados locais divergentes.

**Já feito:**

- `AGENTS.md` define responsabilidades entre Cursor, Codex, Lovable, Antigravity e revisão humana.
- Ruleset `Protect main` foi criado para proteger a `main`.
- PRs recentes foram pequenos e auditáveis.
- Documentos de fechamento/reconciliação foram criados no PR documental atual.

**Ainda fazer:**

1. Fechar PRs antigos superados (#22 e #7) com comentário de superseded.
2. Auditar o PR #3 de Analytics e decidir se deve ser fechado ou preservado.
3. Garantir que toda nova ferramenta leia primeiro:
   - `AGENTS.md`;
   - `docs/PROJECT_STATE.md`;
   - `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`.
4. Manter handoff obrigatório ao final de cada PR.

**Critério de aceite:** nenhuma nova frente funcional deve começar antes de o executor declarar branch, objetivo, arquivos permitidos, arquivos proibidos, comandos de validação e ponto de parada.

---

### Marco 1 — Fechamento da fase visual atual

**Objetivo atualizado:** considerar encerrada a fase visual de alta fidelidade, com Dark Mode e Light Mode institucionais como referências oficiais.

**Já feito:**

- Dark Mode institucional preservado.
- Light Mode “Papel Institucional Premium” criado.
- ThemeToggle implementado no header.
- Preferência de tema persistida.
- `index.html` recebeu script anti-flash.
- `/escolas` e `/escolas/:id` foram validadas visualmente com dados reais.

**Ainda fazer:**

1. Smoke visual pós-merge em produção para Dashboard, `/escolas`, `/escolas/:id`, Login, Base, Configurações e Manual.
2. Registrar eventuais pequenos ajustes de contraste/acessibilidade em issues ou PRs pontuais.
3. Evitar novo redesign amplo sem decisão explícita.

**Critério de aceite:** tema claro e escuro devem permanecer legíveis, consistentes e funcionais nas rotas principais.

---

### Marco 2 — Saneamento e fechamento pré-estrutural

**Objetivo atualizado:** fazer auditoria curta de resíduos antes de retomar funcionalidades grandes.

**Já feito:**

- Parte relevante dos mocks foi removida das telas principais de escolas.
- O localizador `/escolas` não exibe dados fictícios de programa/status financeiro.
- `/escolas/:id` foi convertida em ficha read-only com dados reais.

**Ainda fazer:**

1. Auditar resíduos Lovable e arquivos obsoletos.
2. Verificar se ainda há mocks funcionais em Dashboard, Base, PortalDiretor ou documentos.
3. Verificar dependências não utilizadas.
4. Verificar warning persistente em `useExercicio.tsx`.
5. Mapear chunk grande do build e decidir se code splitting fica para Marco 14.
6. Registrar no `UI_CHANGELOG.md` qualquer alteração visual relevante ainda não documentada.

**Critério de aceite:** relatório curto indicando o que é resíduo real, o que é placeholder consciente e o que deve ser tratado em marco futuro.

---

### Marco 3 — Congelamento da referência visual

**Objetivo atualizado:** congelar a referência visual pós-Light Mode.

**Já feito:**

- Visual principal aprovado em dark mode.
- Light Mode premium incorporado.
- `/escolas/:id` recebeu polimento institucional read-only.

**Ainda fazer:**

1. Registrar screenshots ou checklist textual das telas referência.
2. Definir que mudanças visuais futuras devem ser:
   - acessibilidade;
   - responsividade;
   - correção de contraste;
   - refinamento pontual;
   - necessidade funcional de nova fase.
3. Marcar `StyleGuide.tsx`, se existir, como página interna e não bloqueadora.

**Critério de aceite:** ferramentas futuras não devem reabrir redesign global sem autorização.

---

### Marco 4 — Validação técnica local

**Objetivo atualizado:** manter validação técnica como gate permanente.

**Já feito:**

- PRs recentes passaram por `tsc`, `lint`, `test` e `build` quando alteraram código.
- PR documental atual não altera código de aplicação.

**Ainda fazer:**

1. Para PRs de código, executar sempre:

```bash
npx tsc --noEmit
npm run lint
npm test
npm run build
```

2. Para PRs documentais, confirmar:

```bash
git diff --stat
```

3. Para alterações visuais, executar smoke em browser/preview.

**Critério de aceite:** nenhuma alteração de código deve ser considerada pronta sem validação mínima.

---

### Marco 5 — Desenho técnico estrutural com Cursor

**Objetivo atualizado:** revisar a arquitetura antes de monorepo, Fastify, backend e motor documental.

**Já feito:**

- Views Supabase passaram a funcionar como contratos estáveis para `/escolas` e `/escolas/:id`.
- Parte da leitura real foi resolvida sem backend próprio.

**Ainda fazer:**

1. Reavaliar se o monorepo ainda é necessário no mesmo formato original.
2. Definir quais operações continuarão Supabase direto e quais exigirão backend/API.
3. Definir contrato para importador institucional.
4. Definir contrato do motor documental.
5. Definir boundaries entre frontend, API, schemas, documentos e storage.
6. Decidir se Fastify entra antes ou depois da Fase 2B.

**Critério de aceite:** antes de mexer em monorepo/backend, deve existir desenho de contratos e impacto sistêmico.

---

### Marco 6 — Supabase Clean Start e segurança mínima

**Objetivo atualizado:** separar a Foundation concluída da segurança final pendente.

#### 6A — Supabase Foundation

**Status:** concluído.

**Já feito:**

- Supabase próprio operacional.
- Dados reais importados.
- Views fundacionais disponíveis.
- `/escolas` consome `vw_unidades_localizador`.
- `/escolas/:id` consome `vw_unidade_detalhe`.
- Vercel aponta para Supabase próprio.

#### 6B — Segurança, papéis e policies finais

**Status:** pendente.

**Ainda fazer:**

1. Revisar `app_role`, `user_roles`, `has_role()` e policies existentes.
2. Definir matriz de perfis: admin, operador, diretor, leitura etc.
3. Implementar guards por perfil no frontend.
4. Revisar cadastro público e confirmação de e-mail.
5. Validar RLS/policies com revisão humana.
6. Definir policies para documentos/storage antes de upload real.
7. Rotacionar e documentar boas práticas de uso da `service_role`, se ainda não feito.

**Critério de aceite:** nenhuma edição, upload ou portal externo deve avançar sem revisão de segurança.

---

### Marco 7 — Criação do monorepo

**Status atualizado:** pendente e condicionado ao Marco 5.

**Já feito:** nada específico de monorepo.

**Ainda fazer:**

1. Reavaliar se o monorepo ainda é necessário antes do backend/motor documental.
2. Se aprovado, definir estrutura `apps/` e `packages/`.
3. Só então criar workspaces e mover código.

**Critério de aceite:** não iniciar monorepo por inércia; exigir justificativa atualizada.

---

### Marco 8 — Backend Fastify mínimo

**Status atualizado:** pendente/reavaliar.

**Já feito:** leitura principal por Supabase direto nas telas de escola.

**Ainda fazer:**

1. Definir quais operações exigem backend:
   - importação institucional;
   - geração documental;
   - auditoria;
   - operações com service_role;
   - storage privado;
   - integrações pesadas.
2. Decidir se a Fase 2B pode ocorrer antes do backend, com mutations Supabase seguras.
3. Definir autenticação entre frontend e API, se backend entrar.

**Critério de aceite:** Fastify só deve ser criado com contrato claro.

---

### Marco 9 — Migração frontend → backend / contratos reais de dados

**Status atualizado:** parcialmente concluído por rota Supabase views.

#### 9A — Telas principais por views Supabase

**Status:** parcialmente concluído.

**Concluído:**

- `/escolas` → `vw_unidades_localizador`.
- `/escolas/:id` → `vw_unidade_detalhe`.

#### 9B — Dashboard real

**Status:** pendente e próximo candidato natural.

**Ainda fazer:**

1. Auditar `Dashboard.tsx`.
2. Substituir consulta direta/legada por `vw_dashboard_basico`.
3. Remover ou classificar séries mockadas de sparkline.
4. Criar hook `useDashboardBasico`, se adequado.
5. Validar totais com Supabase read-only.
6. Smoke visual em light/dark.

#### 9C — Decisão Supabase direto vs API/backend

**Status:** pendente.

**Ainda fazer:**

- classificar cada fluxo por risco;
- manter leitura simples por Supabase quando seguro;
- mover operações sensíveis para backend/API quando necessário.

**Critério de aceite:** Dashboard deve deixar claro quais dados são reais, calculados ou placeholder.

---

### Marco 10 — Importação real da BASE.xlsx

**Status atualizado:** parcialmente concluído.

#### 10A — Carga administrativa inicial

**Status:** concluído.

**Já feito:**

- script administrativo importou a BASE no Supabase próprio;
- 163 unidades validadas;
- logs de importação consultados;
- views retornam contagens coerentes.

#### 10B — Importador institucional via interface

**Status:** pendente.

**Ainda fazer:**

1. Desenhar fluxo de upload de planilha.
2. Definir se parsing ocorrerá em backend/Edge Function ou ambiente administrativo controlado.
3. Gerar prévia antes de gravar.
4. Validar CNPJ, INEP, designação, agência, conta e valores.
5. Calcular hash do arquivo original.
6. Registrar warnings/errors em `import_logs`.
7. Bloquear uso de `service_role` no browser.
8. Avaliar substituição/isolamento do `xlsx` por risco técnico.

**Critério de aceite:** nenhum upload institucional deve gravar dados sem pré-validação e confirmação.

---

### Marco 11 — Motor documental v1

**Status atualizado:** pendente.

**Já feito:**

- Premium UI Kit instalou `@react-pdf/renderer` como preparação futura.
- `DocumentsPanel` permanece na UI como ponto de acoplamento futuro.

**Ainda fazer:**

1. Definir templates oficiais.
2. Definir campos mínimos por documento.
3. Definir contrato do motor documental.
4. Definir se motor fica no frontend, backend, pacote isolado ou Cloud Run.
5. Implementar geração testável em núcleo isolado.
6. Garantir revisão humana das regras documentais.

**Critério de aceite:** motor documental só deve avançar com templates e regras oficiais definidos.

---

### Marco 12 — Geração individual real

**Status atualizado:** pendente.

**Já feito:** botões e painel existem como interface futura.

**Ainda fazer:**

1. Conectar `DocumentsPanel` ao motor documental.
2. Gerar documento individual por escola.
3. Validar dados usados no documento.
4. Oferecer download seguro.
5. Registrar logs, se aplicável.
6. Validar layout dos documentos oficiais.

**Critério de aceite:** geração individual deve usar dados reais e templates validados.

---

### Marco 13 — Portal do Diretor funcional

**Status atualizado:** pendente.

**Ainda fazer:**

1. Definir perfil diretor.
2. Definir vínculo diretor-escola.
3. Implementar guards por perfil.
4. Definir o que o diretor pode ver, editar, anexar ou gerar.
5. Validar LGPD/segurança antes de expor informações.
6. Criar experiência de uso específica para diretor.

**Critério de aceite:** portal só avança após Marco 6B mínimo.

---

### Marco 14 — Hardening pré-produção

**Status atualizado:** parcialmente antecipado; etapa final pendente.

**Já feito:**

- proteção de `main`;
- PRs com checks;
- TypeScript Strict preservado;
- Light Mode com build validado;
- Supabase read-only checks nas fases de dados;
- Vercel envs revisadas anteriormente.

**Ainda fazer:**

1. Auditoria final de segurança.
2. Auditoria de acessibilidade.
3. Testes de fluxos críticos.
4. Testes de auth/roles.
5. Revisão de performance e bundle.
6. Revisão de logs e erros.
7. Revisão de produção após cada marco funcional.

**Critério de aceite:** sistema pronto para uso institucional ampliado, não apenas demonstração.

---

### Marco 15 — Lote/ZIP/Cloud Run opcional

**Status atualizado:** pendente e opcional.

**Ainda fazer:**

1. Só iniciar depois da geração individual real estar validada.
2. Avaliar necessidade de lote/ZIP.
3. Avaliar custo-benefício de Cloud Run.
4. Definir fila/processamento assíncrono, se necessário.

**Critério de aceite:** não iniciar antes de haver motor documental e geração individual estáveis.

## 6. Ordem cronológica recomendada a partir deste ponto

1. Mesclar este PR documental.
2. Fechar PRs antigos #22 e #7 como superados.
3. Auditar PR #3 Analytics.
4. Executar smoke pós-merge do Light Mode em produção.
5. Escolher entre:
   - Dashboard real (`vw_dashboard_basico`), ou
   - Fase 2B edição cadastral/bancária.
6. Antes de importador/documentos/backend, retomar Marco 5 para desenho de contratos.

## 7. Próxima frente recomendada

A recomendação operacional é:

1. **Governança curta:** fechar PRs superados.
2. **Marco 9B:** Dashboard real com `vw_dashboard_basico`.
3. **Fase 2B:** edição cadastral/bancária, usando `MaskedInput`, Zod e React Hook Form.

Motivo: o Dashboard real conclui a leitura real das telas principais antes de abrir mutations/edição.

## 8. Regra para ferramentas futuras

Antes de executar qualquer tarefa, a ferramenta deve ler:

1. `AGENTS.md`;
2. `docs/PROJECT_STATE.md`;
3. `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md`;
4. documento específico da frente, quando existir.

A ferramenta deve declarar:

- marco do Plano Global v4 ao qual a tarefa pertence;
- escopo fechado;
- arquivos permitidos;
- arquivos proibidos;
- validações;
- handoff final.

## 9. Veredito final

O Plano Global v4 continua vigente, mas passa a ser interpretado conforme esta atualização pós-Supabase Foundation v1.

A Foundation v1 não deve mais ser tratada como frente aberta. As próximas demandas são frentes funcionais do Plano Global v4.
