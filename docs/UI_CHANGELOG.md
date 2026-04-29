# UI Changelog — PDDE Online 2026

Registro de decisões e entregas visuais/transversais já presentes no app antes do início do Marco 2.

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
* O cabeçalho global contém marca, busca, exercício e menu do usuário.

### Observabilidade
* Vercel Web Analytics foi instalado via `@vercel/analytics`.
* O app usa `Analytics` de `@vercel/analytics/react`, adequado para Vite + React.
* O componente `<Analytics />` foi adicionado à raiz do app para coleta em produção na Vercel.

## 2026-04-29 — Conclusão PR 3B (Frontend Semântico)

### Adaptação de Telas Principais
* **Dashboard:** Consome view semântica (`vw_unidades_escolares_frontend`), separa `nome` e `designacao`, e exibe contagem real de documentos da `vw_unidades_status`.
* **Escolas:** Consome view semântica, exibe status real de importação e documentos reais, removendo dependência de mocks e virtualização redundante.
* **EscolaEditar:** Refatorada para leitura global via view e gravação particionada (cadastral x financeira) no Supabase.
* **Base:** Transformada em vitrine de status e histórico de importações. O upload via browser foi desativado operacionalmente, passando a ser apenas referência visual, sem gravação no banco.
* **PortalDiretor:** Mantido como wireframe explícito. Nome configurado como rótulo principal e designação como secundário. Adicionado aviso de "etapa futura" e status de documentos travados em "pendente/em breve".

## Observações para o Marco 2
* Não reabrir O6 como pendência funcional; tratar como item entregue e passível apenas de refinamento.
* O próximo trabalho de acesso deve integrar os papéis reais do banco ao frontend, sem redefinir a base RBAC já criada em migrations.
* Alterações em auth, guards, RLS, roles ou dados reais continuam exigindo revisão humana de segurança.
