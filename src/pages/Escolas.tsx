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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download, FileSpreadsheet, Pencil, Search, SchoolIcon, X, SearchX,
  MoreHorizontal, ClipboardList, FileSignature, Coins, ScrollText,
  ShieldCheck, ArrowDownToLine,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
    badgeClass: "border-success/30 bg-success/8 text-success",
  },
  incompleta: {
    label: "Incompleta",
    dotClass: "bg-warning",
    badgeClass: "border-warning/30 bg-warning/8 text-warning",
  },
  pendente: {
    label: "Pendente",
    dotClass: "bg-destructive",
    badgeClass: "border-destructive/30 bg-destructive/8 text-destructive",
  },
} as const;

/* ─── Inline action menu for each row ─── */

function RowActions({ escola, onEdit }: { escola: Unidade; onEdit: () => void }) {
  const docToast = (doc: string) =>
    toast.info(`Em breve: gerar ${doc} — ${escola.designacao}`);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          aria-label="Ações"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-[280px] bg-popover/95 backdrop-blur-md border-border/60 shadow-xl shadow-primary/5"
      >
        <DropdownMenuItem onClick={onEdit} className="gap-3 cursor-pointer">
          <Pencil className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium">Editar cadastro</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuLabel className="pb-1">
          <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Gerar documento
          </p>
        </DropdownMenuLabel>

        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => docToast("Demonstrativo Básico")} className="gap-3 cursor-pointer">
            <FileSpreadsheet className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Demonstrativo Básico</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docToast("Relação de Bens")} className="gap-3 cursor-pointer">
            <ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Relação de Bens Adquiridos</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docToast("Termo de Doação")} className="gap-3 cursor-pointer">
            <FileSignature className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Termo de Doação</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docToast("Consolidação de Preços")} className="gap-3 cursor-pointer">
            <Coins className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Consolidação de Preços</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docToast("Ata do Conselho")} className="gap-3 cursor-pointer">
            <ScrollText className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Ata do Conselho Escolar</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => docToast("Parecer Fiscal")} className="gap-3 cursor-pointer">
            <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm">Parecer do Conselho Fiscal</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>

        <DropdownMenuSeparator className="bg-border/50" />

        <DropdownMenuItem
          onClick={() => toast.info(`Em breve: gerar todos os documentos — ${escola.designacao}`)}
          className="gap-3 cursor-pointer"
        >
          <ArrowDownToLine className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium">Gerar todos os documentos</span>
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

    // Text search
    if (q.trim()) {
      const lower = q.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.designacao.toLowerCase().includes(lower) ||
          (e.inep ?? "").includes(q) ||
          (e.diretor ?? "").toLowerCase().includes(lower)
      );
    }

    // Status filter
    if (statusFilter !== "todas") {
      filtered = filtered.filter((e) => getStatus(e) === statusFilter);
    }

    return filtered;
  }, [q, statusFilter, unidades]);

  const isSearching = q.trim().length > 0 || statusFilter !== "todas";

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { pronta: 0, incompleta: 0, pendente: 0 };
    unidades.forEach((e) => { counts[getStatus(e)]++; });
    return counts;
  }, [unidades]);

  const COLUMNS = 9; // updated column count

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Cadastro · 4ª CRE · Exercício {exercicio}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Unidades Escolares</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando cadastro…"
                : `${unidades.length} unidades · edite a BASE e gere demonstrativos individuais ou em lote.`}
            </p>
          </div>
          {/* Status summary pills */}
          {!loading && unidades.length > 0 && (
            <div className="flex gap-2">
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
          <div className="flex flex-1 items-center gap-2">
            {/* Search */}
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

            {/* Status filter */}
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

            {/* Exercise selector */}
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
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Designação
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    INEP
                  </TableHead>
                  <TableHead className="h-10 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="h-10 w-[100px] text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Alunos
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Saldo ant.
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Recebido
                  </TableHead>
                  <TableHead className="h-10 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Gasto
                  </TableHead>
                  <TableHead className="h-10 w-[60px] text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Ações
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
                      <TableRow key={e.id} className="group">
                        <TableCell className="font-medium">{e.designacao}</TableCell>
                        <TableCell className="font-mono text-xs text-muted-foreground tabular-nums">
                          {e.inep ?? "—"}
                        </TableCell>
                        <TableCell className="text-sm">{e.diretor ?? "—"}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${cfg.badgeClass}`}
                          >
                            <span className={`inline-block h-1.5 w-1.5 rounded-full ${cfg.dotClass}`} />
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{e.alunos}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(e.saldo_anterior))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(e.recebido))}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(Number(e.gasto))}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end opacity-80 transition-opacity group-hover:opacity-100">
                            <RowActions
                              escola={e}
                              onEdit={() => navigate(`/escolas/${e.id}`)}
                            />
                          </div>
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
    </AppLayout>
  );
}
