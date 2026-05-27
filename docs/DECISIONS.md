# Decisoes Operacionais - PDDE Online 2026

Este documento registra decisoes operacionais vigentes. Ele complementa `docs/DECISIONS_LOG.md` e deve ser atualizado quando uma nova decisao mudar fluxo, prioridade, escopo ou criterio de aceite.

## 2026-05-07 - Plano Global v4.1 como norte

**Decisao:** `docs/PLANO_GLOBAL_V4_ATUALIZADO_POS_SUPABASE.md` passa a ser o norte operacional para novas tarefas.

**Consequencia:** futuras frentes devem ser classificadas pelo marco funcional correspondente, evitando reabrir a Supabase Foundation v1 como frente generica.

## 2026-05-07 - Backlog adaptativo como radar

**Decisao:** `docs/OPPORTUNITIES_BACKLOG.md` sera usado como radar de oportunidades.

**Consequencia:** um item no backlog nao autoriza implementacao. Cada item funcional deve virar PR proprio com escopo, arquivos permitidos, arquivos proibidos, validacao e handoff.

## 2026-05-07 - Demonstrativo Basico Individual como proximo sub-marco

**Decisao:** o proximo sub-marco prioritario e o Demonstrativo Basico Individual.

**Consequencia:** o proximo PR funcional recomendado e `feat(documentos): gerar Demonstrativo Basico individual via MEMORIA`.

## 2026-05-07 - Opcao B para Demonstrativo

**Decisao:** para o Demonstrativo Basico Individual, adotar a Opcao B: preencher a aba `MEMORIA` diretamente com dados do Supabase.

**Consequencia:** a implementacao funcional deve evitar caminhos intermediarios desnecessarios quando a aba `MEMORIA` puder ser preenchida de forma rastreavel, testavel e compativel com o template oficial.

**Restricao:** o arquivo individual nao deve depender da aba `BASE` nem de `XLOOKUP`.

**Limite:** esta decisao nao autoriza alteracao de Supabase, RLS, auth, migrations, regras financeiras ou template oficial sem revisao humana.

## 2026-05-08 - Saneamento do template publico do Demonstrativo

**Decisao:** templates documentais publicados em `public/` nao podem conter dados reais consolidados de unidades escolares.

**Consequencia:** o template publico do Demonstrativo Basico deve conter apenas estrutura documental, layout e abas necessarias ao documento individual. Dados reais permanecem no Supabase e sao injetados pelo gerador.

**Restricao:** arquivos individuais gerados nao podem conter a aba `BASE`, formulas `XLOOKUP`, referencias `BASE!` ou referencias estruturadas `BASE[...]`.

**Regra operacional:** planilhas-mestras legadas com `BASE`, formulas de busca ou dados consolidados podem ser usadas apenas como referencia historica/documental, nunca como template publico nem como arquivo final entregue a uma unidade.

## 2026-05-07 - Continuidade obrigatoria

**Decisao:** todo agente deve ler os documentos de continuidade antes de agir e atualizar continuidade/handoff depois de tarefas relevantes.

**Consequencia:** PRs futuros devem registrar estado, decisoes e proximo passo para reduzir perda de contexto entre ferramentas.

## 2026-05-07 - ExcelJS para Demonstrativo individual

**Decisao:** usar `exceljs` no gerador individual do Demonstrativo Basico.

**Consequencia:** a dependencia `xlsx` existente permanece disponivel para exportacoes tabulares simples, mas o Demonstrativo individual usa `exceljs` porque precisa preservar template, formulas, bordas e mesclagens com maior fidelidade.

**Restricao:** `exceljs` deve ser carregado sob demanda, via `dynamic import()`, para nao aumentar desnecessariamente o bundle inicial.

## 2026-05-11 - DocumentsPanel integrado ao gerador real (Opcao B na listagem)

**Decisao:** o `DocumentsPanel` (painel lateral acionado pelo botao "Gerar documentos" na listagem `/escolas`) passa a chamar o gerador real do Demonstrativo Basico, exatamente como o botao individual em `/escolas/:id`.

**Consequencia:** o usuario obtem download `.xlsx` real ao clicar no Demonstrativo dentro do painel. O painel recebe `unidadeId` e `programa` como props, busca `vw_unidade_detalhe` via `useUnidadeDetalhe`, chama `generateDemonstrativoBasico` e dispara `saveAs(blob, fileName)`. `toast.success` ocorre apenas apos o `saveAs`.

**Restricao:** outros 5 documentos do painel continuam como `toast.info("em desenvolvimento")` (placeholders honestos). O botao "Pacote completo (.zip)" virou placeholder honesto ate que os outros documentos existam.

**Limite:** esta decisao nao altera o gerador subjacente, nem o template oficial, nem regras documentais ou financeiras.

## 2026-05-11 - Fix estrutural anti-regressao na tabela /escolas

**Decisao:** a tabela em `/escolas` usa exclusivamente `TableRow` nativo, `Table className="table-fixed"` e `<colgroup>` com larguras percentuais (38/24/13/17/8). A classe CSS `.row-accent` foi removida do projeto.

**Justificativa:** a combinacao `motion.tr` (com prop `layout` do framer-motion) + `.row-accent` (pseudo-elemento `::before` com `position: absolute` dentro do `<tr>`) quebrava o calculo nativo de colunas do `<table>` em alguns navegadores, causando drift visual entre celulas e cabecalho. Esse era o terceiro retorno desse mesmo bug, originalmente corrigido pelo commit `baceb7735e` (2026-04-30) e reincidido em PRs visuais posteriores.

**Consequencia:** futuras alteracoes na tabela `/escolas` nao devem reintroduzir `motion.tr`, `AnimatePresence` ou classes que insiram pseudo-elementos absolutos dentro de `<tr>`. O comentario `// Keep rows native: row-accent/motion.tr already caused column drift in this table.` permanece em `src/pages/Escolas.tsx` como guardiao.

**Limite:** se houver necessidade legitima de animacao no body da tabela (ex.: fade-in ao carregar), usar `@keyframes` CSS no `tbody tr` ou wrappers externos, nunca framer-motion direto no elemento `<tr>`.

## 2026-05-11 - Admin bypass do Ruleset "Protect main" para PRs solo

**Decisao:** enquanto o projeto for solo-developer, o merge de PRs em `main` pode usar `gh pr merge --merge --admin` (ou o equivalente no GitHub UI), bypassando a regra de 1 review aprovada do Ruleset "Protect main".

**Justificativa:** o repositorio tem `current_user_can_bypass: always` para o usuario admin/owner (Wilson). O Ruleset foi configurado para exigir 1 review, mas o GitHub nao permite que o autor aprove o proprio PR. Sem outro colaborador, o bypass administrativo e o caminho operacional padrao. PRs anteriores (`#39`, `#40`, `#41`, `#42`, `#44`) usaram esse mesmo mecanismo (todos com `reviewDecision: REVIEW_REQUIRED` no momento do merge).

**Consequencia:** o gate humano informal continua sendo o smoke autenticado pre-merge (manual ou via Playwright). O Ruleset permanece ativo como sinalizacao e auditoria.

**Limite:** quando o projeto receber outros colaboradores ou for divulgado, reavaliar essa pratica e mover gates para checks automatizados (CI obrigatorio configurado no proprio Ruleset).
