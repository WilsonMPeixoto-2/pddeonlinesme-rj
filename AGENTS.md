# PDDE Online 2026 - AGENTS.md

## Finalidade

Este arquivo define a politica operacional de uso de ferramentas no projeto.
O objetivo e reduzir retrabalho, evitar conflitos de responsabilidade e manter clareza sobre quem desenha, quem implementa e quem integra cada tarefa.

## Regra-mae

Cursor define contrato, boundaries e impacto sistemico.
Codex implementa o nucleo tecnico ou a execucao mecanica dentro do contrato aprovado.
Cursor integra, revisa impacto e fecha a costura final.
Humano aprova seguranca, regras financeiras e regras documentais oficiais.

## Regra obrigatoria durante a execucao das tarefas

Sempre explicitar antes de iniciar uma tarefa:

- ferramenta lider
- motivo tecnico
- momento de handoff para a outra ferramenta, quando houver

Se a tarefa estiver atribuida a ferramenta errada, isso deve ser apontado explicitamente antes da execucao.

## Fonte de verdade e compatibilizacao com o Plano v4

O Plano Global v4 continua sendo o eixo diretor do projeto. A migracao para Supabase proprio e o parenteses tecnico atualmente aberto dentro dele.

Antes de iniciar qualquer tarefa, a ferramenta executora deve ler, quando existirem:

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/DECISIONS_LOG.md`
- `docs/UI_CHANGELOG.md`
- `docs/PLAN_GLOBAL_V4_CONSOLIDATED.md`
- `docs/PLAN_V4_REALITY_ALIGNMENT.md`
- `docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md`
- `docs/FRONTEND_DATA_CONTRACT.md`

Nenhuma ferramenta deve presumir contexto apenas pelo prompt ou por relatorios externos. O GitHub e a documentacao versionada sao a fonte oficial.

Todo prompt deve classificar a tarefa como uma das seguintes categorias:

1. Parenteses Supabase: tarefas ligadas a contrato de dados, Supabase proprio, migrations, RLS, roles, importacao da BASE, Preview ou producao da migracao.
2. Plano Global v4: tarefas de monorepo, Fastify, motor documental, Portal do Diretor funcional, hardening amplo, geracao individual real ou ZIP/lote futuro.
3. Adendo de compatibilizacao: tarefas documentais de estado, decisao, alinhamento, handoff ou instrucao para ferramentas.

A classificacao deve aparecer no handoff final.

## Regras quota-resilientes e anti-colcha de retalhos

Como o projeto pode alternar entre Codex, Claude, Antigravity e outras ferramentas por restricoes de cota, toda tarefa deve ser pequena, autocontida, retomavel e auditavel.

Todo prompt tecnico deve declarar:

- arquivos que devem ser lidos;
- arquivos que podem ser alterados;
- arquivos que nao podem ser alterados;
- escopo proibido;
- criterios de aceite;
- comandos de validacao;
- ponto de parada;
- handoff final obrigatorio.

A ferramenta deve parar e devolver para revisao humana/Cursor se descobrir necessidade de alterar schema, auth, RLS, regra financeira, regra documental, contrato de API, arquitetura ou producao fora do escopo aprovado.

## Papeis oficiais

- Cursor e o arquiteto-integrador.
- Codex e o executor tecnico de blocos delimitados.
- Lovable e Antigravity atuam na camada visual e de prototipacao.
- Claude pode apoiar revisao, troubleshooting, logs, CI e analise cruzada.
- Humano e revisor obrigatorio nas areas criticas.

## Quando Cursor lidera

- decisao arquitetural
- contratos entre web, api, schemas e docs
- desenho do monorepo
- Fastify integrado ao frontend
- autenticacao
- papeis de usuario
- permissoes
- RLS, policies e boundaries de acesso
- migracao frontend -> backend
- refactor cross-package
- hardening pre-producao
- integracao final do motor documental ao sistema

## Quando Codex lidera

- clone e inventario do repositorio
- saneamento mecanico de arquivos
- remocao de residuos do Lovable
- criacao mecanica da estrutura do monorepo, apos desenho aprovado
- scripts
- parsers
- importacao da BASE.xlsx, no nucleo tecnico
- normalizacao de dados
- validacoes repetitivas
- motor documental isolado
- geracao individual de documentos, no nucleo gerador
- testes unitarios
- Dockerfile
- scripts de deploy
- benchmarks
- utilitarios de linha de comando
- correcoes mecanicas em massa
- diagnostico inicial terminal-first

## Casos hibridos obrigatorios

### Migracao Supabase

- Cursor lidera schema alvo, roles, RLS e storage policies.
- Codex executa migracoes mecanicas, scripts, dump/restore e verificacao local.
- Revisao final e humana + Cursor.
- O escopo vigente deve seguir `docs/SUPABASE_MIGRATION_CURRENT_SCOPE.md`.

### Monorepo

- Cursor define a separacao entre apps/ e packages/.
- Codex cria a estrutura, configura workspaces e ajusta arquivos.
- Cursor revisa boundaries e contratos.

### Importacao da BASE.xlsx

- Codex lidera parser, validacao e normalizacao.
- Cursor integra com API, permissoes, banco e UX.
- Lovable/Antigravity podem liderar apenas a experiencia visual da tela.

### Geracao individual

- Codex lidera o nucleo gerador e seus testes.
- Cursor integra rota, fluxo, permissoes, download e tratamento de erro.

### Motor documental

- Cursor define interface publica, local do pacote e contrato com a API.
- Codex implementa leitura de template, preenchimento, protecao e testes.
- Cursor integra o motor ao sistema.

## Revisao humana obrigatoria

- auth
- roles
- RLS e policies
- segredos e .env
- templates oficiais
- regras financeiras
- regras que alterem geracao documental oficial
- regras que impactem prestacao de contas ou acesso a dados sensiveis
- promocao de producao
- uso de dados reais

## Regra de bloqueio e retorno de contrato

Se Codex ou outra ferramenta descobrir que a implementacao exige mudar contrato, arquitetura, boundary ou decisao de seguranca, nao deve improvisar.

Nesse caso:

- parar;
- registrar o bloqueio;
- explicar por que a decisao excede o escopo;
- devolver a decisao para Cursor ou revisao humana.

## Fluxo padrao de execucao

- Cursor desenha.
- Codex implementa.
- Cursor integra e valida impacto.
- Humano aprova o que for critico.

## Formato obrigatorio dos prompts de trabalho

Todo prompt operacional deve declarar:

- classificacao da tarefa;
- ferramenta lider;
- objetivo da tarefa;
- arquivos que deve ler;
- arquivos que pode alterar;
- arquivos que nao deve alterar;
- escopo proibido;
- criterio de aceite;
- comandos de validacao;
- momento de handoff.

## Handoff obrigatorio

Ao final, informar:

- classificacao da tarefa;
- arquivos lidos;
- arquivos alterados;
- comandos executados;
- validacoes realizadas;
- concluido;
- pendente;
- bloqueado;
- riscos;
- proximo passo recomendado.

## Regra adicional desta fase do projeto

Enquanto o projeto estiver em fase de prototipacao e refinamento visual, Lovable e Antigravity podem se revezar por questoes de credito, cota ou conveniencia operacional.
Essa flexibilidade visual nao altera a divisao estrutural principal entre Cursor e Codex e nao autoriza alteracao de schema, auth, RLS, producao, regras financeiras ou regras documentais.

## Camada Codex - ferramentas padrao

Quando o Codex for usado neste repositorio, acionar a skill `pdde-online` e aplicar os roteamentos abaixo:

- Acionar tambem a skill `pdde-finance-data` para analise de dados, planilhas, Excel, `.xlsx`, BASE.xlsx, importacao/exportacao, saldo, recebido, gasto, demonstrativos, prestacao de contas, CNPJ, INEP, dashboards e relatorios.
- Supabase skill/MCP para Auth, roles, RLS, policies, migrations, generated types e acesso a dados. Producao e somente leitura salvo autorizacao explicita.
- Spreadsheet/Excel skill para BASE.xlsx, importacao, exportacao, validacao de colunas, normalizacao e relatorios tabulares.
- Doc/PDF skills para templates oficiais, motor documental, preenchimento, protecao e geracao de arquivos.
- Playwright/browser tooling para UI, responsividade, login, rotas protegidas, regressao visual e smoke test de fluxos.
- GitHub skills/tools para branch, PR, review, issues, CI e publicacao de mudancas locais.
- Vercel skills/tools para deploy, preview, production check, logs, dominios e variaveis de ambiente.
- Security skills para qualquer tarefa de auth, permissoes, RLS, secrets, dados sensiveis ou limites de acesso.

### Gatilhos automaticos de dados, planilhas e financeiro

Para demandas com qualquer um dos termos abaixo, Codex deve carregar `pdde-online` + `pdde-finance-data` e, conforme o caso, `spreadsheet`, `Excel`, `supabase`, `supabase-postgres-best-practices`, `doc`, `pdf` e `security-best-practices`:

- BASE.xlsx, planilha, Excel, CSV, importacao, exportacao, carga, parser, normalizacao, validacao de colunas, duplicidades, INEP, CNPJ, email, unidade escolar ou diretor.
- financeiro, prestacao de contas, saldo anterior, recebido, gasto, saldo disponivel, percentual de execucao, demonstrativo, conciliacao, relatorio financeiro, dashboard financeiro ou indicadores.
- documento oficial, modelo, template, declaracao, oficio, PDF, DOCX, motor documental, preenchimento de campos ou geracao individual.
- banco de dados, Supabase, tabela, migration, types, RLS, policies, Auth, roles, permissoes, dados sensiveis ou segregacao GAD/Diretor.

Padrao de execucao para essas tarefas:

- Primeiro inventariar a fonte de dados e o contrato esperado antes de alterar codigo.
- Preservar rastreabilidade entre valor bruto importado, valor normalizado e erro/warning gerado.
- Nao inventar regra financeira, documental, de acesso ou de identidade de escola. Se a regra nao estiver documentada, devolver para Cursor/humano.
- Tratar producao Supabase como somente leitura salvo autorizacao explicita.
- Quando houver artefato `.xlsx`, produzir resumo executivo, dados de origem, validacoes e detalhes auditaveis sempre que fizer sentido.
- Quando houver impacto visual em dashboard, importacao ou portal, validar com browser/Playwright depois da verificacao tecnica.

Validacao minima recomendada por tipo de alteracao:

- Codigo TypeScript: `npx tsc --noEmit`.
- UI ou fluxo React: `npx tsc --noEmit`, `npm run lint`, `npm run build` e verificacao visual quando houver impacto de tela.
- Parser/importador/motor documental: `npx tsc --noEmit`, `npm test` e casos de fixture representativos.
- Supabase/RLS/auth: validar migration/types localmente e exigir revisao humana antes de concluir.
- Mudanca substancial: `npx tsc --noEmit && npm run lint && npm test && npm run build`.
