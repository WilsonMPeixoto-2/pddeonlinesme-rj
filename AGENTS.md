# AGENTS.md — PDDE Online 2026

Atualizado em: 2026-05-11

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

## Estado atual do projeto

**main HEAD verificado:** `c769d473170cca63ce6f4108b873ce12277e3072`

> Este valor e snapshot operacional. Antes de qualquer decisao, verificar novamente o HEAD real da `main` no GitHub.

### Entregue e em producao

- Demonstrativo Basico Individual (PR #43, merge em `4d97a9c`)
- Dashboard com views reais do Supabase (PR #44)
- Infraestrutura de continuidade agentic (PR #42)
- Reconciliacao pos-PR43 (PR #45)
- AGENTS.md realinhado (PR #46)
- README real (PR #47)
- CI minimo (PR #48)
- Lockfile unico npm/package-lock (PR #49)
- Remocao lovable-tagger (PR #50)
- Cobertura de testes DocumentsPanel (PR #51)
- Reconciliacao documental com a main pos-higiene (PR #52)
- Atualizacoes seguras de patch em dependencias (PR #53)

### Proxima fila

A fila curta de higiene inicial foi concluida. A proxima frente funcional recomendada e a **Fase 2B - edicao cadastral minima**, desde que iniciada por contrato tecnico de campos, permissoes, validacoes e auditoria.

### Frentes funcionais maiores planejadas

Os itens abaixo ja pertencem ao Plano Global v4.1 e nao devem ser tratados como novas falhas urgentes enquanto o sistema permanecer em prototipo controlado usado pelo desenvolvedor:

- Edicao cadastral minima (Fase 2B)
- Login/cadastro publico, auth, roles, guards e RLS final (Marco 6B)
- Configuracoes/Admin real (Marco 6B / fluxos administrativos)
- Importador institucional via interface (Marco 10B)
- Portal do Diretor (Marco 13)
- Motor documental v1 / geracao em lote / ZIP (Marcos 11, 12 e 15)
- Hardening, smoke/e2e, acessibilidade, logs e bundle (Marco 14 / melhoria continua)

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

## Regras antes de qualquer tarefa

Ler:

1. `AGENTS.md`
2. `.continuity/current-state.json` como snapshot auxiliar
3. `docs/HANDOFF.md` como snapshot auxiliar
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`
7. GitHub `main`, PRs recentes e codigo real antes de decidir

## Regras depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`
2. `.continuity/session-log.jsonl`
3. `docs/HANDOFF.md`

Se houver nova decisao ou mudanca de prioridade, atualizar tambem `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
