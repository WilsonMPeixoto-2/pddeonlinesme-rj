# Registro de Decisões de Arquitetura (DECISIONS_LOG)

| Decisão | Resultado Prático | Motivação | Data |
| :--- | :--- | :--- | :--- |
| **D1** — Lovable não será referência de banco | Apenas referência visual e laboratório de UX. | Falhas semânticas no schema gerado na expansão inicial. | Abril 2026 |
| **D2** — DESIGNAÇÃO e NOME distintos | `designacao` (código), `nome` (rótulo). | Adesão total à semântica da BASE governamental SME-RJ. | Abril 2026 |
| **D3** — Supabase próprio com schema semântico | Não replicar schema "protótipo" em produção. | Necessidade de controle estrito via Migrations (IaC) e RLS. | Abril 2026 |
| **D4** — Produção *read-mostly* na v2.2 | Inibição de botões destrutivos até estabilização. | Evitar danos enquanto as migrações e auditorias ocorrem. | Abril 2026 |
| **D5** — ETL Centralizado em Script Local | Criação de script Python/Node local para importação. | Evitar sobrecarga do browser e exposição de lógica no client. | Abril 2026 |
| **D6** — Validação local antes de remoto | `supabase db reset --local`, typegen e gates de build são obrigatórios antes de qualquer `db push`. | Reduzir risco de aplicar migrations quebradas ou tipos inconsistentes em ambiente remoto. | Abril 2026 |

## Decisão — PR 3B: leitura via view, escrita via tabelas-base

As telas de listagem, dashboard, busca e visualização de detalhe devem consumir `vw_unidades_escolares_frontend`, pois a view expõe campos derivados necessários à interface, incluindo `unidade_label`, `saldo_anterior`, `recebido`, `gasto` e `saldo_estimado`.

A escrita não deve ser feita pela view. Telas de edição, especialmente `EscolaEditar`, devem gravar campos cadastrais em `unidades_escolares` e campos financeiros em `execucao_financeira`, sempre considerando o `exercicio` e o `programa` selecionados.

Quando uma tela alterar dados cadastrais e financeiros no mesmo botão “Salvar”, o frontend poderá coordenar duas operações separadas nesta fase. Uma transação real entre as duas tabelas exigirá RPC, Edge Function ou backend dedicado, ficando fora do escopo imediato do PR 3B.

A view `vw_unidades_status` é estritamente de leitura.

Esta separação evita ambiguidade arquitetural e impede que agentes tentem atualizar diretamente `vw_unidades_escolares_frontend`, que é uma view com JOIN e não deve ser tratada como tabela editável.

## Decisão — Preview não equivale a Supabase remoto validado

Preview da Vercel é ambiente de validação de frontend/build. Enquanto não houver `supabase db push` para o Supabase próprio remoto e configuração explícita das variáveis de Preview/Production da Vercel para o novo backend, o Preview não deve ser interpretado como validação plena do sistema conectado ao Supabase próprio.

## Backlog — performance/chunk Vite

O aviso de chunk acima de 500 kB no build Vite fica registrado para hardening pré-produção. Não deve bloquear o PR 3B. A revisão de code-splitting, lazy loading de rotas e otimização de bundles deve ser tratada no Marco 14.
