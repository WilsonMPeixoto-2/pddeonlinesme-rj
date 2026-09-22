# Atualizações financeiras — experiência operacional

## Objetivo

Tornar fatos financeiros novos visíveis assim que o snapshot validado do motor os disponibilizar, sem depender de navegação manual até uma escola ou de persistência já concluída no Supabase.

## Contrato de interface

A navegação principal passa a incluir **Atualizações**.

A página `/atualizacoes` apresenta:

- eventos financeiros ordenados por data;
- escola, INEP, programa, ação e parcela;
- valor informado;
- estágio de evidência;
- acesso direto aos Recursos PDDE da unidade;
- filtros por texto, programa e estágio;
- data do snapshot corrente e estado da persistência.

O Painel também mostra os cinco eventos financeiros mais recentes.

## Semântica obrigatória

Os estágios permanecem distintos:

1. `ordem-emitida`;
2. `pagamento-informado`;
3. `credito-confirmado`.

A presença de pagamento informado não autoriza a interface a afirmar crédito bancário confirmado.

## Atualização

As consultas financeiras usam:

- `staleTime`: 1 minuto;
- reconsulta automática: 5 minutos;
- reconsulta ao retornar o foco;
- reconsulta ao recuperar conexão;
- snapshot validado do motor como referência corrente, com Supabase como camada persistente/histórica.

Assim, um fato já presente no snapshot do motor não deve ficar oculto no layout apenas porque a persistência relacional ainda está atrasada.
