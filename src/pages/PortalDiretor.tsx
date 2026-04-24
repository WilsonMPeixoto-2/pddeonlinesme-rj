import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  School, FileText, AlertTriangle, CheckCircle2, Clock,
  ChevronRight, Download, Bell, BarChart3, ArrowLeft,
  FileSpreadsheet, ClipboardList, FileSignature, Coins, ScrollText, ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import BrandMark from "@/components/BrandMark";

/* ─── Mock data for the wireframe ─── */

const ESCOLA = {
  designacao: "EM ALBINO SOUZA CRUZ",
  inep: "33023456",
  cnpj: "33.456.789/0001-01",
  diretor: "João Carlos Pereira",
  email: "emalbino@sme.rio",
  alunos: 287,
  saldo_anterior: 1200.0,
  recebido: 6100.0,
  gasto: 5549.1,
  exercicio: "2026",
};

const execucao = Math.round((ESCOLA.gasto / (ESCOLA.saldo_anterior + ESCOLA.recebido)) * 100);

const AVISOS = [
  { id: 1, tipo: "warning" as const, texto: "Prazo da prestação de contas: 28/02/2027", data: "Há 2 dias" },
  { id: 2, tipo: "info" as const, texto: "Nova BASE importada pela 4ª CRE", data: "21/04/2026" },
  { id: 3, tipo: "success" as const, texto: "Demonstrativo Básico gerado com sucesso", data: "18/04/2026" },
];

const DOCUMENTOS = [
  { icon: FileSpreadsheet, nome: "Demonstrativo Básico", status: "gerado" as const, formato: ".xlsx" },
  { icon: ClipboardList, nome: "Relação de Bens", status: "pendente" as const, formato: ".xlsx" },
  { icon: FileSignature, nome: "Termo de Doação", status: "pendente" as const, formato: ".docx" },
  { icon: Coins, nome: "Consolidação de Preços", status: "pendente" as const, formato: ".xlsx" },
  { icon: ScrollText, nome: "Ata do Conselho", status: "pendente" as const, formato: ".docx" },
  { icon: ShieldCheck, nome: "Parecer Fiscal", status: "pendente" as const, formato: ".docx" },
];

const avisoIcons = {
  warning: AlertTriangle,
  info: Bell,
  success: CheckCircle2,
};
const avisoColors = {
  warning: "text-warning bg-warning/10 border-warning/20",
  info: "text-primary bg-primary/10 border-primary/20",
  success: "text-success bg-success/10 border-success/20",
};

/* ─── Component ─── */

export default function PortalDiretor() {
  const navigate = useNavigate();
  const [selectedTab] = useState<"home" | "documentos" | "ajuda">("home");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ─── Header próprio (sem tabs da GAD) ─── */}
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
              <Badge variant="outline" className="text-[10px] px-2 py-0.5 border-primary/30 bg-primary/8 text-primary">
                Diretor(a)
              </Badge>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-muted/80 to-muted/30 shadow-inner text-xs font-semibold text-foreground/80">
                JP
              </div>
            </div>
          </div>
          {/* Navegação própria do diretor */}
          <nav className="flex gap-1">
            {[
              { id: "home", label: "Minha Escola" },
              { id: "documentos", label: "Documentos" },
              { id: "ajuda", label: "Ajuda" },
            ].map((tab) => (
              <button
                key={tab.id}
                className={`relative px-3 py-2.5 text-sm transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? "text-primary font-medium after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-primary after:shadow-[0_0_12px_hsl(var(--primary)/0.5)]"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => toast.info("Wireframe conceitual — navegação em desenvolvimento")}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Wireframe badge */}
      <div className="mx-auto w-full max-w-5xl px-4 pt-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px] bg-warning/8 border-warning/30 text-warning">
            Wireframe conceitual — Portal do Diretor
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-xs text-muted-foreground">
            <ArrowLeft className="mr-1.5 h-3 w-3" /> Voltar ao painel GAD
          </Button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 space-y-5">
        {/* ─── Hero: Minha Escola ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="overflow-hidden border-border/70">
            <div className="relative bg-gradient-to-br from-primary/10 via-card to-card px-6 py-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                    <School className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold tracking-tight">{ESCOLA.designacao}</h1>
                    <p className="text-sm text-muted-foreground">
                      INEP {ESCOLA.inep} · {ESCOLA.alunos} alunos · Exercício {ESCOLA.exercicio}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-semibold tracking-tight tabular-nums">
                    {execucao}%
                  </p>
                  <p className="text-xs text-muted-foreground">execução financeira</p>
                </div>
              </div>
              <Progress value={execucao} className="mt-4 h-1.5" />
            </div>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          {/* ─── Financeiro resumido ─── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="lg:col-span-2">
            <Card className="border-border/70 h-full">
              <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" /> Resumo Financeiro
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-5">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {[
                    { label: "Saldo anterior", value: ESCOLA.saldo_anterior },
                    { label: "Recebido", value: ESCOLA.recebido, tone: "success" },
                    { label: "Gasto", value: ESCOLA.gasto, tone: "warning" },
                    { label: "Saldo atual", value: ESCOLA.saldo_anterior + ESCOLA.recebido - ESCOLA.gasto, tone: "primary" },
                  ].map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center">
                      <p className={`text-lg font-semibold tabular-nums tracking-tight ${
                        item.tone === "success" ? "text-success" : item.tone === "warning" ? "text-warning" : item.tone === "primary" ? "text-primary" : "text-foreground"
                      }`}>
                        {item.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                      </p>
                      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* ─── Avisos e pendências ─── */}
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-border/70 h-full">
              <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Avisos
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-2.5">
                {AVISOS.map((a) => {
                  const Icon = avisoIcons[a.tipo];
                  return (
                    <div key={a.id} className={`flex items-start gap-3 rounded-lg border p-3 ${avisoColors[a.tipo]}`}>
                      <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground">{a.texto}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{a.data}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* ─── Documentos ─── */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/70">
            <CardHeader className="border-b border-border/60 bg-muted/20 pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> Documentos da Prestação de Contas
                </CardTitle>
                <Button size="sm" onClick={() => toast.info("Wireframe: gerar pacote completo")}>
                  <Download className="mr-2 h-3.5 w-3.5" /> Gerar pacote
                </Button>
              </div>
              <CardDescription>Gere ou baixe os documentos necessários para sua escola.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              {DOCUMENTOS.map((doc) => (
                <div key={doc.nome} className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/5 px-4 py-3 transition-colors hover:bg-muted/15">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                      <doc.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{doc.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{doc.formato}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {doc.status === "gerado" ? (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-success/30 bg-success/8 text-success">
                        <CheckCircle2 className="mr-1 h-2.5 w-2.5" /> Gerado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-border/50 bg-muted/40 text-muted-foreground">
                        <Clock className="mr-1 h-2.5 w-2.5" /> Pendente
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => toast.info(`Wireframe: ${doc.status === "gerado" ? "baixar" : "gerar"} ${doc.nome}`)}
                    >
                      {doc.status === "gerado" ? "Baixar" : "Gerar"} <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <footer className="border-t border-border/60 bg-card/30">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <p className="text-[11px] font-light tracking-wide text-muted-foreground/70">
            Portal do Diretor · 4ª CRE · SME-RJ
          </p>
          <BrandMark size={20} className="opacity-40" />
        </div>
      </footer>
    </div>
  );
}
