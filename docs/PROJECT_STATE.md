# Estado do Projeto — PDDE Online 2026

## Status Global
Fase atual: **Validação Visual e Prototipação de Alta Fidelidade (Step -1) / Fase 5 (Parcial)**

## Gate técnico antecipado — TypeScript Strict Mode
Foi antecipado o gate de endurecimento do TypeScript previsto antes do motor documental. Os arquivos `tsconfig.json` e `tsconfig.app.json` foram atualizados com `strict: true`, `noImplicitAny: true` e `strictNullChecks: true`.

A validação `npx tsc --noEmit` foi executada sem erros. Essa condição passa a ser requisito permanente do projeto: novas alterações não devem ser aceitas se quebrarem o modo estrito.

## Atualizações já implementadas antes do Marco 2

### Recomendação O6 — Seletor global de exercício
A recomendação O6 do diagnóstico organizacional já foi implementada no frontend.

Estado atual:
* `ExercicioProvider` envolve todo o `App.tsx`, tornando o exercício selecionado disponível globalmente.
* O seletor 2025/2026 está no `AppLayout` como controle global persistente.
* O próprio código identifica a entrega com o comentário `Exercício global (O6)`.
* Telas como Base, Escolas e EscolaEditar já consomem `useExercicio()`.

Impacto para o Marco 2.6: a atualização dos registros mínimos do saneamento deve tratar O6 como entregue, não como pendência.

### RBAC e RLS — Esqueleto de banco já existente
O repositório já contém uma base funcional de RBAC/RLS em migrations Supabase.

Estado atual:
* A primeira migration cria `public.app_role`, `public.user_roles`, `public.has_role()` e habilita RLS em `unidades_escolares`.
* `public.has_role()` está definida como `security definer` com `set search_path = public`.
* A segunda migration restringe `INSERT` e `UPDATE` em `unidades_escolares` para usuários com papel `admin` ou `operador`.
* `DELETE` permanece restrito a `admin`.
* A leitura de `unidades_escolares` continua liberada para usuários autenticados.

Impacto para o Marco 2: o esqueleto de RBAC no banco está pronto; a pendência passa a ser integração efetiva no frontend, guards por perfil e revisão humana de segurança antes de dados reais.

### Infraestrutura transversal da aplicação
A camada de aplicação está mais avançada do que a descrição documental anterior.

Já existem:
* `QueryClientProvider` com `staleTime` de 5 minutos, `retry: 1` e `refetchOnWindowFocus: false`.
* `TooltipProvider`, `Toaster` shadcn e `Sonner`.
* `BrowserRouter` com rotas protegidas por `ProtectedRoute`.
* `TopLoadingBar` e `CommandPalette` globais.
* `ErrorBoundary` envolvendo as rotas.
* `AnimatePresence` no `AppLayout` para transições entre páginas.
* Vercel Web Analytics via `@vercel/analytics/react`.

Essas decisões estão detalhadas em `docs/UI_CHANGELOG.md`.

### Pendente na Fase 5:
* Bloqueio/controle de cadastro público.
* Integração dos papéis reais no frontend.
* Guards por perfil usando o RBAC existente.
* Controle de acesso antes de dados reais.
* Revisão humana de segurança.
