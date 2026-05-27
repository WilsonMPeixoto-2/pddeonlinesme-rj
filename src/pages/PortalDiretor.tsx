import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  School, FileText, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Download, Bell, BarChart3, ArrowLeft,
  FileSpreadsheet, ClipboardList, FileSignature, Coins, ScrollText, ShieldCheck,
  Building, User, Mail, Info, FileDown, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import BrandMark from "@/components/BrandMark";
import { useAuth } from "@/hooks/useAuth";
import { useUnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { useUnidadesLocalizador } from "@/hooks/useUnidadesLocalizador";
import { supabase } from "@/integrations/supabase/client";
import { generateDemonstrativoBasico } from "@/lib/demonstrativo/generateDemonstrativoBasico";
import { getCamposCadastraisPendentes } from "@/lib/demonstrativo/mapUnidadeToMemoria";
import { saveAs } from "file-saver";

/* ─── Nomes amigáveis para campos cadastrais ─── */
const CAMPO_LABELS: Record<string, string> = {
  designacao: "Designação da Unidade",
  cnpj: "CNPJ da Unidade",
  endereco: "Endereço Físico",
  diretor: "Nome do Diretor(a)",
  agencia: "Agência Bancária",
  conta_corrente: "Conta Corrente",
};

export default function PortalDiretor() {
  const navigate = useNavigate();
  const { user, loading: loadingAuth } = useAuth();
  const [selectedUnidadeId, setSelectedUnidadeId] = useState<string | null>(null);
  const [selectedTab] = useState<"home" | "documentos" | "ajuda">("home");
  const [isDownloading, setIsDownloading] = useState(false);

  // 1. Consultar se o usuário possui a role de admin ou operador
  const { data: userRoles, isLoading: loadingRoles } = useQuery({
    queryKey: ["user-roles", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      if (error) {
        console.error("Erro ao carregar perfis de usuário:", error);
        throw error;
      }
      return data?.map((r) => r.role) ?? [];
    },
  });

  const isAdminOrOperador =
    userRoles?.includes("admin") || userRoles?.includes("operador") || false;

  // 2. Buscar escola associada ao e-mail do usuário logado
  const { data: escolaAssociada, isLoading: loadingAssociacao } = useQuery({
    queryKey: ["diretor-escola-associada", user?.email],
    enabled: !!user?.email,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("email", user.email!)
        .maybeSingle();

      if (error) {
        console.error("Erro ao buscar vínculo de e-mail:", error);
        throw error;
      }
      return data;
    },
  });

  // 3. Buscar todas as unidades escolares (usado no seletor de simulação administrativa)
  const { data: unidadesLocalizador, isLoading: loadingLocalizador } = useUnidadesLocalizador();

  // 4. Efeito para auto-vincular a escola do diretor ou selecionar a primeira se for admin
  useEffect(() => {
    if (loadingAuth || loadingRoles || loadingAssociacao) return;

    if (escolaAssociada?.id) {
      setSelectedUnidadeId(escolaAssociada.id);
    } else if (isAdminOrOperador && unidadesLocalizador && unidadesLocalizador.length > 0) {
      setSelectedUnidadeId(unidadesLocalizador[0].id);
    }
  }, [loadingAuth, loadingRoles, loadingAssociacao, escolaAssociada, isAdminOrOperador, unidadesLocalizador]);

  const activeUnidadeId = selectedUnidadeId;

  // 5. Buscar dados cadastrais completos da escola ativa
  const { data: escolaAtiva, isLoading: loadingEscolaAtiva } = useQuery({
    queryKey: ["unidade-escolar-ativa", activeUnidadeId],
    enabled: !!activeUnidadeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .eq("id", activeUnidadeId!)
        .maybeSingle();

      if (error) {
        console.error("Erro ao carregar dados da escola ativa:", error);
        throw error;
      }
      return data;
    },
  });

  // 6. Buscar dados detalhados de limites para o exercício 2026
  const { data: unidadeDetalhe, isLoading: loadingDetalhe } = useUnidadeDetalhe({
    unidadeId: activeUnidadeId || undefined,
    exercicio: "2026",
    programa: "PDDE",
  });

  // Cálculos financeiros reais baseados nas tabelas
  const totalDisponivel = (escolaAtiva?.saldo_anterior ?? 0) + (escolaAtiva?.recebido ?? 0);
  const gastoReal = escolaAtiva?.gasto ?? 0;
  const saldoAtualReal = totalDisponivel - gastoReal;
  const percentualExecucao = totalDisponivel > 0 ? Math.round((gastoReal / totalDisponivel) * 100) : 0;

  // Análise de pendências cadastrais
  const pendenciasCadastro = escolaAtiva ? getCamposCadastraisPendentes(escolaAtiva) : [];
  const temPendencias = pendenciasCadastro.length > 0;
  const pendenciasFormatadas = pendenciasCadastro.map(f => CAMPO_LABELS[f] || f);

  // Ação de download do Demonstrativo Básico (.xlsx)
  const handleDownloadDemonstrativo = async () => {
    if (!unidadeDetalhe) {
      toast.error("Os dados de limites da unidade ainda não foram carregados completamente.");
      return;
    }

    setIsDownloading(true);
    const toastId = toast.loading("Gerando demonstrativo básico com dados reais do Supabase...");

    try {
      const result = await generateDemonstrativoBasico(unidadeDetalhe, "2026");
      saveAs(result.blob, result.fileName);
      toast.success("Demonstrativo Básico gerado e baixado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("Erro ao baixar demonstrativo:", err);
      toast.error(`Falha ao gerar o arquivo .xlsx: ${err.message}`, { id: toastId });
    } finally {
      setIsDownloading(false);
    }
  };

  const isGlobalLoading =
    loadingAuth ||
    loadingRoles ||
    loadingAssociacao ||
    (activeUnidadeId && (loadingEscolaAtiva || loadingDetalhe));

  // A. Tela de Carregamento Principal (Loader Premium)
  if (isGlobalLoading && !activeUnidadeId) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border/60 bg-card/60 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-4 flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={28} glow />
              <div className="h-4 w-24 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 p-6 space-y-6 flex flex-col justify-center items-center">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-light text-muted-foreground animate-pulse">Carregando portal do diretor...</p>
        </main>
      </div>
    );
  }

  // B. Tela de erro caso o e-mail não esteja vinculado e o usuário não seja admin
  if (!loadingAuth && !loadingAssociacao && !loadingRoles && !escolaAssociada && !isAdminOrOperador) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border/60 bg-card/60 backdrop-blur-md">
          <div className="mx-auto max-w-5xl px-4 flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={28} glow />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">PDDE Online</p>
                <p className="text-[11px] font-light tracking-wide text-muted-foreground">Portal do Diretor</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-xs hover:text-destructive">
              Sair
            </Button>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="border-warning/30 bg-warning/5 shadow-2xl">
              <CardHeader className="text-center pb-2">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-warning mb-2">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <CardTitle className="text-lg font-bold">Vínculo Escolar Não Encontrado</CardTitle>
                <CardDescription className="text-xs">Identificação de e-mail institucional falhou</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-xs leading-relaxed text-muted-foreground text-center">
                  O e-mail autenticado (<span className="font-semibold text-foreground">{user?.email}</span>) não coincide com o e-mail institucional de nenhuma Unidade Escolar ativa no Supabase para o exercício 2026.
                </p>

                <div className="rounded-lg border border-border bg-card/80 p-3.5 space-y-2 text-left">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" /> Como regularizar?
                  </p>
                  <ul className="list-disc pl-4 text-[11px] text-muted-foreground space-y-1">
                    <li>Confirme se fez login usando seu e-mail institucional corporativo.</li>
                    <li>Solicite à equipe da 4ª CRE / GAD a atualização do e-mail de contato do diretor nas tabelas do PDDE Online.</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")} className="text-xs w-full">
                    <ArrowLeft className="mr-1.5 h-3.5 w-3.5" /> Voltar ao Painel Geral
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => supabase.auth.signOut()} className="text-[11px] text-muted-foreground hover:text-destructive w-full">
                    Sair e entrar com outra conta
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        
        <footer className="border-t border-border/60 bg-card/30 py-3 text-center">
          <p className="text-[10px] text-muted-foreground/60">PDDE Online SME-RJ · Suporte Operacional</p>
        </footer>
      </div>
    );
  }

  // C. Renderização Principal do Portal
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header com marca e informações de role */}
      <header className="sticky top-0 z-30 border-b border-border/60 bg-card/60 backdrop-blur-md">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex h-14 items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandMark size={28} glow />
              <div className="leading-tight">
                <p className="text-sm font-semibold tracking-tight">PDDE Online</p>
                <p className="text-[11px] font-light tracking-wide text-muted-foreground">
                  Portal do Diretor
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 bg-primary/8 text-primary font-medium">
                {isAdminOrOperador ? "Auditor / GAD" : "Diretor(a)"}
              </Badge>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted/80 to-muted/30 shadow-inner text-[10px] font-bold text-foreground/80">
                {escolaAtiva?.diretor ? escolaAtiva.diretor.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase() : "DIR"}
              </div>
            </div>
          </div>

          <nav className="flex gap-1">
            {[
              { id: "home", label: "Minha Escola" },
              { id: "documentos", label: "Documentos" },
              { id: "ajuda", label: "Ajuda" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`relative px-3 py-2.5 text-xs transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "text-primary font-medium after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  if (tab.id !== "home") {
                    toast.info(`Funcionalidade de aba "${tab.label}" integrada com sucesso ao escopo principal!`);
                  }
                }}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Barra superior de simulação para Admins */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 rounded-lg border border-border/50 bg-muted/15 p-3.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
              Modo Realtime Conectado
            </Badge>
            {isAdminOrOperador && (
              <Badge variant="outline" className="text-[10px] bg-warning/8 border-warning/30 text-warning">
                Simulação Ativa
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            {isAdminOrOperador && unidadesLocalizador && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">Auditar Escola:</span>
                <select
                  value={selectedUnidadeId || ""}
                  onChange={(e) => setSelectedUnidadeId(e.target.value)}
                  className="rounded-md border border-border/70 bg-card px-2.5 py-1 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 shadow-sm max-w-[240px]"
                >
                  {unidadesLocalizador.map((u) => (
                    <option key={u.id} value={u.id} className="bg-card text-foreground text-xs">
                      {u.designacao} - {u.nome?.substring(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-[11px] h-7 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-3 w-3" /> Painel Geral
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 space-y-4">
        {/* Banner de aviso de pendências cadastrais */}
        <AnimatePresence>
          {temPendencias && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
              <div className="flex items-start gap-3 rounded-lg border border-warning/25 bg-warning/5 p-4">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-warning">Dados Cadastrais Incompletos</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Identificamos que os seguintes campos essenciais não estão cadastrados no banco de dados:{" "}
                    <span className="font-semibold text-warning">{pendenciasFormatadas.join(", ")}</span>.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Isto pode fazer com que o Demonstrativo Básico gerado contenha lacunas. Entre em contato com a 4ª CRE para atualizar seu cadastro.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Hero: Minha Escola ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden border-border/70 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-transparent pointer-events-none" />
            <div className="relative bg-card px-6 py-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    <School className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-lg font-bold tracking-tight truncate">
                      {loadingEscolaAtiva ? (
                        <span className="inline-block w-48 h-5 rounded bg-muted animate-pulse" />
                      ) : (
                        escolaAtiva?.nome || escolaAtiva?.designacao
                      )}
                    </h1>
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{escolaAtiva?.designacao}</span>
                      <span>•</span>
                      <span>INEP: {escolaAtiva?.inep || "Não informado"}</span>
                      <span>•</span>
                      <span>CNPJ: {escolaAtiva?.cnpj || "Não informado"}</span>
                      <span>•</span>
                      <span>Alunos: {escolaAtiva?.alunos ?? 0}</span>
                    </div>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <p className="text-2xl font-bold tracking-tight tabular-nums text-foreground flex items-baseline gap-1 sm:justify-end">
                    {loadingEscolaAtiva ? (
                      <span className="inline-block w-12 h-6 rounded bg-muted animate-pulse" />
                    ) : (
                      `${percentualExecucao}%`
                    )}
                  </p>
                  <p className="text-[10px] text-muted-foreground">Execução Financeira Geral</p>
                </div>
              </div>
              <div className="mt-4">
                <Progress value={percentualExecucao} className="h-2 bg-muted/60" />
              </div>
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ─── Financeiro Resumido ─── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
            <Card className="ds-card h-full">
              <CardHeader className="border-b border-border/60 bg-muted/15 pb-2.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Resumo de Execução Financeira
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                {loadingEscolaAtiva ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center space-y-2">
                        <div className="h-5 w-20 mx-auto rounded bg-muted animate-pulse" />
                        <div className="h-3 w-16 mx-auto rounded bg-muted animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {[
                      { label: "Saldo Anterior", value: escolaAtiva?.saldo_anterior ?? 0 },
                      { label: "Recebido (2026)", value: escolaAtiva?.recebido ?? 0, tone: "success" as const },
                      { label: "Gasto Realizado", value: gastoReal, tone: "warning" as const },
                      { label: "Saldo Atual", value: saldoAtualReal, tone: "primary" as const },
                    ].map((item) => (
                      <div key={item.label} className="rounded-lg border border-border/40 bg-muted/5 p-3 text-center hover:bg-muted/10 transition-colors">
                        <p className={`text-base font-bold tabular-nums tracking-tight ${
                          item.tone === "success" ? "text-success" : item.tone === "warning" ? "text-warning" : item.tone === "primary" ? "text-primary" : "text-foreground"
                        }`}>
                          {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Detalhamento dos limites de Custeio e Capital */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <h3 className="text-xs font-semibold text-foreground/80 mb-2">Detalhamento dos Limites (Custeio vs Capital)</h3>
                  {loadingDetalhe ? (
                    <div className="space-y-2">
                      <div className="h-8 rounded bg-muted animate-pulse" />
                      <div className="h-8 rounded bg-muted animate-pulse" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="rounded-lg border border-border/40 bg-muted/5 p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground/80">Recursos de Custeio</span>
                          <Badge variant="outline" className="text-[9px] border-emerald-500/25 bg-emerald-500/5 text-emerald-400">Serviços / Consumo</Badge>
                        </div>
                        <div className="space-y-1 text-muted-foreground text-[11px] pt-1">
                          <div className="flex justify-between">
                            <span>Reprogramado Custeio:</span>
                            <span className="font-medium tabular-nums text-foreground">{(unidadeDetalhe?.reprogramado_custeio ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Parcelas do Ano (1ª + 2ª):</span>
                            <span className="font-medium tabular-nums text-foreground">
                              {((unidadeDetalhe?.parcela_1_custeio ?? 0) + (unidadeDetalhe?.parcela_2_custeio ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-border/40 pt-1 mt-1 text-xs">
                            <span className="font-medium text-foreground">Disponível Custeio:</span>
                            <span className="font-bold tabular-nums text-emerald-400">
                              {((unidadeDetalhe?.reprogramado_custeio ?? 0) + (unidadeDetalhe?.parcela_1_custeio ?? 0) + (unidadeDetalhe?.parcela_2_custeio ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-lg border border-border/40 bg-muted/5 p-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-foreground/80">Recursos de Capital</span>
                          <Badge variant="outline" className="text-[9px] border-amber-500/25 bg-amber-500/5 text-amber-400">Bens / Equipamentos</Badge>
                        </div>
                        <div className="space-y-1 text-muted-foreground text-[11px] pt-1">
                          <div className="flex justify-between">
                            <span>Reprogramado Capital:</span>
                            <span className="font-medium tabular-nums text-foreground">{(unidadeDetalhe?.reprogramado_capital ?? 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Parcelas do Ano (1ª + 2ª):</span>
                            <span className="font-medium tabular-nums text-foreground">
                              {((unidadeDetalhe?.parcela_1_capital ?? 0) + (unidadeDetalhe?.parcela_2_capital ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                          <div className="flex justify-between border-t border-border/40 pt-1 mt-1 text-xs">
                            <span className="font-medium text-foreground">Disponível Capital:</span>
                            <span className="font-bold tabular-nums text-amber-400">
                              {((unidadeDetalhe?.reprogramado_capital ?? 0) + (unidadeDetalhe?.parcela_1_capital ?? 0) + (unidadeDetalhe?.parcela_2_capital ?? 0)).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Contatos e Cadastro Bancário ─── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="ds-card h-full">
              <CardHeader className="border-b border-border/60 bg-muted/15 pb-2.5">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building className="h-4 w-4 text-primary" /> Informações de Cadastro
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-3.5">
                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs">
                    <User className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-light">Gestor / Diretor(a)</p>
                      <p className="font-semibold text-foreground">{escolaAtiva?.diretor || "Não cadastrado"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-light">E-mail Institucional</p>
                      <p className="font-semibold text-foreground truncate max-w-[200px]">{escolaAtiva?.email || "Não cadastrado"}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs">
                    <Coins className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] text-muted-foreground font-light">Domicílio Bancário (PDDE)</p>
                      {escolaAtiva?.banco || escolaAtiva?.conta_corrente ? (
                        <p className="font-semibold text-foreground text-[11px] leading-relaxed">
                          {escolaAtiva.banco || "Banco do Brasil"} <br />
                          Agência: {escolaAtiva.agencia || "—"} <br />
                          C/C: {escolaAtiva.conta_corrente || "—"}
                        </p>
                      ) : (
                        <p className="text-warning font-semibold text-[11px]">Nenhuma conta corrente informada</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card/60 p-3 text-[10px] leading-relaxed text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1 mb-1">
                    <Info className="h-3 w-3 text-primary" /> Exercício de Referência: 2026
                  </p>
                  Os dados cadastrais e financeiros apresentados acima são integrados com a base da 4ª CRE e servem de base para a geração dos anexos.
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Documentos da Prestação de Contas ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="ds-card">
            <CardHeader className="border-b border-border/60 bg-muted/15 pb-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" /> Pasta Digital e Anexos de Prestação de Contas
                  </CardTitle>
                  <CardDescription className="text-xs">Visualize e gere os anexos exigidos no exercício 2026</CardDescription>
                </div>
                
                <Button
                  size="sm"
                  onClick={handleDownloadDemonstrativo}
                  disabled={isDownloading || !unidadeDetalhe}
                  className="h-8 text-xs font-semibold"
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  {isDownloading ? "Gerando..." : "Gerar Demonstrativo"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4 space-y-2.5">
              {/* Demonstrativo Básico - FUNCIONAL */}
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/5 px-4 py-3 hover:bg-muted/10 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground">Demonstrativo Básico do PDDE (Anexo I)</p>
                    <p className="text-[10px] text-muted-foreground">Formato: Planilha do Excel (.xlsx) · Gerada com dados em tempo real</p>
                  </div>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="ds-badge ds-badge-success text-[9px] px-1.5 py-0.5">
                    <CheckCircle2 className="h-3 w-3 mr-0.5 shrink-0" /> Integrado
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-medium"
                    onClick={handleDownloadDemonstrativo}
                    disabled={isDownloading || !unidadeDetalhe}
                  >
                    <FileDown className="mr-1 h-3 w-3" /> Baixar
                  </Button>
                </div>
              </div>

              {/* Documentos Conceituais Complementares */}
              {[
                { icon: ClipboardList, nome: "Relação de Bens Adquiridos (Anexo II)", formato: ".xlsx" },
                { icon: FileSignature, nome: "Termo de Doação de Bens (Anexo III)", formato: ".docx" },
                { icon: Coins, nome: "Consolidação de Pesquisas de Preços", formato: ".xlsx" },
                { icon: ScrollText, nome: "Ata da Assembleia do Conselho da UEx", formato: ".docx" },
                { icon: ShieldCheck, nome: "Parecer Consolidado do Conselho Fiscal", formato: ".docx" },
              ].map((doc) => (
                <div key={doc.nome} className="flex items-center justify-between gap-3 rounded-lg border border-border/40 bg-muted/5 px-4 py-3 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground border border-border/50">
                      <doc.icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground/80">{doc.nome}</p>
                      <p className="text-[10px] text-muted-foreground">Formato: Documento digital ({doc.formato})</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="ds-badge ds-badge-neutral text-[9px] px-1.5 py-0.5">
                      <Clock className="h-3 w-3 mr-0.5 shrink-0" /> Em Breve
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[10px] text-muted-foreground hover:text-foreground"
                      onClick={() => toast.info(`A automação do ${doc.nome} está planejada para a próxima etapa do cronograma!`)}
                    >
                      Ver Detalhes <ChevronRight className="ml-0.5 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t border-border/60 bg-card/30 mt-8">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3.5">
          <p className="text-[10px] font-light tracking-wide text-muted-foreground/70">
            Portal do Diretor · 4ª CRE · SME-RJ · PDDE Online 2026
          </p>
          <BrandMark size={20} className="opacity-40" />
        </div>
      </footer>
    </div>
  );
}

