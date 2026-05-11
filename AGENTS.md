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

**main HEAD:** `88238cea1a4294c7b3c84c9501c2c3e434c73f79`

### Entregue e em producao

- Demonstrativo Basico Individual (PR #43, merge em `4d97a9c`)
- Dashboard com views reais do Supabase (PR #44)
- Infraestrutura de continuidade agentic (PR #42)
- Reconciliacao pos-PR43 (PR #45, merge em `88238ce`)

### Proxima fila

1. AGENTS.md realinhado (este PR)
2. README real
3. CI minimo
4. Lockfile unico
5. Remocao lovable-tagger
6. Cobertura de testes DocumentsPanel

### Frentes funcionais maiores (pos-higiene)

- Edicao cadastral minima (Fase 2B)
- Importador institucional via interface
- Auth/roles/guards/RLS final
- Portal do Diretor
- Motor documental v1 (geracao em lote)

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
2. `.continuity/current-state.json`
3. `docs/HANDOFF.md`
4. `docs/DECISIONS.md`
5. `docs/ROADMAP_ADAPTIVE.md`
6. `docs/OPPORTUNITIES_BACKLOG.md`

## Regras depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`
2. `.continuity/session-log.jsonl`
3. `docs/HANDOFF.md`

Se houver nova decisao ou mudanca de prioridade, atualizar tambem `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
