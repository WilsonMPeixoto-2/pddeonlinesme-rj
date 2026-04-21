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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/escolas" element={<Escolas />} />
          <Route path="/escolas/:id" element={<EscolaEditar />} />
          <Route path="/base" element={<Base />} />
          <Route path="/configuracoes" element={<Configuracoes />} />
          <Route path="/manual" element={<Manual />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
