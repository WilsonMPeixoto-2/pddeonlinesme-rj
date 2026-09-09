# Evolução Financeira e Visual v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corrigir a página de Repasses, adaptar o Painel e a ficha da escola para os dados financeiros reais de 2026 e transformar resumos em caminhos operacionais clicáveis sem perder a identidade visual atual.

**Architecture:** O Supabase continua como fonte operacional. `repasses_financeiros` é a fonte canônica de repasses/pagamentos; `contas_bancarias` fornece as contas por programa; `execucao_financeira` permanece apenas como compatibilidade/execução legada. A interface consome consultas tipadas via TanStack Query e transforma dados em modelos de domínio em `financeiroPDDE.ts`, sem espalhar regras financeiras pelos componentes.

**Tech Stack:** React 19, TypeScript 6, Vite 8, TanStack Query 5, TanStack Table 9.2.4, Recharts 3, Supabase JS 2.116, Tailwind 4, Vitest 5, Playwright 1.63.

**Spec:** requisitos definidos na conversa do projeto PDDE Online em 09/09/2026 e evidências visuais das telas Painel, Repasses e ficha da escola.

## Global Constraints

- Repositório exclusivo: `WilsonMPeixoto-2/pddeonlinesme-rj`.
- Não misturar RADAR PDDE nem outros projetos.
- `null` significa desconhecido; nunca converter ausência em R$ 0,00 na interface nova.
- PDDE BÁSICO, PDDE QUALIDADE e PDDE EQUIDADE devem ser informação visual de primeiro nível.
- Metadados técnicos de importação, workflow, hash, parser ou BASE não aparecem no corpo operacional.
- Ações/programas, contas, parcelas, valores e datas são informação operacional e devem aparecer claramente.
- Uma escola pode ter múltiplas contas no mesmo programa.
- Comparações financeiras são descritivas, nunca ranking de mérito.
- Preservar os elementos visuais fortes do layout atual; referências externas servem apenas para padrões pontuais.
- Todos os cards-resumo acionáveis devem funcionar por teclado, ter foco visível e destino consistente.

---

### Task 1: Corrigir crash da página Repasses

**Files:**
- Modify: `src/pages/Repasses.tsx`
- Create: `src/test/repasses-table-v9.test.tsx`

**Interfaces:**
- Consumes: TanStack Table v9 `table.FlexRender`, cells e sorting.
- Produces: tabela de Repasses que renderiza cabeçalhos textuais, células e ordenação sem exceção.

- [x] **Step 1: Escrever teste de regressão**

Criar um harness com dados de repasse que renderiza a página real e exige cabeçalho `Ação` e tabela visível.

- [x] **Step 2: Executar o teste e confirmar RED**

O ciclo RED revelou sequencialmente três incompatibilidades v9 reais: `FlexRender` chamado como função, `getVisibleCells()` sem feature de visibilidade e estado/configuração de sorting no formato antigo.

- [x] **Step 3: Corrigir APIs TanStack Table v9**

Aplicado:

```tsx
<table.FlexRender header={header} />
<table.FlexRender cell={cell} />
```

A tabela usa `row.getAllCells()` porque não há feature de visibilidade e registra sorting no `tableFeatures`, com `initialState.sorting` como array v9.

- [ ] **Step 4: Executar teste, typecheck e build**

Run: `npm test -- src/test/repasses-table-v9.test.tsx && npm run typecheck && npm run build`
Expected: PASS.

- [ ] **Step 5: Publicar hotfix com gate verde**

Como `/repasses` está quebrada em produção, o hotfix deve ser integrado imediatamente após o CI integral verde, antes das mudanças visuais maiores.

### Task 2: Reorganizar o Painel para dados financeiros reais

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/lib/queryKeys.ts`
- Modify: `src/lib/financeiroPDDE.ts`
- Create: `src/test/dashboard-financeiro.test.ts`

**Interfaces:**
- Consumes: `repasses_financeiros`, `contas_bancarias`, exercício selecionado.
- Produces: resumo executivo com pagamentos identificados, valor programado, escolas, contas e detalhamento do recorte publicado.

- [ ] **Step 1: Escrever testes para agregações do Painel**

Cobrir total pago, total programado, quantidade de escolas, contas, primeira parcela/P1, custeio e capital conhecidos e preservação de `null`.

- [ ] **Step 2: Executar e confirmar RED**

Run: `npm test -- src/test/dashboard-financeiro.test.ts`
Expected: FAIL porque o agregador executivo ainda não existe.

- [ ] **Step 3: Criar agregador de domínio**

Adicionar em `financeiroPDDE.ts` uma função pura `buildDashboardFinanceiroOverview(repasses, contas, exercicio)` que retorne somente fatos derivados dos dados canônicos.

- [ ] **Step 4: Substituir a narrativa financeira antiga no topo do Dashboard**

Manter o hero visual atual, mas trocar a fonte e a nomenclatura. O destaque deve comunicar `Pagamentos identificados`/`Repasses 2026`, não `Disponibilidade inicial identificada na BASE`.

- [ ] **Step 5: Tornar cards-resumo clicáveis**

Destinos mínimos:
- Unidades escolares → `/escolas`
- Repasse da 1ª parcela → `/repasses`
- Valor programado → `/repasses`
- Contas bancárias → `/escolas` com caminho operacional para recursos por unidade

- [ ] **Step 6: Remover metadados técnicos do corpo visual**

Retirar menções a BASE/importação do hero e dos resumos financeiros. Manter importação somente na área administrativa própria.

- [ ] **Step 7: Validar**

Run: `npm test -- src/test/dashboard-financeiro.test.ts && npm run typecheck && npm run lint && npm run build`
Expected: PASS.

### Task 3: Ampliar a ficha cadastral da escola

**Files:**
- Modify: `src/pages/EscolaEditar.tsx`
- Modify: `src/pages/EscolaEditarComRecursos.tsx`
- Create: `src/components/escola/IdentificacaoInstitucional.tsx`

**Interfaces:**
- Consumes: cadastro atual de `unidades_escolares` e dados já disponíveis na ficha.
- Produces: bloco de identificação em grid responsivo de duas colunas no desktop e uma no mobile.

- [ ] **Step 1: Escrever teste de estrutura**

Garantir que designação/nome ocupem largura total e que INEP/CNPJ, responsáveis e contatos sejam apresentados como grupos reconhecíveis.

- [ ] **Step 2: Extrair bloco de identificação**

Criar `IdentificacaoInstitucional` sem alterar persistência nem regras de edição.

- [ ] **Step 3: Reorganizar o layout**

Usar duas colunas para campos curtos e largura total para designação, nome, diretor e endereço. Não inventar campos que o banco não possui.

- [ ] **Step 4: Validar acessibilidade e responsividade**

Run: `npm run typecheck && npm run lint && npm run build`
Expected: PASS.

### Task 4: Redesenhar Recursos PDDE por programa, ação e contas

**Files:**
- Modify: `src/pages/EscolaRecursos.tsx`
- Modify: `src/pages/EscolaEditarComRecursos.tsx`
- Modify: `src/lib/financeiroPDDE.ts`
- Modify: `src/components/RecursosPDDEPanel.tsx`
- Create: `src/test/recursos-pdde-domain.test.ts`

**Interfaces:**
- Consumes: `groupFinanceiroByProgram`, contas e repasses da unidade.
- Produces: hierarquia `programa → ação → parcela`, com todas as contas do programa preservadas.

- [ ] **Step 1: Testar múltiplas contas, programas sem repasse e null**

Garantir que:
- duas contas no mesmo programa aparecem;
- Equidade aparece quando houver conta mesmo sem repasse;
- valor desconhecido permanece `—`;
- primeira e segunda parcelas não são confundidas.

- [ ] **Step 2: Implementar apresentação por programa**

`RecursosPDDEPanel` deve destacar `PDDE BÁSICO`, `PDDE QUALIDADE`, `PDDE EQUIDADE`; abaixo, ações e parcelas.

- [ ] **Step 3: Melhorar nomenclaturas**

Usar `Repasse · 1ª parcela`, `2ª parcela programada`, `Data do pagamento`, `Custeio`, `Capital`. Remover `Total Parcelas` e texto técnico da BASE.

- [ ] **Step 4: Exibir contas em bloco próprio**

Mostrar banco, agência e conta por programa. Quando a fonte distinguir natureza da conta, rotular; quando não distinguir, não inventar `corrente`/`investimento`.

- [ ] **Step 5: Validar**

Run: `npm test -- src/test/recursos-pdde-domain.test.ts && npm run typecheck && npm run build`
Expected: PASS.

### Task 5: Evoluir a página Repasses após o hotfix

**Files:**
- Modify: `src/pages/Repasses.tsx`
- Modify: `src/lib/financeiroPDDE.ts`
- Create: `src/test/repasses-overview.test.ts`

**Interfaces:**
- Consumes: recorte completo publicado da 1ª parcela/P1.
- Produces: KPIs, ação, faixas, calendário e tabela como navegação operacional.

- [ ] **Step 1: Testar recorte e insights determinísticos**

Cobrir mediana, distribuição por ação, faixas e datas sem inferência qualitativa.

- [ ] **Step 2: Preservar filtros gráficos → tabela**

Ação, faixa e data devem atualizar a mesma lista de escolas.

- [ ] **Step 3: Melhorar linguagem visual**

Programa deve ter destaque próprio; evitar metadados técnicos e evitar verde como cor genérica de dinheiro.

- [ ] **Step 4: Manter exportação do conjunto filtrado**

A exportação deve refletir exatamente busca/filtros ativos.

### Task 6: Rotas de detalhamento e persistência de contexto

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Repasses.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/EscolaEditarComRecursos.tsx`

**Interfaces:**
- Consumes: filtros e rotas atuais.
- Produces: navegação previsível Painel → Repasses → Escola/Recursos → retorno mantendo contexto.

- [ ] **Step 1: Definir parâmetros de busca**

Usar query string para `acao`, `data`, `faixa` e `q`, sem criar páginas duplicadas.

- [ ] **Step 2: Ler/escrever filtros na URL**

A página Repasses deve restaurar filtros ao voltar da escola.

- [ ] **Step 3: Tornar cards do Painel deep-links**

Cards relevantes devem abrir Repasses já filtrado quando fizer sentido.

### Task 7: Gate final e publicação

**Files:**
- Modify: `tests/e2e/accessibility.spec.ts` se necessário
- Create: `tests/e2e/repasses.spec.ts`

**Interfaces:**
- Consumes: implementação completa das tasks anteriores.
- Produces: evidência de funcionamento e acessibilidade antes de Production.

- [ ] **Step 1: Criar E2E de Repasses**

Cobrir abertura da rota, renderização de `Ação`, filtro e navegação para escola.

- [ ] **Step 2: Rodar suíte completa**

Run: `npm run validate && npm run test:e2e && npm run test:a11y && npm audit --omit=dev --audit-level=high`
Expected: PASS.

- [ ] **Step 3: Publicar somente com gate verde**

Merge em `main`, confirmar deployment Vercel `READY` no SHA do merge e fazer smoke de `/`, `/repasses`, `/escolas` e uma ficha de escola.
