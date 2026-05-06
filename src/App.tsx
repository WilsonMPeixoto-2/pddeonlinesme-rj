import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Escolas from "./pages/Escolas.tsx";
import EscolaEditar from "./pages/EscolaEditar.tsx";
import Base from "./pages/Base.tsx";
import Configuracoes from "./pages/Configuracoes.tsx";
import Manual from "./pages/Manual.tsx";
import StyleGuide from "./pages/StyleGuide.tsx";
import AccessDenied from "./pages/AccessDenied.tsx";
import PortalDiretor from "./pages/PortalDiretor.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import { TopLoadingBar } from "./components/TopLoadingBar.tsx";
import { CommandPalette } from "./components/CommandPalette.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary.tsx";
import { ExercicioProvider } from "./hooks/useExercicio.tsx";
import "nprogress/nprogress.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // Dados permanecem "frescos" por 5 minutos (evita requisições repetidas ao Supabase)
      retry: 1, // Tenta apenas 1 vez em caso de falha (evita travar o navegador tentando buscar algo que não existe)
      refetchOnWindowFocus: false, // Não recarrega os dados toda vez que o usuário troca de aba
    },
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
          <BrowserRouter>
            <TopLoadingBar />
            <CommandPalette />
            <ErrorBoundary>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                <Route path="/escolas" element={<ProtectedRoute><Escolas /></ProtectedRoute>} />
                <Route path="/escolas/:id" element={<ProtectedRoute><EscolaEditar /></ProtectedRoute>} />
                <Route path="/base" element={<ProtectedRoute><Base /></ProtectedRoute>} />
                <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
                <Route path="/manual" element={<ProtectedRoute><Manual /></ProtectedRoute>} />
                <Route path="/style-guide" element={<ProtectedRoute><StyleGuide /></ProtectedRoute>} />
                <Route path="/acesso-negado" element={<AccessDenied />} />
                <Route path="/diretor" element={<ProtectedRoute><PortalDiretor /></ProtectedRoute>} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          <Analytics />
          <SpeedInsights />
        </TooltipProvider>
      </QueryClientProvider>
    </ExercicioProvider>
  </ThemeProvider>
);

export default App;
