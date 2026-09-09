# Contrato Financeiro PDDE v1 — Design

## Objetivo

Estabilizar a fronteira entre cadastro escolar, contas bancárias, repasses importados e execução operacional antes da nova interface financeira do PDDE Online 2026.

## Decisões

1. `repasses_financeiros` é a fonte canônica para repasses/programação/pagamentos importados do motor financeiro.
2. `execucao_financeira` permanece como estrutura operacional/legada de execução e compatibilidade, mas não deve concorrer com `repasses_financeiros` para responder perguntas de repasse na nova UI.
3. Cadastro geral da escola não altera identidade bancária. `update_unidade_cadastro_minima` passa a editar somente dados cadastrais da unidade.
4. Contas bancárias importadas são leitura operacional. Alterações futuras exigirão fluxo explícito por `conta_id`; não serão feitas implicitamente por cadastro escolar.
5. `null` significa desconhecido/não informado. Zero só representa zero conhecido.
6. Vínculo repasse → conta deve pertencer à mesma escola e ao mesmo programa quando a conta possuir programa informado.
7. Componentes custeio/capital só precisam somar ao total quando ambos estiverem conhecidos. Componentes ausentes permanecem nulos.
8. Repasses importados ficam somente leitura para usuários autenticados comuns. Cargas controladas podem usar contexto privilegiado de backend/Edge Function.
9. Cada repasse deve apontar para a execução de integração que o produziu, mantendo metadados técnicos fora da UI.
10. A identidade temporal de conta permanece, nesta fase, como registro de conta no contexto `programa/exercicio`. Não será introduzida uma nova tabela de vigência neste ciclo.

## Modelo de leitura

A nova UI consumirá contas e repasses separadamente por unidade/exercício e os agrupará em camada de domínio:

`Supabase -> queryOptions/TanStack Query -> useFinanceiroPDDE -> funções puras de domínio -> componentes`

A camada de domínio será responsável por agrupamento, ordenação, labels, mediana, faixas, datas, ausência de informação e composição programa → ação → parcelas.

## Segurança e integridade

- `repasses_financeiros`: SELECT autenticado; sem INSERT/UPDATE/DELETE por `authenticated`.
- `contas_bancarias`: leitura autenticada; dados 2026 importados não devem ser modificados pelo fluxo cadastral geral.
- trigger de coerência impede conta de outra escola/programa em um repasse.
- checks de soma protegem totais apenas quando componentes estão presentes.
- `integracao_run_id` cria rastreabilidade por registro.

## Compatibilidade

- O RPC mantém o nome `update_unidade_cadastro_minima`, mas sua nova assinatura deixa de receber banco/agência/conta.
- Campos bancários legados em `unidades_escolares` não são mais sincronizados por esse RPC.
- A view legada continua existindo para rotas antigas até a nova ficha migrar para o contrato financeiro.

## Fora deste ciclo

- saldo bancário atual;
- reconciliação posterior a fontes não consolidadas;
- event sourcing;
- microserviços/GraphQL/Kafka/Redis;
- histórico completo de vigência bancária;
- edição operacional de repasses importados;
- automação do motor financeiro.

## Critérios de aceite

- cadastro de escola não envia nem altera dados bancários;
- banco impede repasse vinculado a conta de outra escola/programa;
- banco rejeita componentes completos cuja soma diverge do total;
- 537 repasses atuais permanecem válidos;
- 491 vínculos bancários atuais permanecem válidos;
- todos os repasses atuais ficam ligados à carga financeira existente;
- leitura autenticada continua funcionando;
- tipos Supabase refletem o schema novo;
- CI completo verde.
