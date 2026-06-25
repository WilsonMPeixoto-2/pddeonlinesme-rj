# AGENTS.md — PDDE Online 2026

**Atualizado em:** 25/06/2026  
**Plano vigente:** Plano Global v4.2 + Radar de Inteligência Institucional

## Fonte de verdade técnica

A fonte primária de verdade é a verificação direta do código-fonte, branch, commit, diff, configuração versionada e testes reais no GitHub.

Relatórios, handoffs, `current-state.json`, roadmaps, comentários de PR e memórias são snapshots auxiliares. Se houver conflito, o código e os testes prevalecem.

### Classificação obrigatória

Ao reportar informações, classificar cada afirmação como:

- **FATO VERIFICADO NO CÓDIGO** — confirmado por arquivo, commit, diff, teste ou deployment;
- **HIPÓTESE** — inferência ainda não confirmada;
- **RELATO DE OUTRA FERRAMENTA** — informação de relatório, log ou memória;
- **PENDÊNCIA A CONFIRMAR** — item que exige verificação antes de orientar decisão.

## Ferramentas e modelo de trabalho

O projeto pode ser mantido por Codex, Claude Code, Copilot, Cursor, Antigravity ou outras ferramentas. Nenhuma tem exclusividade.

A ferramenta líder é definida pelo escopo:

- entrada, saída e teste claros: qualquer ferramenta pode liderar;
- integração entre camadas ou decisão arquitetural: revisão humana obrigatória;
- segurança, autenticação, RLS, roles, dados sensíveis, regras financeiras ou documentos oficiais: revisão humana obrigatória.

### Regra de bloqueio

Se a tarefa exigir mudar contrato, arquitetura, boundary ou decisão de segurança, o agente não deve improvisar. Deve registrar o bloqueio e devolver a decisão para revisão humana.

## Camada de dados e financeiro

Para tarefas envolvendo dados financeiros, planilhas, importação/exportação, CNPJ, INEP, demonstrativos ou prestação de contas:

- inventariar a fonte de dados e o contrato esperado antes de alterar código;
- preservar rastreabilidade entre valor bruto, valor normalizado e erro ou warning;
- não inventar regra financeira, documental, de acesso ou identidade de escola;
- tratar produção Supabase como somente leitura salvo autorização explícita;
- preservar templates, fórmulas, bordas, células mescladas e regras oficiais.

## Validações mínimas

| Tipo de alteração | Validações mínimas |
|---|---|
| TypeScript | `npx tsc --noEmit` |
| UI ou fluxo React | typecheck, lint, build e verificação visual |
| Parser, importador ou motor documental | typecheck, testes e fixtures representativas |
| Supabase, RLS ou auth | migration e types local + revisão humana |
| Mudança substancial | `npm ci`, typecheck, lint, testes e build |
| Dependências | sincronizar `package.json` e `package-lock.json`, executar auditoria |
| Documentação pura | validar JSON e confirmar escopo pelo diff |

Não usar `--force`, `--legacy-peer-deps` ou desabilitar regras para obter CI artificialmente verde.

## Estado atual verificado

**main HEAD verificada:** `e7cb4952479d6af62e49784e2c544632d2396864` — PR #95 documental.

**Último marco técnico de código:** `93ed0419c8b861e83eb9c564d726c86ec550cfa3` — PR #94.

Este valor é snapshot. Confirmar novamente a `main` antes de agir.

### Entregas recentes

- PR #90 — gate permanente de lint, typecheck, testes e build restaurado;
- PR #92 — atualização segura de dependências e lockfile reproduzível;
- PR #94 — migração para plugin React padrão do Vite e code splitting do Rolldown;
- atualização parcial assistida da BASE;
- geração individual e em lote do Demonstrativo Básico;
- histórico de gerações;
- Painel Executivo-Operacional;
- gestão inicial de papéis;
- Relação de Bens Adquiridos;
- frente fiscal funcional em endurecimento;
- Portal do Diretor em evolução.

### Dependências e segurança

A auditoria reproduzível passou de cinco achados para dois moderados na cadeia `exceljs → uuid`. Não executar `npm audit fix --force`, pois a correção proposta rebaixa o ExcelJS.

O `package.json` contém override restrito de `@rolldown/plugin-babel` para `0.1.7`, necessário para compatibilidade do peer opcional com Workbox/Babel 7. Não remover sem reproduzir a instalação limpa.

A avaliação `types-node-26-evaluation` decidiu alinhar o ambiente ao runtime real Node 24.x: `engines.node` e CI em Node 24, `@types/node` em `^24.13.2`. Não atualizar para 26.x sem decisão explícita de runtime.

### Estado da produção

Projeto Vercel principal:

- runtime Node `24.x`;
- produção confirmada em `1399a691d622715a787ea1d9b720ff9992d9f679`;
- deployment confirmado `READY`: `dpl_4M1tQA1JdVNnBYmjjUNXZP3eeBrx`.

A `main` está à frente da produção. O PR #94 foi validado por CI e Preview independente, mas a produção principal não foi confirmada nesse SHA por limite temporário de frequência de builds.

Nunca declarar produção sincronizada sem verificar o SHA do deployment e o domínio público.

## Próxima fila

### Próxima frente funcional imediata

Corrigir em PR isolado a veracidade institucional do `SecurityCenterPanel`, que apresenta estados simulados de scanner RLS, MFA e logs com aparência de controles reais.

### Frentes estruturais ainda relevantes

- hardening de auth, roles, guards, RLS, auditoria e storage;
- aquisição fiscal multicanal com preferência por fontes estruturadas;
- Portal do Diretor mobile-first;
- WCAG, observabilidade e hardening contínuo;
- histórico e rastreabilidade documental onde ainda houver lacunas.

## Política de documentação

Documentação deve apoiar o desenvolvimento, não capturá-lo em ciclos de reconciliação.

Atualizar documentação quando o drift puder:

- induzir o próximo agente à tarefa errada;
- listar como pendente algo concluído;
- apontar caminho incorreto;
- registrar prioridade incompatível com o plano;
- criar risco real de replanejamento.

## Formato de prompt operacional

Todo prompt operacional deve declarar:

- ferramenta líder;
- objetivo;
- arquivos que deve ler;
- arquivos que pode alterar;
- arquivos proibidos;
- critérios de aceite;
- validações mínimas.

## Radar Transversal de Inteligência Institucional

Toda tarefa deve aplicar `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`.

Perguntas obrigatórias:

1. Existe fonte estruturada antes de digitar ou usar OCR?
2. Existe padrão consolidado em sistemas públicos, ERPs ou design systems?
3. A tarefa pode virar alerta, status, histórico, gráfico, relatório ou evidência?
4. A solução reduz clique, memória, retrabalho ou planilha paralela?
5. A interface mostra o próximo passo?
6. A entrega é segura para dados reais, perfis, arquivos e auditoria?
7. O ganho é demonstrável para chefia e Alta Administração?
8. A abordagem é adequada para 2026?

## Antes de qualquer tarefa

Ler:

1. `AGENTS.md`;
2. `docs/PLANO_GLOBAL_V4_2.md`;
3. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
4. `.continuity/current-state.json`;
5. `docs/HANDOFF.md`;
6. `docs/CODEX_HANDOFF_2026-06-25.md`;
7. `docs/DECISIONS.md`;
8. `docs/ROADMAP_ADAPTIVE.md`;
9. `docs/OPPORTUNITIES_BACKLOG.md`;
10. GitHub `main`, PRs recentes e produção real.

## Depois de qualquer tarefa

Atualizar:

1. `.continuity/current-state.json`;
2. `.continuity/session-log.jsonl`;
3. `docs/HANDOFF.md`.

Se houver decisão nova ou mudança de prioridade, atualizar também `docs/DECISIONS.md`, `docs/ROADMAP_ADAPTIVE.md` e `docs/OPPORTUNITIES_BACKLOG.md`.
