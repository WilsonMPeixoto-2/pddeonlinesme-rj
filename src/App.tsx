import { lazy, Suspense, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
  ScrollRestoration,
} from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";

import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { CommandPalette } from "./components/CommandPalette.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { TopLoadingBar } from "./components/TopLoadingBar.tsx";
import { ExercicioProvider } from "./hooks/useExercicio.tsx";

import "nprogress/nprogress.css";

const Index = lazy(() => import("./pages/Index.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Escolas = lazy(() => import("./pages/Escolas.tsx"));
const EscolaEditar = lazy(() => import("./pages/EscolaEditar.tsx"));
const Base = lazy(() => import("./pages/Base.tsx"));
const Configuracoes = lazy(() => import("./pages/Configuracoes.tsx"));
const Manual = lazy(() => import("./pages/Manual.tsx"));
const StyleGuide = lazy(() => import("./pages/StyleGuide.tsx"));
const AccessDenied = lazy(() => import("./pages/AccessDenied.tsx"));
const PortalDiretor = lazy(() => import("./pages/PortalDiretor.tsx"));
const HistoricoGeracoes = lazy(
  () => import("./pages/HistoricoGeracoes.tsx"),
);
const FiscalConferencia = lazy(
  () => import("./pages/FiscalConferencia.tsx"),
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const protectedRoute = (children: ReactNode) => (
  <ProtectedRoute>{children}</ProtectedRoute>
);

const RouteFallback = () => (
  <div className="flex min-h-[50vh] items-center justify-center px-6">
    <div
      aria-label="Carregando"
      className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
      role="status"
    />
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

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Index /> },
        { path: "dashboard", element: protectedRoute(<Dashboard />) },
        { path: "painel", element: <Navigate to="/dashboard" replace /> },
        {
          path: "painel/historico",
          element: protectedRoute(<HistoricoGeracoes />),
        },
        { path: "escolas", element: protectedRoute(<Escolas />) },
        {
          path: "escolas/:id",
          element: protectedRoute(<EscolaEditar />),
        },
        { path: "base", element: protectedRoute(<Base />) },
        {
          path: "configuracoes",
          element: protectedRoute(<Configuracoes />),
        },
        { path: "manual", element: protectedRoute(<Manual />) },
        {
          path: "style-guide",
          element: protectedRoute(<StyleGuide />),
        },
        { path: "acesso-negado", element: <AccessDenied /> },
        { path: "diretor", element: protectedRoute(<PortalDiretor />) },
        {
          path: "fiscal",
          element: protectedRoute(<FiscalConferencia />),
        },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

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
