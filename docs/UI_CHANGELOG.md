# UI Changelog — PDDE Online 2026

Registro de decisões e entregas visuais/transversais já presentes no app.

## 2026-05-26 — Modernização Tecnológica, Performance & Governança (Frente 1)

O PR `docs/state-reconcile-after-pr43` entregou otimizações cruciais de performance e arquitetura robusta de validação:

- **Zero-Latency Navigation:** React Query prefetching no hover (`onMouseEnter`) de TableRow em `/escolas` pré-carrega a ficha da unidade em background.
- **Governança Cadastral (Zod Schema):** Validador Zod aritmético de CNPJ (Módulo 11), regex de INEP (8 dígitos) e e-mail institucional estrito em `src/schemas/unidadeSchema.ts`.
- **Otimização do Build (Vite/Rollup):** Divisão manual de bundle (`manualChunks`) em `vite.config.ts` isolando recharts e framer-motion, reduzindo o chunk principal de 1.96 MB para 188 kB.
- **Premium Loading (Shimmer):** Loading skeletons com efeito cintilante (Shimmer wave) integrado globalmente via `skeleton.tsx`.
- **Performance de Banco:** Adicionados índices compostos inteligentes (`idx_execucao_financeira_unidade_exercicio_prog` e `idx_contas_bancarias_unidade_principal`) via migração para acelerar consultas.

## 2026-05-11 — Fixes de integracao UI entregues no PR #43

O commit final do PR #43 (`5202313`) corrigiu dois bugs de integracao visual detectados durante smoke operacional autenticado (validacao local por agente, sem artefato versionado no repo).

### Fix 1 — Tabela /escolas: desalinhamento de colunas

**Causa:** `motion.tr` do Framer Motion, combinado com a classe `row-accent`, interferia no calculo de largura das colunas, causando desalinhamento visual entre `thead` e `tbody`.

**Fix estrutural:** substituido `motion.tr` por `TableRow` nativo. Aplicado `table-fixed` no `<table>` e `<colgroup>` com larguras percentuais explicitas para cada coluna.

**Arquivo:** `src/pages/Escolas.tsx`

### Fix 2 — DocumentsPanel: mock substituido por gerador real

**Causa:** o `DocumentsPanel` em `EscolaEditar.tsx` exibia cards mockados com dados hardcoded, sem conexao ao gerador `generateDemonstrativoBasico`.

**Fix funcional:** integrado o painel com `useUnidadeDetalhe` (hook React Query para `vw_unidade_detalhe`), `generateDemonstrativoBasico` (gerador ExcelJS) e `file-saver saveAs` para download direto do `.xlsx`.

**Arquivos:** `src/pages/EscolaEditar.tsx`, `src/components/escola/DocumentsPanel.tsx`

### Validacao em producao

Smoke autenticado executado localmente por agente apos merge do PR #43. Rotas autenticadas verificadas operacionalmente em producao. Este smoke nao possui artefato versionado no repositorio.


## 2026-05-02 — Light Mode institucional premium

O projeto incorporou um Light Mode institucional premium, mantendo o Dark Mode atmosférico como experiência preservada.

Principais entregas:

- `:root` passou a representar o Light Mode.
- `.dark` preserva o Dark Mode institucional.
- `ThemeProvider` foi integrado ao app.
- `ThemeToggle` foi inserido no `AppLayout`.
- Preferência de tema passou a ser persistida.
- Script anti-flash foi inserido no `index.html`.
- A linguagem visual do Light Mode usa base de papel digital, superfícies claras, bordas azul-acinzentadas, sombras suaves e paleta institucional.

Esta entrega foi incorporada pelo PR #33 e não alterou lógica de dados, Supabase, migrations, Vercel envs ou autenticação.

## 2026-05-02 — Premium UI Kit e preparação para Fase 2B

Foi incorporado um conjunto de dependências e componentes para fases futuras:

- `react-imask`;
- `react-number-format`;
- `@tanstack/react-table`;
- `react-dropzone`;
- `@react-pdf/renderer`;
- `src/components/ui/masked-input.tsx`.

O componente `MaskedInput` foi criado como base para CNPJ, CPF, CEP, telefone, agência e conta corrente.

Esta entrega foi incorporada pelo PR #32 e não alterou páginas, rotas, Supabase, migrations, Vercel envs ou Auth.

## 2026-05-02 — Página individual da unidade como ficha read-only

A rota `/escolas/:id` passou a consumir `vw_unidade_detalhe` por meio de React Query, exibindo identificação, dados bancários e execução financeira importada em modo read-only.

Principais decisões visuais:

- hero institucional com badges de `PDDE BÁSICO` e exercício;
- campos read-only com fundo contrastado;
- fallback visual `Banco do Brasil` para o padrão bancário do PDDE;
- botão `Edição em breve` em vez de `Salvar`;
- manutenção do `DocumentsPanel` como funcionalidade futura.

Esta entrega foi incorporada pelo PR #30.

## 2026-04-26 — Infraestrutura global do app registrada

### Seletor global de exercício — O6
* `ExercicioProvider` envolve todo o `App.tsx`.
* O seletor de exercício 2025/2026 está no `AppLayout` como controle global.
* O estado global é consumido por telas operacionais como Base, Escolas e EscolaEditar.
* A entrega corresponde à recomendação O6 do diagnóstico e deve ser considerada atendida no Marco 2.6.

### Providers e roteamento
* `QueryClientProvider` centraliza o TanStack Query.
* A configuração padrão usa `staleTime` de 5 minutos, `retry: 1` e `refetchOnWindowFocus: false`.
* `TooltipProvider` envolve a árvore visual.
* `BrowserRouter` concentra o roteamento do app.
* `ProtectedRoute` já protege as rotas internas principais.

### Feedback, navegação e resiliência
* O app mantém os dois sistemas de toast: shadcn `Toaster` e `Sonner`.
* `TopLoadingBar` está ativo como indicador global de navegação.
* `CommandPalette` está disponível globalmente.
* `ErrorBoundary` envolve o conjunto de rotas para conter falhas de renderização.

### Layout e movimento
* `AppLayout` usa `AnimatePresence` e `motion.div` para transições entre páginas.
* A navegação principal já separa Dashboard, Unidades Escolares, Importar/Exportar, Configurações e Manual.
* O cabeçalho global contém marca, busca, exercício, ThemeToggle e menu do usuário.

### Observabilidade
* Vercel Web Analytics foi instalado via `@vercel/analytics`.
* O app usa `Analytics` de `@vercel/analytics/react`, adequado para Vite + React.
* O componente `<Analytics />` foi adicionado à raiz do app para coleta em produção na Vercel.

## Observações para retorno ao Plano Global v4
* Não reabrir O6 como pendência funcional; tratar como item entregue e passível apenas de refinamento.
* Não tratar Light Mode, ThemeToggle ou Premium UI Kit como pendências da migração Supabase.
* A próxima frente de acesso deve integrar os papéis reais do banco ao frontend, sem redefinir a base RBAC já criada em migrations.
* Alterações em auth, guards, RLS, roles ou dados reais continuam exigindo revisão humana de segurança.
