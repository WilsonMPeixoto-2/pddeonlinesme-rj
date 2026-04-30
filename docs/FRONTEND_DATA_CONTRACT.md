# FRONTEND DATA CONTRACT — PDDE Online 2026

Data: 2026-04-30
Branch: `feature/pr3b-clean-semantic-schema`

## 1. Finalidade

Este documento define o contrato de dados necessário para continuar a reconstrução limpa do PR3B no frontend semântico, sem depender de estado local antigo, Lovable ou merge direto da branch legada.

O objetivo imediato é separar o que já existe na branch limpa, o que existe apenas na branch legada `feature/pr3b-frontend-semantic-schema`, e o que ainda depende de decisão humana/arquitetural antes de qualquer migration ou adaptação de tela.

## 2. Escopo Desta Versão

Esta versão é descritiva e verificável. Ela não aplica migrations, não altera `types.ts`, não altera telas e não toca em Supabase remoto.

Fonte analisada:

- branch limpa `feature/pr3b-clean-semantic-schema`;
- branch legada `feature/pr3b-frontend-semantic-schema`, somente via comandos de leitura;
- migrations versionadas;
- `src/integrations/supabase/types.ts`;
- telas autorizadas apenas para análise de dependências.

## 3. Telas Cobertas

| Tela/componente | Estado nesta versão | Observação |
|---|---|---|
| `Dashboard.tsx` | Bloqueado para adaptação semântica | Precisa de `vw_unidades_escolares_frontend` e `documentos_gerados`. |
| `Base.tsx` | Parcialmente reconciliada | Hoje lê `import_logs` da branch limpa, sem `exercicio`/`programa` no tipo atual. |
| `ImportResultsPanel.tsx` | Parcialmente reconciliado | Exibe resumo real quando fornecido; não deve usar mock. |
| `EscolaEditar.tsx` | Bloqueado para adaptação semântica | Precisa ler via view e escrever separadamente em `unidades_escolares` e `execucao_financeira`. |
| `Escolas.tsx` | Congelada para bloco posterior | Não deve ser alterada até validação visual dedicada. |
| `PortalDiretor.tsx` | Fora do escopo operacional atual | Na branch legada ainda é wireframe com dados mockados. |

## 4. Objetos De Banco Esperados

| Objeto | Tipo | Existe na branch limpa? | Existe na branch legada? | Uso esperado |
|---|---|---:|---:|---|
| `public.unidades_escolares` | tabela | Sim | Sim | Cadastro cadastral da escola. |
| `public.execucao_financeira` | tabela | Não | Sim | Execução por unidade, exercício e programa. |
| `public.import_logs` | tabela | Sim | Sim | Histórico auditável da importação da BASE. |
| `public.document_types` | tabela | Não | Sim | Catálogo versionado de documentos. |
| `public.documentos_gerados` | tabela | Não | Sim | Status/contagem de documentos por unidade. |
| `public.profiles` | tabela | Não | Sim | Perfil mínimo vinculado ao usuário Supabase Auth. |
| `public.user_roles` | tabela | Sim | Sim | Papéis de usuário. |
| `public.app_role` | enum | Sim, `admin`/`operador` | Sim, `admin`/`operador`/`diretor` | RBAC. |
| `public.has_role` | função | Sim, assinatura atual difere da legada | Sim | Verificação de papel em policies. |
| `public.set_updated_at` | função | Sim | Sim | Trigger de `updated_at`. |

## 5. Views Esperadas

| View | Existe na branch limpa? | Existe na branch legada? | Função |
|---|---:|---:|---|
| `public.vw_unidades_escolares_frontend` | Não | Sim | Leitura consolidada para telas do frontend, juntando escola e execução financeira. |
| `public.vw_unidades_status` | Não | Sim | Status operacional por unidade, exercício e programa. |

As views legadas foram criadas com `WITH (security_invoker = true)`, o que é requisito importante para não contornar RLS em Supabase/Postgres.

## 6. Campos Mínimos Por Tela

| Tela | Campos mínimos |
|---|---|
| Dashboard | `id`, `designacao`, `nome`, `updated_at`, `saldo_anterior`, `recebido`, `gasto`, `exercicio`, `programa`; contagem de `documentos_gerados` por status. |
| Base | `import_logs.id`, `filename`, `total_rows`, `inserted_rows`, `updated_rows`, `skipped_rows`, `status`, `created_at`, `errors`; idealmente `exercicio` e `programa`. |
| ImportResultsPanel | Recebe dados por props: total lidas, importadas, erros, duplicatas, arquivo e lista de erros. Não consulta banco. |
| EscolaEditar | Leitura: campos cadastrais + financeiros consolidados. Escrita: cadastrais em `unidades_escolares`; financeiros em `execucao_financeira`. |
| Escolas.tsx | Bloco posterior: precisa de `vw_unidades_escolares_frontend`, `vw_unidades_status`, `documentos_gerados` e `document_types`, sem reintroduzir virtualização. |

## 7. Campos De Leitura

### Branch limpa atual

- `unidades_escolares`: `id`, `designacao`, `inep`, `cnpj`, `diretor`, `email`, `alunos`, `saldo_anterior`, `recebido`, `gasto`, `endereco`, `agencia`, `conta_corrente`, parcelas e reprogramados.
- `import_logs`: `id`, `user_id`, `source`, `filename`, `total_rows`, `inserted_rows`, `updated_rows`, `skipped_rows`, `errors`, `status`, `created_at`.
- `user_roles`: `id`, `user_id`, `role`, `created_at`.

### Contrato semântico legado

- `unidades_escolares`: cadastral puro, incluindo `designacao`, `nome`, `ativo`, `source_payload`.
- `execucao_financeira`: financeiro por `unidade_id`, `exercicio`, `programa`.
- `vw_unidades_escolares_frontend`: leitura consolidada para frontend.
- `vw_unidades_status`: status por unidade/exercício/programa.
- `document_types` e `documentos_gerados`: catálogo e status de documentos.
- `import_logs`: inclui `exercicio` e `programa`.

## 8. Campos De Escrita

| Destino | Escrita permitida conceitualmente | Bloqueio atual |
|---|---|---|
| `unidades_escolares` | Dados cadastrais da escola. | Na branch limpa ainda mistura campos financeiros; no contrato semântico deveria ser cadastral puro. |
| `execucao_financeira` | Campos financeiros por exercício/programa. | Não existe na branch limpa. |
| `import_logs` | Registro auditável de importação feita por script. | Branch limpa não tem `exercicio`/`programa`; importação browser deve permanecer desativada operacionalmente. |
| `documentos_gerados` | Status de documentos gerados. | Não existe na branch limpa e motor documental real está fora do escopo. |
| Views | Nenhuma escrita direta. | Escrever em view é proibido para este fluxo. |

## 9. O Que É Mock, Placeholder Ou Dado Real

| Item | Classificação | Observação |
|---|---|---|
| Séries `SPARK_*` em `Dashboard.tsx` | Mock visual | Não representam dado real. |
| Contagem de demonstrativos no Dashboard atual | Placeholder | Valor fixo/indisponível na branch limpa. |
| `PortalDiretor.tsx` legado | Wireframe/mock | Não deve guiar schema de produção. |
| `ImportResultsPanel` atual | Real por props | Não deve criar fallback mockado. |
| `Base.tsx` atual | Leitura real parcial | Lê `import_logs` existente, mas sem contrato semântico completo. |
| `src/lib/baseImporter.ts` | Importador frontend legado | Deve ser removido somente após contrato semântico e telas não dependerem dele. |
| `scripts/import_base_xlsx.py` legado | Script oficial candidato | Existe apenas na branch antiga e foi validado localmente segundo documentação legada. |

## 10. O Que Está Bloqueado

- Adaptar Dashboard para `vw_unidades_escolares_frontend`.
- Contar documentos reais pelo Dashboard.
- Adaptar `EscolaEditar` para escrita separada.
- Adaptar `Escolas.tsx`.
- Remover `baseImporter.ts` e `mockEscolas.ts` com segurança.
- Copiar `types.ts` legado sem migrations correspondentes.
- Copiar migrations legadas sobre as migrations atuais sem decisão arquitetural.

## 11. O Que Pode Ser Implementado Sem Migration Nova

- Documentar o contrato e a reconciliação.
- Manter `Base.tsx` lendo o `import_logs` atual.
- Remover mocks visuais onde já houver fonte real clara.
- Ajustes puramente defensivos no frontend que não exijam novos campos, views ou tabelas.

Não é seguro implementar leitura semântica de Dashboard ou EscolaEditar sem resolver schema/types.

## 12. O Que Exige Migration Ou Revisão Humana

- Introduzir `execucao_financeira`.
- Separar dados cadastrais de dados financeiros.
- Introduzir `profiles` e papel `diretor`.
- Criar `document_types` e `documentos_gerados`.
- Criar `vw_unidades_escolares_frontend` e `vw_unidades_status`.
- Alterar RLS/policies ou assinatura de `has_role`.
- Trazer o script oficial de importação como fluxo operacional.
- Qualquer mudança que afete prestação de contas, regra financeira, Auth/RLS ou dados sensíveis.

## 13. Critérios Para Desbloquear Dashboard

Dashboard só deve avançar quando:

1. `vw_unidades_escolares_frontend` existir em migrations locais validadas;
2. `documentos_gerados` existir se a contagem real for reaplicada;
3. `types.ts` for regenerado a partir do schema local, ou copiado apenas se corresponder exatamente às migrations restauradas;
4. `npx tsc --noEmit`, lint, tests e build passarem;
5. não houver Supabase remoto, `db push` ou Production envolvidos.

## 14. Critérios Para Desbloquear Base

Base só deve avançar além do estado atual quando:

1. o contrato final de `import_logs` estiver definido;
2. estiver decidido se `exercicio` e `programa` entram em `import_logs`;
3. a importação browser permanecer desativada para carga oficial;
4. o script auditado for restaurado/validado localmente, se esse for o caminho aprovado.

## 15. Critérios Para Desbloquear ImportResultsPanel

`ImportResultsPanel` pode continuar como componente puro se:

1. não tiver mocks internos;
2. receber dados explícitos por props;
3. aceitar formato de erro documentado (`rowIndex`/`field`/`message` ou equivalente aprovado);
4. não consultar banco diretamente.

## 16. Critérios Para Desbloquear EscolaEditar

`EscolaEditar` só deve avançar quando:

1. a leitura via `vw_unidades_escolares_frontend` estiver tipada;
2. a escrita cadastral em `unidades_escolares` estiver separada da financeira;
3. `execucao_financeira` existir e tiver chave única `unidade_id/exercicio/programa`;
4. não houver escrita direta em view;
5. a ausência de linha financeira for tratada como bloqueio/erro operacional, não como gambiarra.

## 17. Critérios Para Desbloquear Escolas.tsx Em Bloco Posterior

`src/pages/Escolas.tsx` deve permanecer congelado até:

1. Dashboard, Base e ImportResultsPanel estarem coerentes com o contrato;
2. as views semânticas estarem disponíveis e tipadas;
3. `documentos_gerados`/`document_types` e status estarem definidos;
4. houver validação visual dedicada para preservar a tabela recuperada em produção;
5. não houver `VirtualizedSchoolsTable`, `@tanstack/react-virtual` ou `useVirtualizer`.

## 18. Riscos

- Copiar migrations legadas agora conflita com as migrations atuais, porque ambas criam/alteram `app_role`, `user_roles` e `unidades_escolares` com formatos diferentes.
- Copiar `types.ts` legado sem o schema correspondente geraria falsa segurança e permitiria código que não roda no banco local da branch limpa.
- Adaptar Dashboard contra views inexistentes exigiria casts ou strings fora do tipo, escondendo o bloqueio real.
- O contrato antigo foi validado localmente, mas a branch antiga divergiu da `main` recuperada; reaproveitamento precisa ser deliberado.
- Mudanças em RLS/Auth/papel `diretor` exigem revisão humana.

## 19. Próxima Ação Recomendada

Não adaptar novas telas ainda.

Próximo passo seguro:

1. decisão humana/Cursor sobre a estratégia de schema local;
2. preferencialmente criar um bloco específico para restaurar o conjunto semântico legado de migrations em branch limpa ou substituir as migrations atuais por uma linha coerente, com validação local por `supabase db reset --local`;
3. só depois regenerar `src/integrations/supabase/types.ts`;
4. então retomar Dashboard como primeira tela semântica.
