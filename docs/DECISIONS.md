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

**Decisao:** o `DocumentsPanel` em `EscolaEditar.tsx` foi integrado ao gerador real `generateDemonstrativoBasico`, usando `useUnidadeDetalhe` para obter dados do Supabase e `file-saver saveAs` para download.

**Consequencia:** a listagem de documentos da unidade deixa de ser mockada e passa a gerar o Demonstrativo Basico real a partir dos dados da view `vw_unidade_detalhe`.

**Restricao:** novos tipos documentais no painel devem seguir o mesmo padrao de integracao (hook de dados + gerador isolado + download). Nao acoplar logica de geracao ao componente visual.

## 2026-05-11 - Fix estrutural anti-regressao na tabela /escolas

**Decisao:** substituir `motion.tr` com classe `row-accent` por `TableRow` nativo com layout `table-fixed` e `colgroup` com larguras percentuais na pagina `/escolas`.

**Consequencia:** a tabela de escolas nao depende mais de `motion.tr` para renderizar linhas, eliminando o desalinhamento de colunas causado pela interacao entre Framer Motion e CSS de acento.

**Restricao:** futuras animacoes em linhas de tabela devem ser validadas contra `table-fixed` e `colgroup` antes de merge.

## 2026-05-11 - Admin bypass do Ruleset como procedimento excepcional

**Decisao:** em PRs mantidos exclusivamente pelo proprietario do repositorio (solo-author), o bypass administrativo do Ruleset "Protect main" podera ser utilizado quando os checks tecnicos e validacoes operacionais estiverem documentados.

**Consequencia:** o PR #43 foi mergeado por admin bypass apos documentacao completa de checks tecnicos (tsc, lint, test, build) e validacao operacional local.

**Restricao:** a preferencia permanece por revisao externa quando houver colaborador disponivel. O bypass administrativo nao substitui revisao de codigo como pratica permanente; e um procedimento excepcional permitido ao mantenedor em contexto de PR solo validado.

