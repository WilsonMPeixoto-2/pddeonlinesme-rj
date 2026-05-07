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

## 2026-05-07 - Continuidade obrigatoria

**Decisao:** todo agente deve ler os documentos de continuidade antes de agir e atualizar continuidade/handoff depois de tarefas relevantes.

**Consequencia:** PRs futuros devem registrar estado, decisoes e proximo passo para reduzir perda de contexto entre ferramentas.

## 2026-05-07 - ExcelJS para Demonstrativo individual

**Decisao:** usar `exceljs` no gerador individual do Demonstrativo Basico.

**Consequencia:** a dependencia `xlsx` existente permanece disponivel para exportacoes tabulares simples, mas o Demonstrativo individual usa `exceljs` porque precisa preservar template, formulas, bordas e mesclagens com maior fidelidade.

**Restricao:** `exceljs` deve ser carregado sob demanda, via `dynamic import()`, para nao aumentar desnecessariamente o bundle inicial.
