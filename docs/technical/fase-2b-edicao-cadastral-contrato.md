# Fase 2B - Contrato tecnico de edicao cadastral minima

## 1. Objetivo

Preparar a Fase 2B para permitir edicao cadastral minima de unidade escolar no prototipo controlado do PDDE Online 2026, sem abrir escopo de Portal do Diretor, sem login/RLS final e sem alterar schema nesta etapa.

O codigo versionado atual mostra `EscolaEditar.tsx` como tela read-only, `useUnidadeDetalhe` consultando `vw_unidade_detalhe` e `useUnidadesLocalizador` consultando `vw_unidades_localizador`. Este contrato descreve a proxima frente; nao implementa UI, mutation ou migration.

## 2. Fora de escopo

- Login publico, cadastro publico, guards finais, roles finais e revisao completa de RLS.
- Portal do Diretor.
- UI da Fase 2B nesta PR.
- Mutation Supabase nesta PR.
- Migration Supabase nesta PR.
- Edicao de dados financeiros importados.
- Edicao de documentos oficiais ja gerados.
- Fluxo institucional completo de solicitacao, aprovacao e auditoria.

## 3. Campos candidatos a edicao direta no prototipo

- `diretor`: existe em `unidades_escolares` e aparece nas views de localizador/detalhe.
- `endereco`: existe em `unidades_escolares` e aparece em `vw_unidade_detalhe`.
- `agencia`: existe em `unidades_escolares` como legado e em `contas_bancarias`; a view usa `COALESCE(cb.agencia, u.agencia)`.
- `conta_corrente`: existe em `unidades_escolares` como legado e em `contas_bancarias`; a view usa `COALESCE(cb.conta_corrente, u.conta_corrente)`.
- `banco`: existe no modelo atual via `contas_bancarias.banco` e aparece em `vw_unidade_detalhe`.

## 4. Campos bloqueados nesta fase

- `unidade_id`.
- `designacao`.
- `inep`.
- `cnpj`.
- Valores financeiros: reprogramado, parcelas, gasto, totais e qualquer dado de execucao.
- `exercicio`.
- `programa`.

## 5. Campos sensiveis e cuidados

- Dados bancarios (`banco`, `agencia`, `conta_corrente`) devem preservar zeros a esquerda e caracteres validos como `X`.
- `cnpj` continua bloqueado nesta fase por impacto institucional e documental.
- Dados usados em documentos oficiais (`diretor`, `endereco`, dados bancarios) devem exibir aviso de impacto antes de salvar.
- Nenhum valor deve ser salvo silenciosamente se a validacao falhar.

## 6. Modelo recomendado para o prototipo

- Edicao direta controlada por operador/admin de desenvolvimento.
- Formularios pre-preenchidos a partir de `vw_unidade_detalhe`.
- Validacao antes de salvar.
- Feedback visual de salvamento, erro e estado sujo.
- Cache invalidation via React Query para:
  - `["unidade-detalhe", unidadeId, exercicio, programa]`;
  - `["unidades-localizador"]`, quando `diretor` mudar.
- Sem fluxo de aprovacao nesta fase.
- Sem tratar este prototipo como modelo institucional final.

## 7. Modelo institucional futuro

- Edicao por solicitacao.
- Aprovacao por perfil autorizado.
- Registro de auditoria consultavel.
- RLS e papeis revisados formalmente.
- Possivel separacao entre alteracao cadastral, dados bancarios e dados usados em documentos oficiais.

## 8. Validacoes por campo

- `diretor`: texto obrigatoriamente aparado; rejeitar string vazia se a unidade ja possui diretor; limite sugerido de 160 caracteres.
- `endereco`: texto aparado; aceitar vazio apenas se a regra de negocio permitir cadastro incompleto; limite sugerido de 255 caracteres.
- `banco`: texto aparado; no prototipo, aceitar nome/codigo textual sem normalizacao institucional obrigatoria.
- `agencia`: texto aparado; permitir digitos, hifen e `X`; preservar zeros a esquerda; limite sugerido de 20 caracteres.
- `conta_corrente`: texto aparado; permitir digitos, hifen, ponto, barra e `X`; preservar zeros a esquerda; limite sugerido de 30 caracteres.

## 9. Auditoria minima desejada

Quando a Fase 2B evoluir para mutation, a trilha minima deve registrar:

- `unidade_id`;
- `campo`;
- `valor_anterior`;
- `valor_novo`;
- `usuario`;
- `timestamp`;
- `origem`.

Nesta PR de contrato nao ha criacao de tabela, trigger, migration ou log persistido.

## 10. Impacto sobre documentos ja gerados

Alteracoes em `diretor`, `endereco`, `agencia`, `conta_corrente` ou `banco` afetam novos documentos gerados apos a alteracao. Arquivos `.xlsx` ja baixados pelo usuario nao sao reprocessados automaticamente e devem ser tratados como artefatos historicos fora do banco.

Antes de salvar dados usados em documentos oficiais, a UI futura deve informar que novos documentos refletirao o cadastro atualizado.

## 11. Riscos

- Salvar dados bancarios errados pode contaminar documentos oficiais.
- Editar `diretor` ou `endereco` sem auditoria pode dificultar rastreabilidade.
- Atualizar `contas_bancarias` e `unidades_escolares` sem contrato claro pode criar divergencia entre campos legados e tabela normalizada.
- Avancar sem invalidar cache pode manter a UI mostrando dados antigos.
- Tratar permissao temporaria do prototipo como regra institucional pode criar retrabalho em Marco 6B.

## 12. Criterios de aceite

- A primeira PR deve conter somente este contrato tecnico.
- Nenhuma UI, mutation, migration, Auth/RLS ou Portal do Diretor deve ser alterado nesta etapa.
- A futura mutation deve declarar exatamente quais tabelas atualiza.
- Campos bloqueados devem permanecer read-only.
- Validacoes devem rodar antes do envio.
- React Query deve invalidar detalhe e localizador quando aplicavel.
- O fluxo deve deixar claro que a edicao direta e prototipo controlado, nao modelo institucional final.

## 13. Divisao sugerida em PRs pequenos

- PR 1: contrato tecnico.
- PR 2: schema/tipos/mutation, se a revisao humana aprovar a tabela alvo e o limite de auditoria.
- PR 3: UI minima em `EscolaEditar.tsx`.
- PR 4: auditoria/logs, se necessario.
