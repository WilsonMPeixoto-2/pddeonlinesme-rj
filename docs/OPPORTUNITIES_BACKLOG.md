# Backlog Adaptativo de Oportunidades — arquivo histórico

> **Status documental:** HISTÓRICO / NÃO AUTORIZA EXECUÇÃO.
>
> Este arquivo preserva o backlog de oportunidades consolidado em **17/05/2026**. Ele não representa a fila atual do produto.
>
> Para estado e prioridades correntes, leia nesta ordem:
> 1. `docs/README.md`;
> 2. `.continuity/current-state.json`;
> 3. `docs/HANDOFF.md`;
> 4. `docs/ROADMAP_ADAPTIVE.md`;
> 5. `docs/DECISIONS.md`.

## Finalidade histórica

Este backlog registrava oportunidades, riscos e frentes candidatas no ciclo pós-PRs #72–#79. Muitos itens abaixo foram concluídos, reformulados ou perderam prioridade desde então.

A permanência deste arquivo serve para explicar a evolução do projeto, não para orientar diretamente um novo PR.

## Entregas registradas no snapshot de maio/2026

| Item | Tipo | Referência histórica |
|---|---|---|
| Refinamentos visuais sóbrios | UX/estética | PR #79 |
| Correção de microcopy enganosa em `/escolas` | UX | PR #78 |
| Histórico de gerações no Painel | produto/dados | PR #76 |
| UI admin de papéis | produto/segurança | PR #75 |
| Reconciliação types + docs | governança | PR #74 |
| Painel Executivo-Operacional GAD v1 + geração em lote | produto/dados | PR #73 |
| Plano Global v4.2 + Radar de Inteligência Institucional | governança | PR #72 |
| Demonstrativo Básico Individual via `MEMORIA` | documentos | PR #43 |
| Hardening do motor documental + contrato Fase 2B | qualidade | PR #57 |
| Fase 2B — edição cadastral mínima | dados/UI | PR #63 |
| React 19 + optimistic update | stack/UX | PR #66 |
| Vite 7 no ciclo de maio | stack | PR #67 |
| Vitest 4 + jsdom 29 no ciclo de maio | stack/testes | PR #68 |
| xlsx removido + ExcelJS consolidado | stack/segurança | PR #69 |
| RPC transacional de cadastro | dados/segurança | PR #71 |
| POC fiscal Python isolada + governança + validators | spike | PRs #58, #59, #61, #62 |

## Oportunidades que existiam naquele snapshot

Em maio/2026, o backlog listava, entre outras:

- Relação de Bens Adquiridos e demais documentos oficiais;
- `audit_logs` para mutações sensíveis;
- smoke UI operacional;
- página dedicada de histórico;
- Auth/recuperação/MFA;
- importador institucional com dry-run/diff/hash;
- Portal do Diretor mobile-first;
- Aquisição Fiscal Multicanal;
- hardening contínuo de WCAG/performance/logs;
- responsividade mobile;
- expansão de testes;
- higiene de branches e credenciais.

**Não assumir que esses itens continuam pendentes ou na mesma ordem.** Verifique `docs/ROADMAP_ADAPTIVE.md` e o estado real do repositório.

## Riscos históricos que permanecem conceitualmente úteis

| Risco | Mitigação geral |
|---|---|
| RLS silencioso | validar linhas afetadas/retorno em mutações sensíveis |
| `service_role` no browser | proibido; usar backend/workflow controlado |
| documentos fiscais reais commitados | `.gitignore`, fixtures sanitizadas e revisão humana |
| template oficial contendo base consolidada | proibido pelo contrato documental |
| operação pesada no browser | medir antes de decidir por worker/job externo |

## Lições preservadas

1. reconcile pós-merge é necessário quando o drift induz trabalho errado;
2. smoke operacional complementa CI;
3. blob/commit atual prevalece sobre comentário antigo de PR;
4. modernização por escopo isolado é mais segura do que upgrade indiscriminado;
5. documentação deve orientar ação, não criar ciclos de manutenção sem valor;
6. inteligência institucional continua exigindo valor visível, ação, rastreabilidade e sobriedade.

## Regra para reutilizar uma ideia deste arquivo

Antes de promover qualquer item histórico:

1. confirmar se ele já foi entregue ou substituído;
2. verificar `main`, PRs recentes e Production;
3. consultar `docs/DECISIONS.md`;
4. consultar `docs/ROADMAP_ADAPTIVE.md`;
5. aplicar o Radar de Inteligência Institucional;
6. só então propor um novo PR com escopo e critérios atuais.
