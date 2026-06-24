# Handoff Operacional — PDDE Online 2026

**Atualizado em:** 24/06/2026  
**Escopo:** saneamento da memória operacional e preservação da separação entre projetos

## 1. Regra de escopo

Este repositório e seus arquivos de continuidade devem registrar **exclusivamente** fatos, decisões, validações, branches, commits, deploys e pendências do projeto **PDDE Online 2026**.

Não devem ser registrados aqui eventos de outros repositórios, aplicações ou pastas de trabalho, ainda que tenham sido executados na mesma máquina, pela mesma ferramenta ou na mesma sessão.

Exemplos expressamente fora do escopo deste repositório:

- Compacta SDP;
- Pesquisa Consolidada;
- qualquer outro sistema, protótipo ou repositório que não seja `WilsonMPeixoto-2/pddeonlinesme-rj`.

## 2. Fonte de verdade

A fonte primária de verdade técnica é a verificação direta de:

1. código-fonte da branch `main`;
2. commits e diffs do GitHub;
3. migrations versionadas em `supabase/migrations/`;
4. testes e checks efetivamente executados;
5. deployments vinculados ao repositório correto.

Os arquivos `.continuity/*`, este `HANDOFF.md`, roadmaps e relatórios são snapshots auxiliares. Em caso de divergência, prevalece o código e o histórico real do GitHub.

## 3. Resultado da auditoria de contaminação entre projetos

A revisão realizada em 24/06/2026 confirmou que houve mistura de informações de outros projetos na memória operacional do PDDE Online.

### Conteúdo indevido identificado

Foram encontrados três registros alheios ao PDDE Online:

- duas atividades do projeto **Compacta SDP**;
- uma atividade do projeto **Pesquisa Consolidada**.

Esses registros apareciam em:

- `.continuity/session-log.jsonl`;
- `docs/HANDOFF.md`.

### Origem

A contaminação foi introduzida diretamente na `main` pelo commit `0034645` e posteriormente alterada pelo commit `a9a049b`.

Não se tratou de mistura em PRs funcionais do PDDE Online. A revisão do estado atual não encontrou arquivos de código, migrations, templates ou componentes pertencentes aos outros projetos.

### Limpeza aplicada

- removidos os três registros indevidos do `session-log`;
- removida a referência à Pesquisa Consolidada do handoff;
- substituído o handoff antigo por este snapshot sanitizado e restrito ao PDDE Online;
- adicionada regra explícita para impedir novas contaminações de escopo.

Os commits históricos permanecem no Git, como é normal em uma correção não destrutiva. O conteúdo corrente da branch de limpeza deixa de expor essas referências.

## 4. Estado operacional verificado antes da limpeza

No momento da auditoria:

- repositório: `WilsonMPeixoto-2/pddeonlinesme-rj`;
- branch-base: `main`;
- commit-base verificado: `a9a049b`;
- não havia pull requests abertas;
- não havia issues abertas;
- a aplicação estava publicada pela Vercel;
- o código utilizava Supabase próprio e dados reais das unidades escolares.

## 5. Entregas já presentes no código

A leitura direta do repositório confirma, entre outras frentes:

- Painel Executivo-Operacional;
- localizador e ficha das unidades escolares;
- edição cadastral mínima;
- geração individual do Demonstrativo Básico;
- geração em lote dos 163 Demonstrativos;
- histórico de gerações;
- atualização parcial assistida da BASE;
- gestão inicial de papéis administrativos;
- Portal do Diretor em evolução;
- Relação de Bens Adquiridos;
- frente fiscal em estágio de spike funcional.

Este resumo não substitui revisão específica de cada fluxo antes de homologação institucional.

## 6. Norte operacional vigente

- Plano: `docs/PLANO_GLOBAL_V4_2.md`;
- Diretriz transversal: `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
- Governança de agentes: `AGENTS.md`.

A versão v4.1 permanece apenas como referência histórica.

## 7. Arquivos obrigatórios antes de qualquer nova tarefa

1. `AGENTS.md`;
2. `docs/PLANO_GLOBAL_V4_2.md`;
3. `docs/RADAR_INTELIGENCIA_INSTITUCIONAL.md`;
4. `.continuity/current-state.json`;
5. `docs/HANDOFF.md`;
6. código e commits atuais da `main`.

## 8. Regra de atualização da continuidade

Ao encerrar uma tarefa no PDDE Online:

- registrar apenas eventos deste repositório;
- conferir o nome do projeto e o remoto Git antes de escrever no `session-log`;
- não copiar automaticamente contexto de outras sessões;
- não registrar testes ou deploys de outro projeto como validação do PDDE;
- indicar claramente quando uma informação é fato verificado, relato anterior ou pendência de confirmação.

## 9. Próximo passo após este saneamento

Revisar e incorporar o PR isolado de limpeza. As demais conclusões da auditoria geral — segurança, CI, RLS, integridade fiscal e homologação — devem ser tratadas em frentes próprias, sem serem misturadas a esta correção documental.
