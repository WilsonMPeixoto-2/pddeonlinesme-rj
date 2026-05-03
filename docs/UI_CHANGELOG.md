# UI Changelog — PDDE Online 2026

Registro de decisões e entregas visuais/transversais já presentes no app.

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
