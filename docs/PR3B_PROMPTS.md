# Prompts para o PR 3B — Adaptação do Frontend ao Schema Semântico v2.2.1

Documento de instruções para execução do PR 3B com Claude Code como ferramenta líder.

Compatível com:

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/MIGRATION_PLAN_FINAL.md`
- `docs/DATA_SEMANTIC_CONTRACT.md`
- `docs/SCHEMA_MAPPING.md`
- `docs/DECISIONS_LOG.md`
- `docs/PR2_EXECUTION_REPORT.md`
- `docs/PR3A_LOCAL_DB_VALIDATION_REPORT.md`

> **Estado deste documento.** Esta é a versão consolidada após comparação entre as versões de auditoria e a revisão final do Wilson. Não executar todos os sub-prompts de uma vez. Cada sub-prompt deve ser autorizado individualmente por Wilson, executado em commit próprio e validado antes da etapa seguinte.

---

## Prompt-mestre do PR 3B

```txt
Você é Claude Code operando neste repositório como ferramenta líder do PR 3B, conforme política definida em AGENTS.md.

Projeto: PDDE Online 2026 — sistema interno da 4ª Coordenadoria Regional de Educação da SME-RJ.

Objetivo geral do PR 3B:
Adaptar o frontend ao schema semântico Supabase v2.2.1, já validado localmente no PR 3A, preservando tanto quanto possível o layout, a estética, a hierarquia visual e a organização de telas do protótipo Lovable.

REGRA DE PRESERVAÇÃO VISUAL:
O PR 3B NÃO é um redesign. A tarefa é corrigir fontes de dados, tipos, consultas, gravações, semântica dos rótulos, mocks e estados operacionais, mantendo o padrão visual existente sempre que possível.

Preservar:
- cards;
- grids;
- badges;
- hero sections;
- filtros;
- espaçamentos;
- tipografia;
- organização geral das telas;
- fluxo Dashboard → Escolas → EscolaEditar → Base → PortalDiretor.

Alterar visualmente apenas quando necessário para corrigir semântica ou transparência institucional, por exemplo:
- `nome` como rótulo principal;
- `designacao` como código administrativo secundário em fonte mono;
- estados vazios no lugar de mocks;
- upload desabilitado em /base;
- faixas explícitas de wireframe no PortalDiretor.

Não redesenhar telas do zero.
Não trocar componentes visuais sem necessidade.
Não alterar identidade visual macro.
Qualquer alteração visual que não seja estritamente necessária para refletir o novo schema, remover mocks ou esclarecer estados institucionais deve ser evitada. Em caso de dúvida, preservar o componente visual existente.

BRANCH:
Antes de executar qualquer sub-prompt, criar branch própria a partir da main atualizada:

feature/pr3b-frontend-semantic-schema

Não trabalhar diretamente na main.
Cada sub-prompt deve gerar commit próprio.
Não fazer merge sem autorização expressa de Wilson.

ANTES DE COMEÇAR, leia integralmente:
- AGENTS.md
- docs/PROJECT_STATE.md
- docs/MIGRATION_PLAN_FINAL.md
- docs/DATA_SEMANTIC_CONTRACT.md
- docs/SCHEMA_MAPPING.md
- docs/DECISIONS_LOG.md
- docs/PR2_EXECUTION_REPORT.md
- docs/PR3A_LOCAL_DB_VALIDATION_REPORT.md
- src/integrations/supabase/types.ts
- src/hooks/useExercicio.tsx
- src/pages/Dashboard.tsx
- src/pages/Escolas.tsx
- src/pages/EscolaEditar.tsx
- src/pages/Base.tsx
- src/components/ImportResultsPanel.tsx
- src/components/BaseUploadZone.tsx
- src/components/DocumentsPanel.tsx
- src/pages/PortalDiretor.tsx
- src/lib/baseImporter.ts
- src/lib/mockEscolas.ts, se existir
- supabase/migrations/20260427000200_unidades_escolares.sql
- supabase/migrations/20260427000300_execucao_financeira.sql
- supabase/migrations/20260427000500_document_types_documentos_gerados.sql
- supabase/migrations/20260427000600_views_frontend_status.sql

CONTEXTO TÉCNICO CONSOLIDADO:
1. O PR 2 criou o schema semântico correto.
   `unidades_escolares` possui `designacao` e `nome` separados.
   `designacao` é código administrativo, exemplo: 04.10.001.
   `nome` é o rótulo humano da unidade escolar.

2. Campos financeiros não pertencem mais a `unidades_escolares`.
   Campos como `reprogramado_custeio`, `parcela_1_custeio`, `recebido`,
   `saldo_anterior`, `gasto` e `saldo_estimado` pertencem a
   `execucao_financeira` ou são derivados na view.

3. A tabela `execucao_financeira` é chaveada por:
   unidade_id + exercicio + programa.

4. A view `vw_unidades_escolares_frontend` é a camada de leitura para telas:
   - Dashboard;
   - listagem;
   - busca;
   - detalhe visual.

   Ela expõe:
   - id;
   - designacao;
   - nome;
   - unidade_label;
   - dados cadastrais;
   - exercicio;
   - programa;
   - reprogramados;
   - parcelas;
   - saldo_anterior;
   - recebido;
   - gasto;
   - saldo_estimado.

5. A view `vw_unidades_status` é estritamente de leitura e calcula:
   pronta | incompleta | pendente.

6. A tabela `document_types` possui seed inicial com 6 tipos documentais.
   A tabela `documentos_gerados` está vazia até o motor documental real.

7. `src/lib/baseImporter.ts` é resíduo do fluxo Lovable e já está marcado como deprecated.
   O importador oficial é:
   scripts/import_base_xlsx.py

8. O PR 3A regenerou `types.ts`.
   Confie nos tipos atuais. Eles refletem a verdade do schema validado localmente.

REGRA CENTRAL — LEITURA E ESCRITA:
- Listagens, dashboard, busca e visualização de detalhe consomem `vw_unidades_escolares_frontend`.
- Status consome `vw_unidades_status`.
- Escrita cadastral grava em `unidades_escolares`.
- Escrita financeira grava em `execucao_financeira`.
- Não fazer insert/update/delete em views.
- Não tentar gravar campos financeiros em `unidades_escolares`.

REGRA DE IDENTIDADE:
- `nome` é sempre o rótulo principal.
- `designacao` é sempre metadado/código administrativo secundário.
- `designacao` deve aparecer em fonte mono ou texto menor.
- `unidade_label` é auxiliar, nunca fonte de verdade nem rótulo principal.

REGRA DE EXERCÍCIO:
- Toda leitura dependente de exercício deve filtrar por `exercicio`.
- Quando aplicável, filtrar também por `programa`.
- O programa padrão do PR 3B é `"basico"`.
- O hook `useExercicio()` deve persistir a escolha em `localStorage`.
- Se React Query for usado, `exercicio`, `programa`, busca, status e id devem entrar na `queryKey`.
- Se a tela ainda usa `useState/useEffect`, não introduzir React Query apenas por causa deste PR; mas garantir que `exercicio` esteja nas dependências do efeito.

REGRA DE VALIDAÇÃO FUNCIONAL:
- Validação funcional do PR 3B ocorre contra Supabase local ativo, com schema v2.2.1.
- Preview Vercel apontando para o Supabase/Lovable antigo não conta como validação funcional.
- Preview antigo pode servir apenas para build/visual superficial.
- Ainda não houve `supabase db push` remoto nem cutover de variáveis Vercel.

PROIBIÇÕES ABSOLUTAS:
- Não rodar `supabase db push`.
- Não alterar Vercel.
- Não fazer cutover.
- Não mexer em Production.
- Não alterar migrations.
- Não alterar RLS.
- Não alterar schema.
- Não alterar `useAuth`.
- Não alterar arquitetura de `AppLayout`, `BrandMark`, `ProtectedRoute`, `ErrorBoundary`, `TopLoadingBar` ou `CommandPalette`.
- Não reintroduzir `designacao = "04.10.001 — NOME"`.
- Não usar `src/lib/baseImporter.ts` como importador oficial.
- Não implementar RPC/transação atômica neste PR.
- Não implementar motor documental completo neste PR.

REGRA DE BLOQUEIO:
Se qualquer sub-prompt exigir mudar schema, RLS, autenticação, regra financeira, regra documental, motor documental ou infraestrutura de backend, pare imediatamente, registre o bloqueio e devolva a decisão para Wilson.

GATES OBRIGATÓRIOS APÓS CADA SUB-PROMPT:
- npx tsc --noEmit
- npm run build
- npm run lint, se disponível no projeto
- validação manual da tela alterada contra Supabase local, quando aplicável
- mensagem final com:
  - arquivos alterados;
  - mocks/remanescentes removidos;
  - query/fonte de dados nova;
  - validações executadas;
  - riscos residuais.

NÃO execute todos os sub-prompts de uma vez.
Execute somente o sub-prompt autorizado por Wilson.
```

---

## Sub-prompt 3B.0 — Preflight local e dados de teste

```txt
TAREFA:
Preparar ambiente local de validação do PR 3B.

Objetivo:
Garantir que o Supabase local está ativo, o schema v2.2.1 está aplicado e há dados suficientes para validar visualmente as telas adaptadas.

Escopo:
- Não alterar frontend.
- Não alterar migrations.
- Não fazer db push remoto.
- Não commitar planilha real.
- Não commitar segredos.
- Não trabalhar em main; usar a branch feature/pr3b-frontend-semantic-schema.

Passos:

1. Confirmar branch:
   git branch --show-current

   Deve ser:
   feature/pr3b-frontend-semantic-schema

2. Verificar Supabase local:
   supabase status

   Se não estiver ativo:
   supabase start

3. Confirmar migrations locais:
   supabase migration list --local

   Confirmar presença das seis migrations:
   20260427000100
   20260427000200
   20260427000300
   20260427000400
   20260427000500
   20260427000600

   Se não estiverem aplicadas:
   supabase db reset --local

4. Verificar contagens no banco local:
   SELECT count(*) FROM public.unidades_escolares WHERE ativo = true;
   SELECT count(*) FROM public.execucao_financeira;
   SELECT count(*) FROM public.vw_unidades_escolares_frontend
   WHERE exercicio = 2026 AND programa = 'basico';

5. Estratégia de dados locais:

   Opção A — preferencial:
   Confirmar com Wilson o caminho exato da planilha BASE/demonstrativo real.
   Não presumir nome fixo do arquivo.

   PowerShell:
   $env:DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
   python scripts/import_base_xlsx.py "CAMINHO_DA_PLANILHA.xlsx"
   python scripts/import_base_xlsx.py "CAMINHO_DA_PLANILHA.xlsx" --apply

   Bash/WSL/Git Bash:
   DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
   python scripts/import_base_xlsx.py "CAMINHO_DA_PLANILHA.xlsx" --apply

   Opção B — fallback:
   Se a planilha real não estiver acessível, não sobrescrever `supabase/seed.sql` sem autorização.
   Criar, se necessário, `supabase/seed.pr3b.local.sql` com dados sintéticos, fictícios e sem dados reais da SME-RJ.
   O arquivo deve conter 5 escolas fictícias, cada uma com linha correspondente em `execucao_financeira`.
   Não commitar dados reais.

6. Validar a view:
   A contagem de `vw_unidades_escolares_frontend` para 2026/basico deve ser igual à contagem de `execucao_financeira` para 2026/basico.

7. Criar:
   docs/PR3B_LOCAL_TESTING.md

O relatório deve registrar:
- comandos executados;
- se Supabase local estava ativo;
- se foi necessário reset;
- se houve seed/importação;
- contagem de unidades;
- contagem de execucao_financeira;
- contagem da view;
- caminho de validação adotado;
- se a validação visual terá dados reais ou apenas estado vazio/sintético.

Critérios de aceite:
- Supabase local ativo.
- Schema aplicado.
- View retorna dados se houver seed/importação.
- docs/PR3B_LOCAL_TESTING.md criado.
- Nenhuma tela alterada.

Commit:
docs(pr3b): document local Supabase testing procedure for PR 3B
```

---

## Sub-prompt 3B.1 — Base técnica: `useExercicio`, formatters e query keys

```txt
TAREFA:
Implementar persistência de exercício em localStorage e criar helpers compartilhados.

Arquivos:
- src/hooks/useExercicio.tsx
- src/lib/formatters.ts
- src/lib/queryKeys.ts
- opcionalmente src/lib/pddeTypes.ts

Escopo:
- Não refatorar telas ainda.
- Não alterar AppLayout.
- Não alterar arquitetura do contexto.
- Manter assinatura de `useExercicio()` compatível.

1. Atualizar `useExercicio.tsx`:

Implementar:
- STORAGE_KEY = "pdde:exercicio";
- valores válidos: "2025" e "2026";
- leitura segura de localStorage no inicializador funcional;
- fallback para "2026";
- escrita no localStorage quando o exercício mudar;
- try/catch para ambientes sem localStorage.

Não mudar a forma do contexto:
useExercicio() continua retornando `{ exercicio, setExercicio }`.

2. Criar `src/lib/formatters.ts` com:
- fmtBRL;
- fmtBRLCompacto;
- fmtData;
- helper seguro para número nullable, se necessário.

3. Criar `src/lib/queryKeys.ts` com convenções:
- unidades(exercicio, programa, filtros opcionais);
- status(exercicio, programa);
- documentosCount(exercicio, programa);
- dashboard(exercicio, programa);
- escola(id, exercicio, programa).

Não é obrigatório migrar telas para React Query neste PR. O arquivo é convenção para evitar divergência futura.

4. Criar tipos auxiliares derivados do typegen, preferencialmente:

import type { Database } from "@/integrations/supabase/types";

export type UnidadeFrontend =
  Database["public"]["Views"]["vw_unidades_escolares_frontend"]["Row"];

export type UnidadeStatus =
  Database["public"]["Views"]["vw_unidades_status"]["Row"];

export type DocumentoGerado =
  Database["public"]["Tables"]["documentos_gerados"]["Row"];

export type DocumentType =
  Database["public"]["Tables"]["document_types"]["Row"];

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- Exercício selecionado persiste após F5.
- localStorage contém "pdde:exercicio".
- Nenhuma tela grande alterada.

Commit:
feat(infra): persist useExercicio in localStorage and add PR3B helpers
```

---

## Sub-prompt 3B.2 — Dashboard

```txt
TAREFA:
Adaptar `src/pages/Dashboard.tsx` ao schema semântico v2.2.1.

Escopo:
- Preservar layout do Dashboard.
- Não redesenhar cards, hero ou seções.
- Corrigir apenas fonte de dados, rótulos e mocks.

1. Importar `useExercicio`.

2. Trocar leitura:
De:
from("unidades_escolares")

Para:
from("vw_unidades_escolares_frontend")

Selecionar:
id, designacao, nome, updated_at, recebido, gasto, saldo_anterior, saldo_estimado, exercicio, programa

Filtrar:
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")

Reexecutar quando `exercicio` mudar.

3. Tipo `Recente`:
Adicionar `nome`.

4. Lista “Atualizadas recentemente”:
- rótulo principal: `r.nome`;
- código secundário: `r.designacao`;
- `designacao` em `font-mono text-xs text-muted-foreground`.

5. KPIs:
Usar campos da view:
- recebido;
- saldo_anterior;
- gasto;
- saldo_estimado, se necessário.

Não pedir esses campos diretamente a `unidades_escolares`.

6. Remover SPARK_* mocks:
- Remover SPARK_RECEBIDO, SPARK_GASTO, SPARK_UNIDADES, SPARK_DOCS.
- Criar `SPARK_EMPTY: number[] = []`.
- Usar estado vazio honesto.

Se `MiniSparkline` quebrar com array vazio, ajustar `MiniSparkline` para renderizar placeholder “—” sem alterar estética macro.

7. Card “Demonstrativos gerados”:
Consultar `documentos_gerados`:

select("id", { count: "exact", head: true })
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")
.eq("status", "gerado")

Fallback: 0.
Texto quando zero: “Aguardando primeira geração”.

Observação:
`status` em documentos_gerados é text/default "pendente". Usar "gerado" por ora; se houver outro vocabulário já usado no repositório, parar e pedir decisão.

8. Substituir formatadores locais por `@/lib/formatters`, se seguro e sem alterar visual.

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- Dashboard carrega contra Supabase local.
- Nome aparece como principal nas recentes.
- Designação aparece como secundária.
- Trocar exercício refaz a consulta.
- Nenhum campo financeiro é lido de `unidades_escolares`.
- SPARK mocks removidos.

Commit:
feat(dashboard): consume frontend view and replace dashboard mocks with honest empty states
```

---

## Sub-prompt 3B.3 — Escolas

```txt
TAREFA:
Adaptar `src/pages/Escolas.tsx` ao schema semântico v2.2.1.

Escopo:
- Preservar layout, tabela, chips, filtros e padrão visual.
- Corrigir fonte de dados e semântica dos rótulos.
- Remover helpers sintéticos.

1. Tipo:
Usar tipo derivado do typegen, preferencialmente:
UnidadeFrontend =
Database["public"]["Views"]["vw_unidades_escolares_frontend"]["Row"]

Evitar tipo manual longo, salvo motivo técnico documentado.

2. Query principal:
from("vw_unidades_escolares_frontend")
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")
.order("nome")

3. Status:
Remover cálculo local `getStatus`.
Consultar:
from("vw_unidades_status")
.select("unidade_id, status")
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")

Criar Map<unidade_id, status>.
Fallback: "pendente".

4. Programa:
Remover `getPrograma`.
Usar `e.programa`.

Os chips/filtros de programa devem usar dados reais.
Se qualidade/equidade aparecerem com 0, manter. Isso é a verdade do seed atual.

5. Documentos:
Remover `getDocMeta` sintético.
Consultar `documentos_gerados`:

from("documentos_gerados")
.select("unidade_id")
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")
.eq("status", "gerado")

Reduzir localmente em Map<unidade_id, number>.

Consultar `document_types` ativos:
select("id", { count: "exact", head: true })
.eq("is_active", true)

Total = count de tipos ativos; fallback 6.

Se existir outro vocabulário documental já usado no código, parar e pedir decisão.

6. Renderização da coluna da unidade:
Principal: `e.nome`.
Secundário: `e.designacao` em mono/pequeno.

Não usar `unidade_label` como principal.

7. Busca:
Buscar em:
- nome;
- designacao;
- inep;
- diretor;
- cnpj, se já houver busca por cnpj.

8. Toasts:
Mensagens humanas devem usar `e.nome`.
Código administrativo pode aparecer como detalhe secundário.

9. DocumentsPanel:
Passar:
- schoolName={selectedEscola?.nome ?? ""}
- designacao, unidade_id, exercicio, programa, se o componente aceitar ou puder ser adaptado sem redesenho.

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- /escolas lista nomes como principais.
- designacao aparece separada.
- programa vem do banco.
- status vem de vw_unidades_status.
- documentos mostram 0/6 ou contagem real.
- getPrograma removido.
- getDocMeta removido.
- getStatus local removido.
- Nenhum helper sintético baseado em id.

Commit:
feat(escolas): consume semantic views and remove synthetic status program and document helpers
```

---

## Sub-prompt 3B.4 — EscolaEditar

```txt
TAREFA:
Adaptar `src/pages/EscolaEditar.tsx` ao schema semântico v2.2.1.

Escopo:
- Preservar layout, seções, sticky save bar, scroll spy e estética.
- Corrigir leitura e escrita.
- Não implementar RPC neste PR.

1. Tipo:
Usar `UnidadeFrontend` derivado de `types.ts`.

2. Query inicial:
from("vw_unidades_escolares_frontend")
.eq("id", id!)
.eq("exercicio", Number(exercicio))
.eq("programa", "basico")
.maybeSingle()

3. Identidade visual:
Hero principal: `u.nome`.
Subtítulo/código: `u.designacao` em fonte mono.
Breadcrumb: usar `u.nome`.

4. Formulário de identificação:
Adicionar campo “Nome da unidade” antes de “Designação”.
Designação deve continuar visível como código administrativo.

5. Validação:
- `nome` obrigatório, mínimo 3 caracteres.
- `designacao` permanece obrigatório.
- Formato 04.XX.YYY pode ser warning, não bloqueio, salvo se já houver regra bloqueante anterior.

6. Escrita:
Não atualizar view.

Operação A — cadastrais em `unidades_escolares`:
- designacao;
- nome;
- inep;
- cnpj;
- diretor;
- email;
- endereco;
- agencia;
- conta_corrente;
- alunos;
- ativo, se já houver controle.

Operação B — financeiros em `execucao_financeira`:
Usar UPSERT, não update simples, para evitar update silencioso de zero linhas.

upsert:
{
  unidade_id: u.id,
  exercicio: Number(exercicio),
  programa: "basico",
  reprogramado_custeio,
  reprogramado_capital,
  parcela_1_custeio,
  parcela_1_capital,
  parcela_2_custeio,
  parcela_2_capital,
  gasto
}

onConflict:
"unidade_id,exercicio,programa"

7. Erro parcial:
Se operação A falhar:
- abortar;
- mostrar toast;
- não executar B.

Se operação A passar e B falhar:
- mostrar toast explícito:
  “Dados cadastrais salvos. Falha ao salvar dados financeiros: ...”
- registrar em comentário/relatório que atomicidade real exige RPC futura.

8. Dirty tracking:
Não comparar objeto da view inteiro se isso causar falso dirty.
Separar estado cadastral e financeiro, ou documentar simplificação segura.

9. DocumentsPanel:
Usar `u.nome` como schoolName.
Passar designacao/exercicio/programa se possível.

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- /escolas/:id abre contra Supabase local.
- Hero mostra nome.
- Designação aparece em mono.
- Nome vazio bloqueia salvar.
- Cadastral salva em unidades_escolares.
- Financeiro salva/upserta em execucao_financeira.
- Nenhum update em view.
- Nenhum campo financeiro gravado em unidades_escolares.

Commit:
feat(escola-editar): adapt detail editor to semantic schema and two-table save
```

---

## Sub-prompt 3B.5 — Base.tsx e ImportResultsPanel

```txt
TAREFA:
Converter `/base` em vitrine de status e histórico, removendo dependência operacional do importador antigo.

Escopo:
- `/base` não executa mais carga oficial pelo navegador.
- Importação oficial é via `scripts/import_base_xlsx.py`.
- Preservar layout visual da tela, mas tornar estados honestos.

Arquivos:
- src/pages/Base.tsx
- src/components/BaseUploadZone.tsx
- src/components/ImportResultsPanel.tsx

1. Base.tsx:
Remover imports e usos de:
- parseBaseXlsx;
- importParsedRows;
- ParseResult;
- ImportResult;
- qualquer export de `@/lib/baseImporter`.

Substituir chamadas por toast informativo:
“Importação oficial via terminal. Veja docs/PR3B_LOCAL_TESTING.md.”

2. Histórico:
Atualizar tipo ImportRow para incluir:
- exercicio;
- programa;
- errors, se exibido;
- total_rows;
- inserted_rows;
- updated_rows;
- skipped_rows.

3. Última importação:
Selecionar:
id,
created_at,
filename,
status,
exercicio,
programa,
total_rows,
inserted_rows,
updated_rows,
skipped_rows,
errors

Renderizar real quando existir.
Se não existir:
“Nenhuma importação registrada.”

4. Histórico:
Adicionar coluna Exercício.
Se programa for exibido, usar badge discreta.

5. BaseUploadZone:
Adicionar prop:
disabled?: boolean

Quando disabled=true:
- bloquear click;
- bloquear teclado;
- bloquear drag/drop;
- bloquear input file;
- aria-disabled=true;
- tabIndex=-1;
- cursor-not-allowed;
- opacity 70%;
- overlay institucional com texto:

“Importação oficial executada via script auditado pelo time da CRE.
Esta área aceita arquivos para validação visual apenas
(preview offline, sem gravação no banco).”

No PR 3B, passar disabled={true}.

6. Botão Confirmar e enviar:
Deve ficar desabilitado quando upload estiver disabled.
Não abrir fluxo de importação real.

7. Exportar BASE:
Manter visual.
Botão deve apenas mostrar:
“Em breve: exportação consolidada de unidades + execução financeira (.xlsx).”

8. ImportResultsPanel:
Remover:
- MOCK_SUMMARY;
- MOCK_ERRORS;
- qualquer fallback mockado.

Se summary ausente:
renderizar empty state real:
“Nenhuma importação para exibir.”
“Use o script oficial para importar a BASE.”

Se errors ausente ou vazio:
não exibir tabela de erros.

Se houver errors reais do import_logs:
renderizar.

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- /base abre.
- Nenhuma referência operacional a baseImporter em Base.tsx.
- BaseUploadZone realmente desabilita interação.
- ImportResultsPanel não mostra dados falsos.
- Histórico usa import_logs real.
- Nenhuma chave service_role no frontend.

Commit:
feat(base): convert base page to import status history and remove mocked import fallback
```

---

## Sub-prompt 3B.6 — PortalDiretor e remoção final de arquivos deprecated

```txt
TAREFA:
Adaptar PortalDiretor à regra de identidade e remover arquivos deprecated.

Arquivos:
- src/pages/PortalDiretor.tsx
- src/lib/baseImporter.ts
- src/lib/mockEscolas.ts
- src/components/DocumentsPanel.tsx, se necessário
- docs/MIGRATION_PLAN_FINAL.md
- docs/PROJECT_STATE.md
- docs/UI_CHANGELOG.md

1. PortalDiretor:
Manter como wireframe conceitual.
Não implementar vínculo real diretor-escola.

Mock ESCOLA deve ter:
- id;
- nome;
- designacao;
- inep;
- diretor;
- alunos;
- saldo_anterior;
- recebido;
- gasto.

Hero:
- principal: nome;
- secundário: designacao em mono.

2. Faixa de wireframe:
Adicionar aviso visual claro:
“Os dados deste portal são exemplos conceituais. O vínculo diretor-escola será implementado no Marco 13.”

3. Documentos do Portal:
Manter mock, mas todos os documentos devem ficar como “pendente”.
Não exibir demonstrativo como gerado/verde.
Adicionar legenda:
“A geração de documentos será habilitada no Marco 11.”

4. Remover src/lib/baseImporter.ts:
Antes:
grep -r "baseImporter" src/
grep -r "parseBaseXlsx\|importParsedRows" src/

Se houver ocorrência:
parar e registrar bloqueio.

Se não houver:
deletar arquivo.

5. Remover src/lib/mockEscolas.ts:
Antes:
grep -r "mockEscolas" src/

Se houver ocorrência:
parar e registrar bloqueio.

Se não houver:
deletar arquivo.

6. ImportResultsPanel:
Confirmar que não há:
- MOCK_SUMMARY;
- MOCK_ERRORS.

7. Atualizar docs/MIGRATION_PLAN_FINAL.md:
Adicionar seção “Estado pós-PR 3B”:
- Frontend adaptado ao schema semântico v2.2.1.
- Importação oficial via scripts/import_base_xlsx.py.
- baseImporter.ts removido.
- mockEscolas.ts removido, se aplicável.
- Próxima etapa: Supabase remoto próprio.

8. Atualizar docs/PROJECT_STATE.md:
Marcar PR 3B como concluído.
Registrar:
- frontend adaptado;
- Supabase remoto ainda não aplicado;
- próximo passo: trilho backend remoto.

9. Atualizar docs/UI_CHANGELOG.md:
Registrar:
- nome como rótulo principal;
- designacao como secundário em mono;
- SPARK mocks removidos;
- /base como status/histórico;
- upload browser desabilitado;
- PortalDiretor como wireframe explícito;
- documentos sem falso “gerado”;
- useExercicio persistente em localStorage.

Critérios de aceite:
- npx tsc --noEmit passa.
- npm run build passa.
- npm run lint sem warnings novos, se disponível.
- grep não encontra baseImporter em src/.
- grep não encontra mockEscolas em src/.
- grep não encontra MOCK_SUMMARY/MOCK_ERRORS.
- grep não encontra getDocMeta/getPrograma.
- PortalDiretor mostra nome como principal e designacao secundária.
- Documentação final atualizada.

Commit:
feat(diretor): adapt portal wireframe and remove deprecated Lovable-era mocks
```

---

## Encerramento do PR 3B

```txt
Após concluir 3B.6, criar:

docs/PR3B_EXECUTION_REPORT.md

O relatório deve conter:
- branch;
- commits;
- arquivos alterados;
- telas adaptadas;
- queries antigas removidas;
- views usadas;
- tabelas-base usadas para escrita;
- mocks removidos;
- mocks remanescentes justificados;
- resultado de npx tsc --noEmit;
- resultado de npm run build;
- resultado de npm run lint;
- validação manual em Supabase local;
- riscos residuais;
- itens para PR 4 / Marco 14.

NÃO fazer:
- supabase db push;
- Vercel Production;
- cutover;
- RPC;
- motor documental completo.

Estado esperado ao final:
- Frontend adaptado ao schema semântico v2.2.1.
- Supabase remoto ainda não aplicado.
- Próxima etapa macro: configuração guiada do Supabase próprio remoto.
```
