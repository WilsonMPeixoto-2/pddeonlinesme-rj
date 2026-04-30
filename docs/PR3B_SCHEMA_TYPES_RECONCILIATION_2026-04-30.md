# PR3B Schema/Types Reconciliation

Data: 2026-04-30
Branch: `feature/pr3b-clean-semantic-schema`
HEAD auditado: `85cf5513e18685749a5683750b3c3c5a2c8fa0ae`

## 1. Finalidade

Este relatório registra a reconciliação técnica do contrato Supabase/schema/types necessária para continuar o PR3B clean.

A sessão foi limitada a auditoria e documentação. Não houve alteração de telas, migrations, `types.ts`, Supabase remoto, Vercel ou produção.

## 2. Por Que Dashboard Está Bloqueado?

O Dashboard semântico da branch legada lê:

- `public.vw_unidades_escolares_frontend`;
- `public.documentos_gerados`;
- filtros `exercicio` e `programa`;
- campos `nome`, `recebido`, `gasto`, `saldo_anterior` e `updated_at` na view.

Na branch limpa atual:

- `vw_unidades_escolares_frontend` não existe nas migrations nem em `types.ts`;
- `documentos_gerados` não existe nas migrations nem em `types.ts`;
- `execucao_financeira` não existe;
- `unidades_escolares` ainda mistura campos cadastrais e financeiros;
- `types.ts` declara `Views: { [_ in never]: never }`.

Portanto, adaptar Dashboard agora exigiria cast manual, query contra objeto inexistente ou migration nova. Todas as opções estão fora do escopo seguro desta sessão.

## 3. Migrations Na Branch Limpa

| Migration | Função | Observação |
|---|---|---|
| `20260421040958_aec9879e-a424-49fe-a0a7-1a6c90ea728b.sql` | Cria `app_role`, `user_roles`, `has_role`, `unidades_escolares` e trigger `set_updated_at`. | `app_role` tem apenas `admin` e `operador`; `unidades_escolares` contém campos financeiros inline. |
| `20260421041017_ab22618d-e95a-4029-87b3-ab35aa4ea23a.sql` | Restringe insert/update de `unidades_escolares` a admin/operador e ajusta `set_updated_at`. | Não cria objetos semânticos novos. |
| `20260427004801_4b960535-e200-4bd7-a423-3a1253f45764.sql` | Adiciona campos BASE em `unidades_escolares` e cria `import_logs`. | `import_logs` não tem `exercicio` nem `programa`; leitura é aberta para authenticated. |

## 4. Migrations Na Branch Legada

| Migration | Função | Validação registrada | Risco de reaproveitamento |
|---|---|---|---|
| `20260427000100_auth_roles_profiles.sql` | Cria `app_role` com `diretor`, `profiles`, `user_roles`, `has_role`, `set_updated_at` e policies. | `docs/PR3B_LOCAL_TESTING.md` registra reset local aprovado. | Conflita com a migration limpa que já cria `app_role`, `user_roles` e `has_role`. |
| `20260427000200_unidades_escolares.sql` | Cria `unidades_escolares` cadastral pura com `nome`, `ativo`, `source_payload` e índices. | Validada localmente na branch legada. | Conflita com a tabela atual, que já existe e tem campos financeiros inline. |
| `20260427000300_execucao_financeira.sql` | Cria financeiro por `unidade_id/exercicio/programa`. | Validada localmente na branch legada. | Depende da tabela cadastral semântica. |
| `20260427000400_import_logs.sql` | Cria `import_logs` com `exercicio`, `programa` e RLS restritiva. | Validada localmente na branch legada. | Conflita parcialmente com `import_logs` atual. |
| `20260427000500_document_types_documentos_gerados.sql` | Cria catálogo e status de documentos. | Validada localmente na branch legada. | Depende do contrato semântico e de revisão documental futura. |
| `20260427000600_views_frontend_status.sql` | Cria `vw_unidades_escolares_frontend` e `vw_unidades_status` com `security_invoker`. | Validada localmente na branch legada. | Depende de `execucao_financeira` e da tabela semântica. |

## 5. Objetos Disponíveis Na Branch Limpa

| Objeto | Existe? | Onde aparece | Usado por |
|---|---:|---|---|
| `unidades_escolares` | Sim | migrations, `types.ts`, Dashboard, Escolas, EscolaEditar, `baseImporter.ts` | Telas atuais e importador frontend legado. |
| `import_logs` | Sim | migration `20260427004801`, `types.ts`, Base, `baseImporter.ts` | Base e importador frontend legado. |
| `user_roles` | Sim | migration inicial, `types.ts` | RBAC base. |
| `app_role` | Sim | migration inicial, `types.ts` | RBAC base. |
| `has_role` | Sim | migration inicial, `types.ts` | Policies. |
| `execucao_financeira` | Não | Menção documental apenas | Bloqueia financeiro semântico. |
| `documentos_gerados` | Não | Não aparece ativo | Bloqueia contagem real de documentos. |
| `document_types` | Não | Não aparece ativo | Bloqueia status/catálogo documental. |
| `profiles` | Não | Não aparece ativo | Bloqueia integração mais completa de usuário/diretor. |
| `vw_unidades_escolares_frontend` | Não | Menção documental apenas | Bloqueia Dashboard/Escolas/EscolaEditar semânticos. |
| `vw_unidades_status` | Não | Não aparece ativo | Bloqueia status semântico de Escolas. |

## 6. Objetos Disponíveis Apenas Na Branch Legada

| Objeto | Origem | Pode ser reaproveitado? | Risco |
|---|---|---:|---|
| `profiles` | `20260427000100_auth_roles_profiles.sql` | Sim, em bloco de schema coerente | Mexe em Auth/RLS; exige revisão humana. |
| `app_role = diretor` | `20260427000100_auth_roles_profiles.sql` | Sim, em bloco de RBAC aprovado | Amplia modelo de permissões. |
| `unidades_escolares.nome` | `20260427000200_unidades_escolares.sql` | Sim | Exige migração da tabela atual e separação semântica. |
| `unidades_escolares.ativo` | `20260427000200_unidades_escolares.sql` | Sim | Altera modelo de exclusão/visibilidade. |
| `unidades_escolares.source_payload` | `20260427000200_unidades_escolares.sql` | Sim | Precisa política de retenção/auditoria. |
| `execucao_financeira` | `20260427000300_execucao_financeira.sql` | Sim | Requer dados financeiros separados e importador coerente. |
| `import_logs.exercicio/programa` | `20260427000400_import_logs.sql` | Sim | Diverge da tabela atual. |
| `document_types` | `20260427000500_document_types_documentos_gerados.sql` | Sim, mas não para motor real ainda | Requer cuidado com templates oficiais. |
| `documentos_gerados` | `20260427000500_document_types_documentos_gerados.sql` | Sim, como status mínimo | Não iniciar motor documental real. |
| `vw_unidades_escolares_frontend` | `20260427000600_views_frontend_status.sql` | Sim, após tabelas base | Depende do importador criar `execucao_financeira` para toda unidade ativa. |
| `vw_unidades_status` | `20260427000600_views_frontend_status.sql` | Sim, após tabelas base | Depende de regras de status aprovadas. |
| `scripts/import_base_xlsx.py` | `scripts/import_base_xlsx.py` | Sim, após schema local coerente | Escreve em `unidades_escolares`, `execucao_financeira` e `import_logs`; precisa ambiente local. |

## 7. Objetos Ausentes No Contrato Atual

Ausentes na branch limpa:

- `profiles`;
- `execucao_financeira`;
- `document_types`;
- `documentos_gerados`;
- `vw_unidades_escolares_frontend`;
- `vw_unidades_status`;
- papel `diretor` no enum `app_role`;
- `nome`, `ativo` e `source_payload` no formato semântico de `unidades_escolares`;
- `exercicio` e `programa` em `import_logs`;
- script oficial `scripts/import_base_xlsx.py`.

## 8. Quais Types Antigos Parecem Aproveitáveis?

O `types.ts` legado corresponde ao conjunto de 6 migrations legadas e contém:

- tabelas `profiles`, `execucao_financeira`, `document_types`, `documentos_gerados`;
- views `vw_unidades_escolares_frontend` e `vw_unidades_status`;
- enum `app_role` com `diretor`;
- `import_logs` com `exercicio` e `programa`;
- `unidades_escolares` cadastral pura, com `nome`, `ativo` e `source_payload`.

Ele é tecnicamente útil como referência, mas não deve ser copiado agora porque a branch limpa não possui as migrations correspondentes aplicáveis sem conflito.

## 9. Risco De Trazer Types Sem Migrations Correspondentes

Alto.

Copiar `types.ts` legado para a branch limpa permitiria compilar consultas contra objetos que não existem nas migrations atuais. Isso mascararia o bloqueio real e poderia levar a falhas em runtime no Preview ou no Supabase local.

## 10. Risco De Trazer Migrations Sem Validar Localmente

Alto.

As migrations legadas foram validadas localmente na branch antiga, mas não são incrementais sobre as migrations atuais da branch limpa. Copiá-las diretamente criaria conflitos como:

- `CREATE TYPE public.app_role` quando o enum já existe;
- `CREATE TABLE public.user_roles` quando a tabela já existe;
- `CREATE TABLE public.unidades_escolares` quando a tabela já existe com outra forma;
- divergência de assinatura de `has_role`;
- divergência de policies/RLS;
- divergência do contrato de `import_logs`.

## 11. O Que Pode Ser Feito Agora Sem Supabase Remoto?

Seguro agora:

- manter a documentação de contrato;
- decidir estratégia de schema local;
- em etapa futura, aplicar somente localmente uma linha coerente de migrations;
- rodar `supabase db reset --local` após a decisão;
- regenerar `types.ts` via Supabase CLI local;
- validar `npx tsc --noEmit`, lint, tests e build.

Não seguro agora:

- adaptar Dashboard;
- copiar `types.ts` legado isoladamente;
- copiar migrations legadas sobre a linha atual sem decisão;
- fazer `db push`;
- tocar em Vercel Production.

## 12. O Que Exige Decisão Humana/Cursor

- Se a branch limpa deve substituir a linha de migrations atual pelo conjunto semântico legado.
- Se a linha atual deve receber migrations incrementais de transformação em vez de restauração do conjunto legado.
- Como tratar `app_role.diretor`.
- Como tratar RLS de `profiles`, `user_roles`, `import_logs`, documentos e views.
- Se `document_types`/`documentos_gerados` entram agora apenas como status mínimo ou ficam para bloco posterior.
- Como preservar/rotacionar qualquer segredo previamente versionado em outros estados históricos.
- Qual política oficial de importação da BASE será usada no PR3B clean.

## 13. Recomendação

Não copiar migrations nem `types.ts` nesta sessão.

Recomendação técnica:

1. abrir um bloco específico de schema local, ainda na branch `feature/pr3b-clean-semantic-schema` ou em sub-branch curta;
2. decidir se a estratégia será:
   - **restauração coerente do conjunto semântico legado**: substituir a linha de migrations da branch limpa por uma linha equivalente às 6 migrations legadas, validando tudo localmente; ou
   - **migração incremental de transformação**: manter as migrations atuais e criar migrations novas para transformar o schema atual em semântico;
3. para PR3B clean, a restauração coerente parece mais simples tecnicamente, mas mexe em migration history e precisa decisão humana/Cursor;
4. após decisão, rodar validação local completa com Supabase CLI, regenerar `types.ts`, e só então desbloquear Dashboard.

## 14. Próximo Passo Seguro Para Desbloquear Telas

Sequência recomendada:

1. decisão humana/Cursor sobre estratégia de schema;
2. bloco técnico de schema local sem Supabase remoto;
3. `supabase db reset --local`;
4. validação SQL de objetos, RLS e views;
5. typegen local;
6. commit separado de migrations/types;
7. retomar Dashboard;
8. retomar Base/ImportResultsPanel conforme `import_logs` final;
9. só depois planejar `Escolas.tsx` com validação visual dedicada.

## 15. Conclusão

O bloqueio do Dashboard é real e correto.

A branch limpa contém apenas um schema intermediário com financeiro inline em `unidades_escolares`. A branch legada contém o contrato semântico completo e documentadamente validado em Supabase local, mas esse conjunto não pode ser copiado diretamente porque conflita com a linha de migrations atual.

O próximo avanço precisa ser uma decisão de contrato/schema antes de qualquer nova tela.
