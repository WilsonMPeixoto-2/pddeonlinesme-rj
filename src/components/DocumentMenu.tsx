import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  ClipboardList,
  FileSignature,
  Coins,
  ScrollText,
  ShieldCheck,
  ChevronDown,
  MoreHorizontal,
  Download,
} from "lucide-react";
import { toast } from "sonner";

/* ─── Definição dos 6 documentos oficiais do PDDE ─── */

const DOCUMENTOS = [
  {
    id: "demonstrativo",
    label: "Demonstrativo Básico",
    description: "Execução financeira (receitas, despesas e saldos)",
    icon: FileSpreadsheet,
    status: "disponivel" as const,
  },
  {
    id: "relacao-bens",
    label: "Relação de Bens Adquiridos",
    description: "Inventário de bens de capital comprados",
    icon: ClipboardList,
    status: "em-breve" as const,
  },
  {
    id: "termo-doacao",
    label: "Termo de Doação",
    description: "Incorporação de bens ao patrimônio da escola",
    icon: FileSignature,
    status: "em-breve" as const,
  },
  {
    id: "consolidacao-precos",
    label: "Consolidação de Pesquisas de Preços",
    description: "Comparativo de orçamentos por item adquirido",
    icon: Coins,
    status: "em-breve" as const,
  },
  {
    id: "ata-conselho",
    label: "Ata do Conselho Escolar",
    description: "Deliberação sobre plano de aplicação e contas",
    icon: ScrollText,
    status: "em-breve" as const,
  },
  {
    id: "parecer-fiscal",
    label: "Parecer do Conselho Fiscal",
    description: "Atesta a regularidade da execução dos recursos",
    icon: ShieldCheck,
    status: "em-breve" as const,
  },
] as const;

type DocumentStatus = "disponivel" | "em-breve" | "pendente";

const statusBadge: Record<DocumentStatus, { label: string; className: string }> = {
  disponivel: {
    label: "Disponível",
    className: "bg-success/10 border-success/20 text-success",
  },
  "em-breve": {
    label: "Em breve",
    className: "bg-muted/40 border-border/50 text-muted-foreground",
  },
  pendente: {
    label: "Pendente",
    className: "bg-warning/10 border-warning/20 text-warning",
  },
};

/* ─── Props ─── */

interface DocumentMenuProps {
  /** Nome da escola (exibido no toast de confirmação) */
  schoolName: string;
  /** "button" = botão completo com texto; "icon" = ícone compacto para tabelas */
  variant?: "button" | "icon";
  /** Classes extras no trigger */
  className?: string;
}

/* ─── Componente ─── */

export function DocumentMenu({
  schoolName,
  variant = "button",
  className,
}: DocumentMenuProps) {
  const handleSelect = (docLabel: string, status: DocumentStatus) => {
    if (status === "disponivel") {
      toast.info(`Em breve: gerar ${docLabel} — ${schoolName}`);
    } else {
      toast.info(`${docLabel} — funcionalidade em desenvolvimento`);
    }
  };

  const handleGenerateAll = () => {
    toast.info(`Em breve: gerar todos os documentos — ${schoolName}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "button" ? (
          <Button size="sm" className={className}>
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Gerar documentos
            <ChevronDown className="ml-2 h-3.5 w-3.5 opacity-60" />
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${className ?? ""}`}
            aria-label="Gerar documentos"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[340px] bg-popover/95 backdrop-blur-md border-border/60 shadow-xl shadow-primary/5"
      >
        <DropdownMenuLabel className="pb-1">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Documentos da prestação de contas
          </p>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuGroup>
          {DOCUMENTOS.map((doc) => {
            const Icon = doc.icon;
            const badge = statusBadge[doc.status];
            return (
              <DropdownMenuItem
                key={doc.id}
                onClick={() => handleSelect(doc.label, doc.status)}
                className="flex items-start gap-3 px-3 py-2.5 cursor-pointer focus:bg-muted/40"
              >
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/8 text-primary">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{doc.label}</p>
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] px-1.5 py-0 h-4 leading-4 ${badge.className}`}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {doc.description}
                  </p>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem
          onClick={handleGenerateAll}
          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer focus:bg-muted/40"
        >
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Download className="h-3.5 w-3.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Gerar todos os documentos</p>
            <p className="text-xs text-muted-foreground">
              Pacote completo da prestação de contas
            </p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
