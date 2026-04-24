import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FileSpreadsheet,
  ClipboardList,
  FileSignature,
  Coins,
  ScrollText,
  ShieldCheck,
  Download,
  PackageCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ─── Catálogo dos 6 documentos oficiais do PDDE ─── */

type DocStatus = "disponivel" | "em-breve" | "pendente";

const DOCUMENTOS = [
  {
    id: "demonstrativo",
    label: "Demonstrativo Básico",
    description: "Execução financeira (receitas, despesas e saldos)",
    longDescription:
      "Documento oficial que consolida receitas, despesas e saldos do exercício. Base do processo de prestação de contas.",
    icon: FileSpreadsheet,
    status: "disponivel" as DocStatus,
    format: ".xlsx",
  },
  {
    id: "relacao-bens",
    label: "Relação de Bens Adquiridos",
    description: "Inventário de bens de capital comprados",
    longDescription:
      "Lista os bens de capital adquiridos com recursos do PDDE no exercício, com identificação patrimonial.",
    icon: ClipboardList,
    status: "em-breve" as DocStatus,
    format: ".xlsx",
  },
  {
    id: "termo-doacao",
    label: "Termo de Doação",
    description: "Incorporação de bens ao patrimônio da escola",
    longDescription:
      "Formaliza a transferência dos bens adquiridos ao patrimônio da unidade escolar.",
    icon: FileSignature,
    status: "em-breve" as DocStatus,
    format: ".docx",
  },
  {
    id: "consolidacao-precos",
    label: "Consolidação de Pesquisas de Preços",
    description: "Comparativo de orçamentos por item adquirido",
    longDescription:
      "Reúne os três orçamentos por item adquirido, evidenciando a escolha mais vantajosa.",
    icon: Coins,
    status: "em-breve" as DocStatus,
    format: ".xlsx",
  },
  {
    id: "ata-conselho",
    label: "Ata do Conselho Escolar",
    description: "Deliberação sobre plano de aplicação e contas",
    longDescription:
      "Registra a deliberação do Conselho Escolar sobre o plano de aplicação e a aprovação das contas.",
    icon: ScrollText,
    status: "em-breve" as DocStatus,
    format: ".docx",
  },
  {
    id: "parecer-fiscal",
    label: "Parecer do Conselho Fiscal",
    description: "Atesta a regularidade da execução dos recursos",
    longDescription:
      "Parecer técnico do Conselho Fiscal sobre a regularidade da execução dos recursos no exercício.",
    icon: ShieldCheck,
    status: "em-breve" as DocStatus,
    format: ".docx",
  },
] as const;

const statusStyle: Record<DocStatus, { label: string; className: string; dot: string }> = {
  disponivel: {
    label: "Disponível",
    className: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  "em-breve": {
    label: "Em breve",
    className: "border-border/60 bg-muted/30 text-muted-foreground",
    dot: "bg-muted-foreground/40",
  },
  pendente: {
    label: "Pendente",
    className: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
};

/* ─── Props ─── */

interface DocumentsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolName: string;
  exercicio?: string;
}

export function DocumentsPanel({
  open,
  onOpenChange,
  schoolName,
  exercicio = "2026",
}: DocumentsPanelProps) {
  const [generating, setGenerating] = useState<string | null>(null);

  const generate = (docId: string, label: string, status: DocStatus) => {
    if (status !== "disponivel") {
      toast.info(`${label} — funcionalidade em desenvolvimento`);
      return;
    }
    setGenerating(docId);
    setTimeout(() => {
      setGenerating(null);
      toast.success(`${label} gerado para ${schoolName}`);
    }, 1100);
  };

  const generateAll = () => {
    setGenerating("__all__");
    setTimeout(() => {
      setGenerating(null);
      toast.success(`Pacote completo gerado para ${schoolName}`);
    }, 1500);
  };

  const disponiveis = DOCUMENTOS.filter((d) => d.status === "disponivel").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-hidden border-border/60 bg-card/95 p-0 backdrop-blur-md sm:max-w-xl"
      >
        {/* HEADER */}
        <SheetHeader className="space-y-3 border-b border-border/60 bg-gradient-to-br from-primary/10 via-card to-card px-6 pb-6 pt-6 text-left">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Geração de documentos · Exercício {exercicio}
            </p>
          </div>
          <div className="space-y-1.5">
            <SheetTitle className="text-2xl font-semibold tracking-tight">
              {schoolName}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Selecione um documento individual ou gere o pacote completo da prestação de contas.
              {disponiveis > 0 && (
                <span className="ml-1 font-medium text-success">
                  · {disponiveis} disponível{disponiveis > 1 ? "is" : ""}
                </span>
              )}
            </SheetDescription>
          </div>

          {/* Generate-all CTA */}
          <Button
            size="lg"
            className="mt-2 h-12 w-full justify-between text-sm shadow-[0_0_24px_hsl(var(--primary)/0.25)]"
            onClick={generateAll}
            disabled={generating !== null}
          >
            <span className="flex items-center gap-2">
              {generating === "__all__" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <PackageCheck className="h-4 w-4" />
              )}
              Gerar pacote completo (.zip)
            </span>
            <span className="text-[11px] font-normal opacity-80">
              {DOCUMENTOS.length} documentos
            </span>
          </Button>
        </SheetHeader>

        {/* DOCUMENT LIST */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="mb-3 flex items-center justify-between px-2">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Documentos individuais
            </p>
            <Sparkles className="h-3 w-3 text-muted-foreground/60" />
          </div>

          <ul className="space-y-2">
            {DOCUMENTOS.map((doc, i) => {
              const Icon = doc.icon;
              const style = statusStyle[doc.status];
              const isAvailable = doc.status === "disponivel";
              const isGenerating = generating === doc.id;
              return (
                <motion.li
                  key={doc.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.035, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => generate(doc.id, doc.label, doc.status)}
                    disabled={generating !== null}
                    className={cn(
                      "group relative flex w-full items-start gap-3 rounded-xl border border-border/60 bg-background/40 p-4 text-left transition-all duration-200",
                      "hover:border-primary/40 hover:bg-background/70 hover:shadow-[0_0_20px_hsl(var(--primary)/0.08)]",
                      "disabled:cursor-not-allowed disabled:opacity-60",
                      !isAvailable && "opacity-75",
                    )}
                  >
                    {/* Icon */}
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1 transition-transform duration-200 group-hover:scale-105",
                        isAvailable
                          ? "bg-primary/10 text-primary ring-primary/20"
                          : "bg-muted text-muted-foreground ring-border/50",
                      )}
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>

                    {/* Body */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-tight">{doc.label}</p>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-5 gap-1 px-1.5 text-[10px] font-medium",
                            style.className,
                          )}
                        >
                          <span className={cn("h-1 w-1 rounded-full", style.dot)} />
                          {style.label}
                        </Badge>
                        <span className="font-mono text-[10px] text-muted-foreground/70">
                          {doc.format}
                        </span>
                      </div>
                      <p className="text-xs leading-snug text-muted-foreground">
                        {doc.longDescription}
                      </p>
                    </div>

                    {/* Action affordance */}
                    <Download
                      className={cn(
                        "mt-2 h-4 w-4 shrink-0 transition-all duration-200",
                        isAvailable
                          ? "text-muted-foreground opacity-0 group-hover:translate-y-0.5 group-hover:text-primary group-hover:opacity-100"
                          : "text-muted-foreground/40",
                      )}
                    />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </div>

        {/* FOOTER */}
        <Separator />
        <div className="flex items-center justify-between gap-3 px-6 py-3 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3 w-3 text-success" />
            Documentos oficiais · 4ª CRE · SME-RJ
          </span>
          <span className="font-mono">v1.0</span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
