import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider, Outlet, Navigate, ScrollRestoration } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { TopLoadingBar } from "./components/TopLoadingBar.tsx";
import { CommandPalette } from "./components/CommandPalette.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ExercicioProvider } from "./hooks/useExercicio.tsx";
import "nprogress/nprogress.css";

const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const HistoricoGeracoes = lazy(() => import("./pages/HistoricoGeracoes.tsx"));
const Escolas = lazy(() => import("./pages/Escolas.tsx"));
const EscolaEditar = lazy(() => import("./pages/EscolaEditar.tsx"));
const Base = lazy(() => import("./pages/Base.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const Manual = lazy(() => import("./pages/Manual.tsx"));
const StyleGuide = lazy(() => import("./pages/StyleGuide.tsx"));
const AccessDenied = lazy(() => import("./pages/AccessDenied.tsx"));
const PortalDiretor = lazy(() => import("./pages/PortalDiretor.tsx"));
const FiscalConferencia = lazy(() => import("./pages/FiscalConferencia.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RouteFallback = () => (
  <div
    role="status"
    aria-live="polite"
    className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground"
  >
    Carregando área…
  </div>
);

const RootLayout = () => (
  <>
    <TopLoadingBar />
    <CommandPalette />
    <ScrollRestoration />
    <ErrorBoundary>
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  </>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "", element: <Index /> },
      { path: "dashboard", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
      { path: "painel", element: <Navigate to="/dashboard" replace /> },
      { path: "painel/historico", element: <ProtectedRoute><HistoricoGeracoes /></ProtectedRoute> },
      { path: "escolas", element: <ProtectedRoute><Escolas /></ProtectedRoute> },
      { path: "escolas/:id", element: <ProtectedRoute><EscolaEditar /></ProtectedRoute> },
      { path: "base", element: <ProtectedRoute><Base /></ProtectedRoute> },
      { path: "configuracoes", element: <ProtectedRoute><Configuracoes /></ProtectedRoute> },
      { path: "manual", element: <ProtectedRoute><Manual /></ProtectedRoute> },
      { path: "style-guide", element: <ProtectedRoute><StyleGuide /></ProtectedRoute> },
      { path: "acesso-negado", element: <AccessDenied /> },
      { path: "diretor", element: <ProtectedRoute><PortalDiretor /></ProtectedRoute> },
      { path: "fiscal", element: <ProtectedRoute><FiscalConferencia /></ProtectedRoute> },
      { path: "*", element: <NotFound /> },
    ],
  },
], {
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true,
  },
});

const App = () => (
  <ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem
    disableTransitionOnChange
  >
    <ExercicioProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <RouterProvider router={router} />
          <Analytics />
          <SpeedInsights />
        </TooltipProvider>
      </QueryClientProvider>
    </ExercicioProvider>
  </ThemeProvider>
);

export default App;
