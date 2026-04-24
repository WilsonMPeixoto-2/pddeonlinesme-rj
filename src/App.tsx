import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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
import "nprogress/nprogress.css";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TopLoadingBar />
        <CommandPalette />
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
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
