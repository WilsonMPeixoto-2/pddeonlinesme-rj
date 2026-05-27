# AGENTS.md — PDDE Online 2026

Atualizado em: 2026-05-17 (Plano Global v4.2 + Radar de Inteligência Institucional)

## Fonte de verdade tecnica

A fonte de verdade primaria do projeto e a verificacao direta do codigo-fonte, branch, commit, diff, configuracao versionada e testes reais no GitHub.

Relatorios de ferramentas, handoffs, `current-state.json`, roadmap, backlog, comentarios de PR e memorias sao **snapshots auxiliares**. Podem orientar investigacao, mas nao sustentam conclusao sem conferencia na fonte primaria.

### Classificacao obrigatoria

Ao reportar informacoes, todo agente deve classificar cada afirmacao como:

- **FATO VERIFICADO NO CODIGO** — confirmado por leitura direta de arquivo, commit, diff ou teste no repositorio.
- **HIPOTESE** — inferencia logica ainda nao confirmada na fonte.
- **RELATO DE OUTRA FERRAMENTA** — informacao proveniente de documento, handoff, log ou memoria de sessao anterior.
- **PENDENCIA A CONFIRMAR** — item que requer verificacao antes de ser tratado como fato.

### Regra pratica

Nenhuma ferramenta e fonte de verdade. Nenhum relatorio substitui a leitura do codigo. Se houver conflito entre um documento e o codigo real, o codigo prevalece.

## Ferramentas e modelo de trabalho

Este projeto pode ser mantido por diferentes ferramentas (Claude Code, Codex, Copilot, Cursor, Antigravity, entre outras). Nenhuma ferramenta tem exclusividade sobre camadas do sistema.

### Principio de escopo

A ferramenta que lidera uma tarefa e determinada pelo **escopo da tarefa**, nao por uma hierarquia fixa:

- Se a tarefa tem entrada clara, saida clara e teste claro, qualquer ferramenta pode executa-la.
- Se a tarefa exige decisao arquitetural ou integracao entre multiplas camadas, deve ser tratada com revisao humana.
- Se a tarefa envolve seguranca, auth, RLS, roles, dados sensiveis ou regras financeiras/documentais oficiais, a revisao humana e **obrigatoria**.

### Divisao por tipo de trabalho

| Tipo de trabalho | Quem pode liderar | Revisao humana |
|---|---|---|
| Implementacao funcional isolada | Qualquer ferramenta | Recomendada |
| Integracao entre camadas | Qualquer ferramenta | Obrigatoria |
| Arquitetura, contratos, schemas | Qualquer ferramenta | Obrigatoria |
| Auth, RLS, roles, policies | Qualquer ferramenta | **Obrigatoria** |
| Segredos, .env, credenciais | Qualquer ferramenta | **Obrigatoria** |
| Templates oficiais, regras financeiras | Qualquer ferramenta | **Obrigatoria** |
| Documentacao e governanca | Qualquer ferramenta | Recomendada |
| Testes, linting, CI | Qualquer ferramenta | Nao obrigatoria |
| Limpeza, refactor mecanico | Qualquer ferramenta | Nao obrigatoria |

### Regra de bloqueio

Se uma ferramenta descobrir que a implementacao exige mudar contrato, arquitetura, boundary ou decisao de seguranca, ela **nao deve improvisar**. Deve parar, registrar o bloqueio e devolver a decisao para revisao humana.

## Camada de dados e financeiro

Para tarefas envolvendo dados financeiros, planilhas, importacao/exportacao, CNPJ, INEP, demonstrativos ou prestacao de contas:

- Primeiro inventariar a fonte de dados e o contrato esperado antes de alterar codigo.
- Preservar rastreabilidade entre valor bruto importado, valor normalizado e erro/warning gerado.
- Nao inventar regra financeira, documental, de acesso ou de identidade de escola. Se a regra nao estiver documentada, devolver para revisao humana.
- Tratar producao Supabase como somente leitura salvo autorizacao explicita.

## Validacoes minimas por tipo de alteracao

| Tipo de alteracao | Validacoes |
|---|---|
| Codigo TypeScript | `npx tsc --noEmit` |
| UI ou fluxo React | `npx tsc --noEmit`, `npm run lint`, `npm run build`, verificacao visual |
| Parser/importador/motor documental | `npx tsc --noEmit`, `npm test`, fixtures representativas |
| Supabase/RLS/auth | migration/types local + revisao humana obrigatoria |
| Mudanca substancial | `npx tsc --noEmit && npm run lint && npm test && npm run build` |
| Documentacao pura | validar JSON se `.json`, `git diff --name-only` para confirmar escopo |

## Estado atual do projeto (v4.2)

**main HEAD verificado:** `d6b2d5147d5c3fc8fa6c5f521dc1d75912e5f077` (PR #71)

> Este valor e snapshot operacional. Antes de qualquer decisao, verificar novamente o HEAD real da `main` no GitHub via `gh api repos/WilsonMPeixoto-2/pddeonlinesme-rj/branches/main`.

### Entregue e em producao

- Demonstrativo Basico Individual (PR #43)
- Dashboard com views reais do Supabase (PR #44)
- Infraestrutura de continuidade agentic (PR #42)
- AGENTS.md realinhado (PR #46), README real (PR #47), CI minimo (PR #48), lockfile unico (PR #49), remocao lovable-tagger (PR #50), cobertura DocumentsPanel (PR #51), reconciliacao documental (PRs #45, #52), patches seguros (PR #53)
- Hardening do motor documental + contrato Fase 2B (PR #57)
- POC fiscal Python isolada + governanca + validators (PRs #58, #59, #61, #62)
- **Fase 2B — Edicao cadastral minima** (PR #63) com optimistic update (PR #66)
- **Modernizacao da stack**: React 19 (PR #66), Vite 7 (PR #67), Vitest 4 + jsdom 29 (PR #68)
- **Remocao xlsx + migracao para ExcelJS** com 0 vulnerabilities (PR #69)
- Polimento visual do dialogo cadastral + skeleton (PR #70)
- **RPC transacional para cadastro** com SECURITY INVOKER (PR #71) — migration aplicada em prod

### Proxima fila (v4.2)

A Fase 2B foi implementada e endurecida; falta smoke UI operacional. A proxima frente funcional recomendada e o **Painel Executivo-Operacional GAD v1** (Marco 9B), que incorpora a **Geracao em Lote dos 163 Demonstrativos** (Marco 15 reclassificado como **Acao Executiva de Alto Valor**).

### Frentes funcionais maiores planejadas (v4.2)

Os itens abaixo pertencem ao Plano Global v4.2 e nao devem ser tratados como falhas urgentes enquanto estiverem em sua etapa planejada:

- **Painel Executivo-Operacional GAD v1** (Marco 9B — proxima frente)
- **Geracao em lote dos 163 Demonstrativos** (Marco 15 — Acao Executiva de Alto Valor)
- Camada de historico documental (`document_generation_runs`)
- Auth/RLS/roles/audit_logs/storage final (Marco 6B — sobe em prioridade pois sistema ja escreve dados)
- Importador institucional com dry-run/diff/hash (Marco 10B)
- **Aquisicao Fiscal Multicanal** (substituiu "frente fiscal v1 OCR-first"; ordem: XML > chave > QR > URL oficial > codigo de barras > PDF textual > OCR > digitacao)
- Portal do Diretor mobile-first (Marco 13 — depende Marco 6B)
- Hardening, WCAG, observabilidade (Marco 14 — continuo)

### Criterio para reordenar o plano

Alterar a ordem do Plano Global somente com justificativa tecnica explicita e ganho real para o projeto, como reducao de retrabalho, dependencia bloqueadora, risco real de seguranca ou melhoria estrutural comprovada.

## Politica de documentacao

Documentacao deve apoiar o desenvolvimento, nao captura-lo em ciclos de reconciliacao.

Abrir PR exclusivamente documental apenas quando a documentacao:

- induzir o proximo agente a executar tarefa errada;
- listar como pendente algo ja concluido de forma que altere decisao operacional;
- apontar caminho de arquivo incorreto que possa causar erro;
- registrar prioridade incompativel com o Plano Global;
- criar risco real de replanejamento equivocado.

Drift pequeno de SHA, sem consequencia operacional, deve preferencialmente ser corrigido junto ao proximo PR funcional.

## Formato de prompt operacional

Todo prompt operacional deve declarar:

- ferramenta lider
- objetivo da tarefa
- arquivos que deve ler
- arquivos que pode alterar
- arquivos que nao deve alterar
- criterio de aceite
- validacoes minimas

## Radar Transversal de Inteligencia Institucional (v4.2)

A partir de v4.2, **toda tarefa** deve aplicar o Radar de Inteligencia Institucional documentado em `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`. Plano Global = o que. Radar = como.

**Diretriz-mae v4.2:** toda funcionalidade relevante deve entregar valor operacional E valor institucional visivel. Nao basta funcionar: precisa reduzir trabalho, orientar acao, gerar evidencia, evitar erro, respeitar perfis, adotar solucao moderna e poder ser apresentada como modernizacao administrativa.

**8 perguntas obrigatorias antes de propor implementacao:**

1. Existe fonte estruturada antes de digitar ou fazer OCR?
2. Existe padrao consolidado em sistemas publicos, ERPs, dashboards administrativos ou design systems?
3. A tarefa pode virar alerta, status, historico, grafico, relatorio ou evidencia?
4. A solucao reduz clique, memoria, retrabalho ou planilha paralela?
5. A interface mostra o proximo passo ou apenas exibe dados?
6. A entrega e segura para dados reais, perfis, RLS, arquivos e auditoria?
7. O ganho pode ser demonstrado visualmente para chefia e Alta Administracao?
8. A abordagem e adequada para 2026 ou apenas uma solucao provisoria?

Antes de aprovar PR, executar checklist de revisao em `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md` §9.

## Regras antes de qualquer tarefa

Ler:

1. `AGENTS.md` (este arquivo)
2. **`docs/PLANO_GLOBAL_V4_2.md`** (plano vigente)
3. **`docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`** (diretriz transversal obrigatoria)
4. `.continuity/current-state.json` como snapshot auxiliar
5. `docs/HANDOFF.md` como snapshot auxiliar
6. `docs/DECISIONS.md`
7. `docs/ROADMAP_ADAPTIVE.md`
8. `docs/OPPORTUNITIES_BACKLOG.md`
9. GitHub `main`, PRs recentes e codigo real antes de decidir

Versao anterior do plano (v4.1) preservada em `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` como referencia historica — nao foi revogada, apenas atualizada.

## Regras depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`
2. `.continuity/session-log.jsonl`
3. `docs/HANDOFF.md`

Se houver nova decisao ou mudanca de prioridade, atualizar tambem `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
