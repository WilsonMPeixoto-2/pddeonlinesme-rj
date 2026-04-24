import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download, FileSpreadsheet, Pencil, Search, SchoolIcon, X, SearchX,
  MoreVertical, FileText, Eye, Trash2,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type Unidade = {
  id: string;
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  alunos: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
};

type StatusFilter = "todas" | "pronta" | "incompleta" | "pendente";

/* ─── Helpers ─── */

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getStatus(e: Unidade) {
  const hasFinancial = Number(e.saldo_anterior) + Number(e.recebido) + Number(e.gasto) > 0;
  const hasIdentity = Boolean(e.designacao?.trim()) && Boolean(e.inep);
  if (hasIdentity && hasFinancial) return "pronta" as const;
  if (hasIdentity || hasFinancial) return "incompleta" as const;
  return "pendente" as const;
}

const statusConfig = {
  pronta: {
    label: "Pronta",
    dotClass: "bg-success",
    badgeClass: "border-success/30 bg-success/10 text-success",
  },
  incompleta: {
    label: "Incompleta",
    dotClass: "bg-warning",
    badgeClass: "border-warning/30 bg-warning/10 text-warning",
  },
  pendente: {
    label: "Pendente",
    dotClass: "bg-destructive",
    badgeClass: "border-destructive/30 bg-destructive/10 text-destructive",
  },
} as const;

/* ─── Execution bar (saldo vs gasto) ─── */

function ExecutionBar({ recebido, saldo, gasto }: { recebido: number; saldo: number; gasto: number }) {
  const total = recebido + saldo;
  const pct = total > 0 ? Math.min(100, (gasto / total) * 100) : 0;
  const tone =
    pct >= 90 ? "bg-warning" : pct >= 50 ? "bg-primary" : "bg-success";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-medium tabular-nums">{fmt(gasto)}</span>
        <span className="text-muted-foreground/70 tabular-nums">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted/40">
        <div
          className={cn("h-full rounded-full transition-all duration-500", tone)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/* ─── Secondary actions menu (smaller, less prominent) ─── */

function SecondaryActions({
  escola,
  onEdit,
  onView,
  onDelete,
}: {
  escola: Unidade;
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          aria-label="Mais ações"
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[200px] bg-popover/95 backdrop-blur-md border-border/60"
      >
        <DropdownMenuItem onClick={onEdit} className="gap-2.5 cursor-pointer">
          <Pencil className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm">Editar cadastro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView} className="gap-2.5 cursor-pointer">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">Ver detalhes</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem
          onClick={onDelete}
          className="gap-2.5 cursor-pointer text-destructive focus:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-sm">Remover</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Main component ─── */

export default function Escolas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmLote, setConfirmLote] = useState(false);
  const [exercicio, setExercicio] = useState("2026");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  // Documents panel state
  const [docsPanelOpen, setDocsPanelOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Unidade | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("unidades_escolares")
        .select("*")
        .order("designacao");
      if (error) toast.error(error.message);
      else setUnidades((data ?? []) as Unidade[]);
      setLoading(false);
    })();
  }, []);

  const lista = useMemo(() => {
    let filtered = unidades;
    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.designacao.toLowerCase().includes(lower) ||
          (e.inep ?? "").includes(q) ||
          (e.diretor ?? "").toLowerCase().includes(lower),
      );
    }
    if (statusFilter !== "todas") {
      filtered = filtered.filter((e) => getStatus(e) === statusFilter);
    }
    return filtered;
  }, [q, statusFilter, unidades]);

  const isSearching = q.trim().length > 0 || statusFilter !== "todas";

  const statusCounts = useMemo(() => {
    const counts = { pronta: 0, incompleta: 0, pendente: 0 };
    unidades.forEach((e) => {
      counts[getStatus(e)]++;
    });
    return counts;
  }, [unidades]);

  const COLUMNS = 8;

  const openDocs = (e: Unidade) => {
    setSelectedEscola(e);
    setDocsPanelOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Cadastro · 4ª CRE · Exercício {exercicio}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Unidades Escolares</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando cadastro…"
                : `${unidades.length} unidades · gere documentos individuais ou em lote.`}
            </p>
          </div>
          {!loading && unidades.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map((key) => (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/50 bg-muted/20 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig[key].dotClass}`} />
                  {statusCounts[key]} {statusConfig[key].label.toLowerCase()}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, INEP ou diretor(a)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 pl-9 pr-9"
              />
              {q.trim() && (
                <button
                  type="button"
                  aria-label="Limpar busca"
                  onClick={() => setQ("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
              <SelectTrigger className="h-10 w-[140px] shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="pronta">Prontas</SelectItem>
                <SelectItem value="incompleta">Incompletas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={exercicio} onValueChange={setExercicio}>
              <SelectTrigger className="h-10 w-[100px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={() => toast.info("Em breve: exportar BASE em .xlsx")}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar BASE
            </Button>
            <Button
              size="sm"
              className="h-10"
              onClick={() => setConfirmLote(true)}
              disabled={unidades.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar lote (.zip)
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-border/70">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md hover:bg-muted/50">
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Designação
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    INEP
                  </TableHead>
                  <TableHead className="h-11 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="h-11 w-[110px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-11 w-[60px] text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Alunos
                  </TableHead>
                  <TableHead className="h-11 w-[200px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Execução financeira
                  </TableHead>
                  {/* Coluna dedicada — destaque para Documentos */}
                  <TableHead className="h-11 w-[170px] border-l border-border/40 bg-primary/5 text-center text-[11px] font-semibold uppercase tracking-wide text-primary/80">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Documentos
                    </span>
                  </TableHead>
                  <TableHead className="h-11 w-[50px] text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: COLUMNS }).map((__, j) => (
                        <TableCell key={j} className="py-3">
                          <Skeleton className={`h-4 ${j === 0 ? "w-3/4" : "w-16 ml-auto"}`} />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : lista.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="p-0">
                      <EmptyState
                        variant="inline"
                        icon={isSearching ? SearchX : SchoolIcon}
                        title={
                          isSearching
                            ? "Nenhum resultado para os filtros aplicados"
                            : "Nenhuma unidade cadastrada ainda"
                        }
                        description={
                          isSearching
                            ? "Verifique o termo digitado ou altere os filtros."
                            : "Importe a BASE ou cadastre uma unidade para começar."
                        }
                        action={
                          isSearching ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => { setQ(""); setStatusFilter("todas"); }}
                            >
                              Limpar filtros
                            </Button>
                          ) : null
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  lista.map((e) => {
                    const st = getStatus(e);
                    const cfg = statusConfig[st];
                    return (
                      <TableRow
                        key={e.id}
                        className="group relative border-b border-border/40 transition-colors hover:bg-primary/[0.03] before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-[2px] before:origin-top before:scale-y-0 before:bg-gradient-to-b before:from-primary/0 before:via-primary before:to-primary/0 before:opacity-0 before:transition-all before:duration-200 hover:before:scale-y-100 hover:before:opacity-100"
                      >

                        <TableCell className="py-3 font-medium">{e.designacao}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                          {e.inep ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{e.diretor ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                              cfg.badgeClass,
                            )}
                          >
                            <span className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{e.alunos}</TableCell>
                        <TableCell>
                          <ExecutionBar
                            recebido={Number(e.recebido)}
                            saldo={Number(e.saldo_anterior)}
                            gasto={Number(e.gasto)}
                          />
                        </TableCell>

                        {/* PRIMARY ACTION — Documentos com destaque */}
                        <TableCell className="border-l border-border/40 bg-primary/[0.025] p-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="h-9 w-full justify-center gap-2 text-xs shadow-[0_0_16px_hsl(var(--primary)/0.18)] transition-shadow hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                            onClick={() => openDocs(e)}
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Gerar documentos
                          </Button>
                        </TableCell>

                        <TableCell className="text-right">
                          <SecondaryActions
                            escola={e}
                            onEdit={() => navigate(`/escolas/${e.id}`)}
                            onView={() => navigate(`/escolas/${e.id}`)}
                            onDelete={() =>
                              toast.info(`Em breve: remover ${e.designacao}`)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            Exibindo <span className="font-medium text-foreground tabular-nums">{lista.length}</span>{" "}
            de <span className="font-medium text-foreground tabular-nums">{unidades.length}</span>
          </span>
          <Badge variant="outline" className="border-success/40 bg-success/5 text-success">
            <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
            Conectado · Supabase
          </Badge>
        </div>
      </div>

      <ConfirmDialog
        open={confirmLote}
        onOpenChange={setConfirmLote}
        tone="primary"
        title="Gerar documentos em lote"
        description={
          <>
            Será gerado um arquivo <strong>.zip</strong> contendo os documentos da prestação de contas
            de cada unidade escolar. O processo pode levar alguns minutos.
          </>
        }
        highlight={`${unidades.length} unidades serão processadas`}
        confirmLabel="Gerar lote"
        onConfirm={() => {
          setConfirmLote(false);
          toast.info("Em breve: geração de lote (.zip)");
        }}
      />

      <DocumentsPanel
        open={docsPanelOpen}
        onOpenChange={setDocsPanelOpen}
        schoolName={selectedEscola?.designacao ?? ""}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
