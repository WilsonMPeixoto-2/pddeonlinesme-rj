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
  MoreVertical, FileText, Eye, Trash2, ArrowUpRight,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExercicio } from "@/hooks/useExercicio";
import { cn } from "@/lib/utils";
import { fmtBRL } from "@/lib/formatters";

/* ─── Types ─── */

type Status = "pronta" | "incompleta" | "pendente";
type StatusFilter = "todas" | Status;
type Programa = "basico" | "qualidade" | "equidade";
type ProgramaFilter = "todos" | Programa;

type Unidade = {
  id: string;
  designacao: string;
  nome: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  endereco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  alunos: number | null;
  ativo: boolean | null;
  exercicio: number;
  programa: string;
  reprogramado_custeio: number;
  reprogramado_capital: number;
  parcela_1_custeio: number;
  parcela_1_capital: number;
  parcela_2_custeio: number;
  parcela_2_capital: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
  saldo_estimado: number;
  updated_at: string | null;
};

const PROGRAMAS_CONHECIDOS = new Set<Programa>(["basico", "qualidade", "equidade"]);
const STATUS_CONHECIDOS = new Set<Status>(["pronta", "incompleta", "pendente"]);
const DEFAULT_DOC_TOTAL = 6;

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

const programaConfig: Record<Programa, { label: string; short: string; className: string }> = {
  basico: {
    label: "PDDE Básico",
    short: "Básico",
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  qualidade: {
    label: "PDDE Qualidade",
    short: "Qualidade",
    className: "border-success/30 bg-success/10 text-success",
  },
  equidade: {
    label: "PDDE Equidade",
    short: "Equidade",
    className: "border-warning/40 bg-warning/10 text-warning",
  },
};

function resolveProgramaConfig(programa: string) {
  if (PROGRAMAS_CONHECIDOS.has(programa as Programa)) {
    return programaConfig[programa as Programa];
  }
  return {
    label: programa || "Programa indefinido",
    short: programa || "—",
    className: "border-border/50 bg-muted/30 text-muted-foreground",
  };
}

/* ─── Execution bar (saldo vs gasto) ─── */

function ExecutionBar({ recebido, saldo, gasto }: { recebido: number; saldo: number; gasto: number }) {
  const total = recebido + saldo;
  const pct = total > 0 ? Math.min(100, (gasto / total) * 100) : 0;
  const tone =
    pct >= 90 ? "bg-warning" : pct >= 50 ? "bg-primary" : "bg-success";
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px]">
        <span className="font-medium tabular-nums">{fmtBRL(gasto)}</span>
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
  onEdit,
  onView,
  onDelete,
}: {
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
  const { exercicio } = useExercicio();
  const [q, setQ] = useState("");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [statusByKey, setStatusByKey] = useState<Record<string, Status>>({});
  const [docCountByKey, setDocCountByKey] = useState<Record<string, number>>({});
  const [docTotal, setDocTotal] = useState(DEFAULT_DOC_TOTAL);
  const [loading, setLoading] = useState(true);
  const [confirmLote, setConfirmLote] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [programaFilter, setProgramaFilter] = useState<ProgramaFilter>("todos");

  // Documents panel state
  const [docsPanelOpen, setDocsPanelOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Unidade | null>(null);

  useEffect(() => {
    setLoading(true);
    const exercicioNum = Number(exercicio);
    (async () => {
      const [unidadesResp, statusResp, docsResp, typesResp] = await Promise.all([
        supabase
          .from("vw_unidades_escolares_frontend")
          .select(
            "id, designacao, nome, inep, cnpj, diretor, email, endereco, agencia, conta_corrente, alunos, ativo, exercicio, programa, reprogramado_custeio, reprogramado_capital, parcela_1_custeio, parcela_1_capital, parcela_2_custeio, parcela_2_capital, saldo_anterior, recebido, gasto, saldo_estimado, updated_at",
          )
          .eq("exercicio", exercicioNum)
          .order("designacao", { ascending: true })
          .order("programa", { ascending: true }),
        supabase
          .from("vw_unidades_status")
          .select("unidade_id, programa, status, exercicio")
          .eq("exercicio", exercicioNum),
        supabase
          .from("documentos_gerados")
          .select("unidade_id, programa, status")
          .eq("exercicio", exercicioNum)
          .eq("status", "gerado"),
        supabase
          .from("document_types")
          .select("id", { count: "exact", head: true })
          .eq("is_active", true),
      ]);

      if (unidadesResp.error) toast.error(unidadesResp.error.message);
      if (statusResp.error) toast.error(statusResp.error.message);
      if (docsResp.error) toast.error(docsResp.error.message);

      const normalized: Unidade[] = (unidadesResp.data ?? [])
        .filter(
          (
            r,
          ): r is typeof r & {
            id: string;
            designacao: string;
            nome: string;
            exercicio: number;
            programa: string;
          } =>
            typeof r.id === "string" &&
            typeof r.designacao === "string" &&
            typeof r.nome === "string" &&
            typeof r.exercicio === "number" &&
            typeof r.programa === "string",
        )
        .map((r) => ({
          id: r.id,
          designacao: r.designacao,
          nome: r.nome,
          inep: r.inep,
          cnpj: r.cnpj,
          diretor: r.diretor,
          email: r.email,
          endereco: r.endereco,
          agencia: r.agencia,
          conta_corrente: r.conta_corrente,
          alunos: r.alunos,
          ativo: r.ativo,
          exercicio: r.exercicio,
          programa: r.programa,
          reprogramado_custeio: Number(r.reprogramado_custeio ?? 0),
          reprogramado_capital: Number(r.reprogramado_capital ?? 0),
          parcela_1_custeio: Number(r.parcela_1_custeio ?? 0),
          parcela_1_capital: Number(r.parcela_1_capital ?? 0),
          parcela_2_custeio: Number(r.parcela_2_custeio ?? 0),
          parcela_2_capital: Number(r.parcela_2_capital ?? 0),
          saldo_anterior: Number(r.saldo_anterior ?? 0),
          recebido: Number(r.recebido ?? 0),
          gasto: Number(r.gasto ?? 0),
          saldo_estimado: Number(r.saldo_estimado ?? 0),
          updated_at: r.updated_at,
        }));
      setUnidades(normalized);

      const newStatusByKey: Record<string, Status> = {};
      (statusResp.data ?? []).forEach((s) => {
        if (!s.unidade_id || !s.programa || !s.status) return;
        if (STATUS_CONHECIDOS.has(s.status as Status)) {
          newStatusByKey[`${s.unidade_id}:${s.programa}`] = s.status as Status;
        }
      });
      setStatusByKey(newStatusByKey);

      const newDocCount: Record<string, number> = {};
      (docsResp.data ?? []).forEach((d) => {
        if (!d.unidade_id || !d.programa) return;
        const key = `${d.unidade_id}:${d.programa}`;
        newDocCount[key] = (newDocCount[key] ?? 0) + 1;
      });
      setDocCountByKey(newDocCount);

      setDocTotal(typesResp.count ?? DEFAULT_DOC_TOTAL);
      setLoading(false);
    })();
  }, [exercicio]);

  const lista = useMemo(() => {
    let filtered = unidades;
    if (q.trim()) {
      const lower = q.toLowerCase();
      const raw = q.trim();
      filtered = filtered.filter(
        (e) =>
          e.nome.toLowerCase().includes(lower) ||
          e.designacao.toLowerCase().includes(lower) ||
          (e.diretor ?? "").toLowerCase().includes(lower) ||
          (e.email ?? "").toLowerCase().includes(lower) ||
          (e.inep ?? "").includes(raw) ||
          (e.cnpj ?? "").includes(raw) ||
          (e.agencia ?? "").toLowerCase().includes(lower) ||
          (e.conta_corrente ?? "").toLowerCase().includes(lower),
      );
    }
    if (statusFilter !== "todas") {
      filtered = filtered.filter(
        (e) => (statusByKey[`${e.id}:${e.programa}`] ?? "pendente") === statusFilter,
      );
    }
    if (programaFilter !== "todos") {
      filtered = filtered.filter((e) => e.programa === programaFilter);
    }
    return filtered;
  }, [q, statusFilter, programaFilter, unidades, statusByKey]);

  const isSearching =
    q.trim().length > 0 || statusFilter !== "todas" || programaFilter !== "todos";

  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
    setProgramaFilter("todos");
  };

  const statusCounts = useMemo(() => {
    const counts: Record<Status, number> = { pronta: 0, incompleta: 0, pendente: 0 };
    unidades.forEach((e) => {
      const st = statusByKey[`${e.id}:${e.programa}`] ?? "pendente";
      counts[st]++;
    });
    return counts;
  }, [unidades, statusByKey]);

  const programaCounts = useMemo(() => {
    const counts: Record<Programa, number> = { basico: 0, qualidade: 0, equidade: 0 };
    unidades.forEach((e) => {
      if (PROGRAMAS_CONHECIDOS.has(e.programa as Programa)) {
        counts[e.programa as Programa]++;
      }
    });
    return counts;
  }, [unidades]);

  const COLUMNS = 7;

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
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(statusConfig) as (keyof typeof statusConfig)[]).map((key) => {
                const active = statusFilter === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setStatusFilter(active ? "todas" : key)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      active
                        ? cn(statusConfig[key].badgeClass, "shadow-[0_0_12px_hsl(var(--primary)/0.15)]")
                        : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                    )}
                  >
                    <span className={`inline-block h-1.5 w-1.5 rounded-full ${statusConfig[key].dotClass}`} />
                    <span className="font-semibold tabular-nums">{statusCounts[key]}</span>
                    <span>{statusConfig[key].label.toLowerCase()}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Programa filter pills (PDDE Básico / Qualidade / Equidade) */}
        {!loading && unidades.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Programa
            </span>
            <button
              type="button"
              onClick={() => setProgramaFilter("todos")}
              aria-pressed={programaFilter === "todos"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                programaFilter === "todos"
                  ? "border-foreground/30 bg-foreground/5 text-foreground"
                  : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
              )}
            >
              Todos
              <span className="font-semibold tabular-nums">{unidades.length}</span>
            </button>
            {(Object.keys(programaConfig) as Programa[]).map((key) => {
              const active = programaFilter === key;
              const cfg = programaConfig[key];
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProgramaFilter(active ? "todos" : key)}
                  aria-pressed={active}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? cfg.className
                      : "border-border/50 bg-muted/20 text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                  )}
                >
                  {cfg.short}
                  <span className="font-semibold tabular-nums">{programaCounts[key]}</span>
                </button>
              );
            })}
            {isSearching && (
              <button
                type="button"
                onClick={clearFilters}
                className="ml-auto inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
              >
                <X className="h-3 w-3" />
                Limpar filtros
              </button>
            )}
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, designação, INEP, CNPJ, diretor(a)…"
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
                <SelectItem value="todas">Todos status</SelectItem>
                <SelectItem value="pronta">Prontas</SelectItem>
                <SelectItem value="incompleta">Incompletas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={programaFilter} onValueChange={(v) => setProgramaFilter(v as ProgramaFilter)}>
              <SelectTrigger className="h-10 w-[170px] shrink-0">
                <SelectValue placeholder="Programa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos programas</SelectItem>
                <SelectItem value="basico">PDDE Básico</SelectItem>
                <SelectItem value="qualidade">PDDE Qualidade</SelectItem>
                <SelectItem value="equidade">PDDE Equidade</SelectItem>
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
                  <TableHead className="h-11 min-w-[300px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Unidade escolar
                  </TableHead>
                  <TableHead className="h-11 min-w-[180px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                              onClick={clearFilters}
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
                    const st = statusByKey[`${e.id}:${e.programa}`] ?? "pendente";
                    const cfg = statusConfig[st];
                    const progCfg = resolveProgramaConfig(e.programa);
                    const generated = docCountByKey[`${e.id}:${e.programa}`] ?? 0;
                    const rowKey = `${e.id}:${e.programa}`;
                    return (
                      <TableRow
                        key={rowKey}
                        className="group row-accent border-b border-border/40 transition-colors hover:bg-primary/[0.04]"
                      >
                        <TableCell className="py-3">
                          <div className="flex flex-col gap-1">
                            <button
                              type="button"
                              onClick={() => navigate(`/escolas/${e.id}`)}
                              title="Abrir cadastro completo"
                              className="group/link inline-flex flex-col items-start gap-0.5 self-start rounded-sm text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                              aria-label={`Abrir cadastro de ${e.nome}`}
                            >
                              <span className="inline-flex items-center gap-1.5 font-medium text-primary underline decoration-primary/30 decoration-dotted underline-offset-4 transition-colors group-hover/link:decoration-primary group-hover/link:decoration-solid group-focus-visible/link:decoration-solid">
                                <span>{e.nome}</span>
                                <ArrowUpRight
                                  className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
                                  aria-hidden="true"
                                />
                              </span>
                              <span className="font-mono text-[11px] text-muted-foreground">
                                {e.designacao}
                              </span>
                            </button>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                              <span className="font-mono tabular-nums">
                                INEP {e.inep ?? "—"}
                              </span>
                              <span className="text-border">·</span>
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full border px-1.5 py-0 text-[10px] font-medium",
                                  progCfg.className,
                                )}
                              >
                                {progCfg.short}
                              </span>
                              {(e.agencia || e.conta_corrente) && (
                                <>
                                  <span className="text-border">·</span>
                                  <span
                                    className="font-mono tabular-nums"
                                    title="Agência / Conta corrente"
                                  >
                                    Ag {e.agencia ?? "—"} · CC {e.conta_corrente ?? "—"}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
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
                        <TableCell className="text-right tabular-nums">{e.alunos ?? "—"}</TableCell>
                        <TableCell>
                          <ExecutionBar
                            recebido={Number(e.recebido)}
                            saldo={Number(e.saldo_anterior)}
                            gasto={Number(e.gasto)}
                          />
                        </TableCell>

                        {/* PRIMARY ACTION — Documentos com destaque (O3 + O5) */}
                        <TableCell className="border-l border-border/40 bg-primary/[0.025] p-2">
                          <div className="space-y-1.5">
                            <Button
                              size="sm"
                              variant="default"
                              className="h-9 w-full justify-center gap-2 text-xs shadow-[0_0_16px_hsl(var(--primary)/0.18)] transition-shadow hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                              onClick={() => openDocs(e)}
                            >
                              <FileText className="h-3.5 w-3.5" />
                              Gerar documentos
                            </Button>
                            <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                              <span
                                className={cn(
                                  "font-semibold tabular-nums",
                                  generated > 0 ? "text-success" : "text-muted-foreground/60",
                                )}
                              >
                                {generated}/{docTotal}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          <SecondaryActions
                            onEdit={() => navigate(`/escolas/${e.id}`)}
                            onView={() => navigate(`/escolas/${e.id}`)}
                            onDelete={() => {
                              toast.info(`Em breve: remover ${e.nome}`);
                            }}
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
            <span className="pulse-dot-success mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-success" />
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
        schoolName={selectedEscola?.nome ?? ""}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
