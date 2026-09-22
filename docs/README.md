# Documentação do PDDE Online 2026

> **Porta de entrada obrigatória para manutenção, análise e evolução do projeto.**

Este diretório contém documentação vigente e histórica. Nem todo arquivo aqui representa o estado atual do sistema. Para evitar decisões baseadas em snapshots antigos, use a hierarquia e o roteiro abaixo antes de qualquer tarefa substantiva.

## 1. Ordem de precedência

Quando duas fontes divergirem, adote esta ordem:

1. **Sistema real verificado** — código em `main`, schema/migrations, banco consultado, CI e deployment real;
2. **Decisões vigentes** — [`DECISIONS.md`](./DECISIONS.md);
3. **Estado operacional** — [`.continuity/current-state.json`](../.continuity/current-state.json) e [`HANDOFF.md`](./HANDOFF.md);
4. **Documentação técnica do domínio** — arquivos em [`technical/`](./technical/);
5. **Histórico** — planos, specs, handoffs datados, relatórios de recuperação, versões antigas e logs históricos.

**Regra:** documentação nunca substitui verificação do estado real quando a resposta depende de código, Production, Supabase, CI ou dados atuais.

## 2. Roteiro obrigatório de leitura

Antes de implementar, revisar ou documentar uma mudança relevante, leia nesta ordem:

1. [`../AGENTS.md`](../AGENTS.md) — regras de trabalho, validações e limites;
2. este arquivo — mapa documental e autoridade das fontes;
3. [`../.continuity/current-state.json`](../.continuity/current-state.json) — fotografia estruturada do estado corrente;
4. [`HANDOFF.md`](./HANDOFF.md) — contexto operacional humano e pendências reais;
5. [`DECISIONS.md`](./DECISIONS.md) — decisões de negócio, dados, UX, segurança e governança vigentes;
6. [`RADAR_INTELIGENCIA_INSTITUCIONAL.md`](./RADAR_INTELIGENCIA_INSTITUCIONAL.md) — critérios transversais de valor institucional, fluxo real, modernidade e acessibilidade;
7. documentação técnica específica da tarefa;
8. `main`, PRs recentes/abertos, CI, Supabase e Production conforme o escopo.

Planos e specs históricos só devem ser lidos quando necessários para compreender a origem ou os trade-offs de uma decisão.

## 3. Classes documentais

### CANÔNICO

Define regras vigentes. Mudanças nesses arquivos podem alterar a forma como o projeto deve ser mantido.

| Documento | Função |
|---|---|
| [`../AGENTS.md`](../AGENTS.md) | Regras gerais de atuação, validação e segurança |
| [`README.md`](./README.md) | Índice documental e roteiro obrigatório |
| [`DECISIONS.md`](./DECISIONS.md) | Fonte canônica das decisões vigentes |
| [`RADAR_INTELIGENCIA_INSTITUCIONAL.md`](./RADAR_INTELIGENCIA_INSTITUCIONAL.md) | Critérios transversais de produto e valor institucional |

### OPERACIONAL

Fotografia atualizável do projeto. Deve mudar quando uma frente relevante altera o estado ou a prioridade.

| Documento | Função |
|---|---|
| [`.continuity/current-state.json`](../.continuity/current-state.json) | Estado estruturado para agentes/ferramentas |
| [`HANDOFF.md`](./HANDOFF.md) | Estado humano, riscos, bloqueios e próximos movimentos |
| [`ROADMAP_ADAPTIVE.md`](./ROADMAP_ADAPTIVE.md) | Fila curta e prioridades após o estado atual |

### TÉCNICO POR DOMÍNIO

Leia somente os documentos ligados à tarefa em execução.

| Domínio | Leitura mínima |
|---|---|
| Financeiro / repasses | [`technical/integracao-financeira-pdde-2026-v1.md`](./technical/integracao-financeira-pdde-2026-v1.md), [`technical/financial-publication-contract-v1.md`](./technical/financial-publication-contract-v1.md), [`technical/repasses-operacionais-2026-v1.md`](./technical/repasses-operacionais-2026-v1.md) |
| Cadastro / edição de unidade | [`technical/fase-2b-edicao-cadastral-contrato.md`](./technical/fase-2b-edicao-cadastral-contrato.md) |
| Fiscal / extração | [`technical/fiscal-extraction-architecture.md`](./technical/fiscal-extraction-architecture.md), [`technical/fiscal-extraction-field-dictionary.md`](./technical/fiscal-extraction-field-dictionary.md), [`technical/fiscal-extraction-validation-protocol.md`](./technical/fiscal-extraction-validation-protocol.md), [`technical/fiscal-sample-corpus-protocol.md`](./technical/fiscal-sample-corpus-protocol.md) |
| Deploy / incidente específico | arquivos datados em `technical/`; confirmar sempre o deployment atual antes de agir |

### HISTÓRICO

Preservado por rastreabilidade, **não determina o estado atual**:

- [`PLANO_GLOBAL_V4_2.md`](./PLANO_GLOBAL_V4_2.md) como baseline estratégica de maio/2026;
- `PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` e versões anteriores;
- [`OPPORTUNITIES_BACKLOG.md`](./OPPORTUNITIES_BACKLOG.md) como snapshot de oportunidades de maio/2026;
- [`DECISIONS_LOG.md`](./DECISIONS_LOG.md) como registro histórico;
- `CODEX_HANDOFF_*.md`, relatórios de recovery/reconciliation e snapshots datados;
- [`superpowers/plans/`](./superpowers/plans/) e [`superpowers/specs/`](./superpowers/specs/), que registram desenho e execução de mudanças específicas.

## 4. Matriz rápida: o que ler por tipo de tarefa

| Tarefa | Além do roteiro obrigatório |
|---|---|
| Dashboard, `/repasses`, ficha financeira | trio técnico financeiro |
| Mudança em pipeline/snapshot | contrato de publicação financeira + workflow versionado + migrations correspondentes |
| Edição cadastral | contrato Fase 2B + migrations/RPC reais |
| Auth/RLS/roles | migrations, policies e código atual; documentos antigos são apenas contexto |
| Gerador documental | contrato/implementação atual do Demonstrativo + template oficial + testes de auditoria |
| Fiscal | arquitetura, dicionário e protocolo fiscal |
| UI/navegação | rotas/componentes atuais + Radar institucional + testes E2E/acessibilidade |
| Dependências | `package.json`, lockfile, CI e histórico de incompatibilidades relevante |
| Deploy/Production | SHA de `main`, status Vercel, domínio público e estado Supabase, nunca apenas handoff |

## 5. Estado consolidado em 21/09/2026

A fotografia detalhada continua em `current-state.json` e `HANDOFF.md`, mas o incidente financeiro de 21/09 acrescenta uma regra de precedência importante: quando a persistência estiver defasada, o **snapshot validado mais recente do motor** é a referência corrente dos fatos financeiros de 2026.

Estado comprovado no artefato integral da coleta de 21/09/2026:

- **163/163 unidades** com pagamento informado no 2º ciclo;
- **111** unidades em `PDDE Básico · 2ª Parcela`, totalizando **R$ 632.585,00**;
- **52** unidades em `Primeira Infância · P2`, totalizando **R$ 132.630,00**;
- total do 2º ciclo informado: **R$ 765.215,00**;
- pagamento informado, ordem e crédito bancário independente permanecem evidências distintas.

A arquitetura corrente passa a exigir coleta diária, snapshot validado como referência de monitoramento, reconciliação automática da interface, dimensão própria de pagamento informado do 2º ciclo, read-after-write da view operacional e alerta visível de frescor. Persistência atrasada não pode produzir `0` nem esconder um fato já validado.

## 6. Como manter a documentação saudável

Atualize documentação quando uma mudança alterar pelo menos um destes elementos:

- decisão de negócio ou regra operacional;
- contrato de dados;
- arquitetura, segurança, RLS ou autenticação;
- prioridade exibida como estado atual;
- procedimento de CI/deploy/automação;
- fluxo de usuário relevante para operação;
- fonte de verdade ou roteiro de leitura.

Evite registrar como texto canônico informações que envelhecem sozinhas, como contagem exata de testes, SHA de ferramenta sem valor operacional ou versões duplicadas que já estão em `package.json`.

## 7. Regra para novas decisões

Toda decisão nova que possa mudar comportamento, escopo, semântica de dados ou fluxo deve ser registrada em [`DECISIONS.md`](./DECISIONS.md) com:

- data;
- contexto;
- decisão;
- consequência;
- restrição/limite quando aplicável;
- referência ao PR/contrato que a implementou.

Não criar um novo arquivo de “decisões atuais”. O objetivo desta governança é justamente evitar múltiplas verdades concorrentes.
