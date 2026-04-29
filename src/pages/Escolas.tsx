import { useEffect, useMemo, useRef, useState } from "react";

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
  Download, FileSpreadsheet, Search, SchoolIcon, X, SearchX, Rows3, Rows4,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import VirtualizedSchoolsTable from "@/components/escolas/VirtualizedSchoolsTable";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useExercicio } from "@/hooks/useExercicio";
import { cn } from "@/lib/utils";

/* ─── Types ─── */

type Unidade = {
  id: string;
  designacao: string;
  inep: string | null;
  cnpj: string | null;
  diretor: string | null;
  email: string | null;
  endereco: string | null;
  agencia: string | null;
  conta_corrente: string | null;
  alunos: number;
  saldo_anterior: number;
  recebido: number;
  gasto: number;
  reprogramado_custeio: number;
  reprogramado_capital: number;
  parcela_1_custeio: number;
  parcela_1_capital: number;
  parcela_2_custeio: number;
  parcela_2_capital: number;
};

type StatusFilter = "todas" | "pronta" | "incompleta" | "pendente";
type Programa = "basico" | "qualidade" | "equidade";
type ProgramaFilter = "todos" | Programa;

/* ─── Helpers ─── */

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function getStatus(e: Unidade) {
  const hasFinancial =
    Number(e.saldo_anterior) +
      Number(e.recebido) +
      Number(e.gasto) +
      Number(e.parcela_1_custeio ?? 0) +
      Number(e.parcela_1_capital ?? 0) +
      Number(e.parcela_2_custeio ?? 0) +
      Number(e.parcela_2_capital ?? 0) >
    0;
  const hasIdentity =
    Boolean(e.designacao?.trim()) &&
    Boolean(e.inep) &&
    Boolean(e.cnpj) &&
    Boolean(e.agencia) &&
    Boolean(e.conta_corrente);
  if (hasIdentity && hasFinancial) return "pronta" as const;
  if (e.designacao?.trim() || hasFinancial) return "incompleta" as const;
  return "pendente" as const;
}

/** Mock de contagem de documentos por escola (O3 + O5) */
function getDocMeta(e: Unidade) {
  const st = getStatus(e);
  if (st === "pronta") {
    const seed = e.id.charCodeAt(0) % 3;
    const counts = [1, 2, 3];
    const times = ["Há 2 dias", "Há 5 dias", "Há 1 semana"];
    return { generated: counts[seed], total: 6, lastGen: times[seed] };
  }
  if (st === "incompleta") return { generated: 0, total: 6, lastGen: null };
  return { generated: 0, total: 6, lastGen: null };
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

/**
 * Programa PDDE — placeholder visual.
 * O campo `programa` ainda não existe em `unidades_escolares`.
 * Derivamos deterministicamente do id para que o filtro funcione no protótipo.
 * Substituir por `e.programa` quando a coluna for adicionada ao schema.
 */
function getPrograma(e: Unidade): Programa {
  const code = e.id.charCodeAt(0) + e.id.charCodeAt(e.id.length - 1);
  const opts: Programa[] = ["basico", "qualidade", "equidade"];
  return opts[code % 3];
}

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

/* ExecutionBar e SecondaryActions foram movidos para VirtualizedSchoolsTable. */


/* ─── Main component ─── */

export default function Escolas() {
  const [q, setQ] = useState("");
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmLote, setConfirmLote] = useState(false);
  const { exercicio } = useExercicio();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [programaFilter, setProgramaFilter] = useState<ProgramaFilter>("todos");
  const [density, setDensity] = useState<"comfortable" | "compact">(() => {
    if (typeof window === "undefined") return "comfortable";
    const v = window.localStorage.getItem("escolas:density");
    return v === "compact" ? "compact" : "comfortable";
  });

  // Documents panel state
  const [docsPanelOpen, setDocsPanelOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Unidade | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Atalho "/" para focar a busca (ignorado dentro de inputs/áreas editáveis)
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key !== "/") return;
      const t = ev.target as HTMLElement | null;
      const tag = t?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea" || (t && (t as HTMLElement).isContentEditable)) return;
      ev.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

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
      const digits = q.replace(/\D/g, "");
      filtered = filtered.filter((e) => {
        if (e.designacao.toLowerCase().includes(lower)) return true;
        if ((e.diretor ?? "").toLowerCase().includes(lower)) return true;
        if ((e.email ?? "").toLowerCase().includes(lower)) return true;
        if (digits.length >= 2) {
          if ((e.inep ?? "").includes(digits)) return true;
          if ((e.cnpj ?? "").replace(/\D/g, "").includes(digits)) return true;
          if ((e.agencia ?? "").replace(/\D/g, "").includes(digits)) return true;
          if ((e.conta_corrente ?? "").replace(/\D/g, "").includes(digits)) return true;
        }
        return false;
      });
    }
    if (statusFilter !== "todas") {
      filtered = filtered.filter((e) => getStatus(e) === statusFilter);
    }
    if (programaFilter !== "todos") {
      filtered = filtered.filter((e) => getPrograma(e) === programaFilter);
    }
    return filtered;
  }, [q, statusFilter, programaFilter, unidades]);

  const isSearching =
    q.trim().length > 0 || statusFilter !== "todas" || programaFilter !== "todos";

  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
    setProgramaFilter("todos");
  };

  const statusCounts = useMemo(() => {
    const counts = { pronta: 0, incompleta: 0, pendente: 0 };
    unidades.forEach((e) => {
      counts[getStatus(e)]++;
    });
    return counts;
  }, [unidades]);

  const programaCounts = useMemo(() => {
    const counts: Record<Programa, number> = { basico: 0, qualidade: 0, equidade: 0 };
    unidades.forEach((e) => {
      counts[getPrograma(e)]++;
    });
    return counts;
  }, [unidades]);

  

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
                ref={searchRef}
                placeholder="Buscar por nome, INEP, CNPJ, agência, conta, diretor(a)…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="h-10 pl-9 pr-24"
                aria-label="Buscar unidades escolares"
              />
              <div className="pointer-events-none absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1.5">
                {q.trim() ? (
                  <>
                    <span className="rounded-md bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                      {lista.length}
                    </span>
                    <button
                      type="button"
                      aria-label="Limpar busca"
                      onClick={() => setQ("")}
                      className="pointer-events-auto rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </>
                ) : (
                  <kbd className="hidden rounded-md border border-border/60 bg-muted/40 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
                    /
                  </kbd>
                )}
              </div>
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

          <div className="flex flex-wrap items-center gap-2">
            <div
              role="group"
              aria-label="Densidade da tabela"
              className="inline-flex h-10 items-center rounded-md border border-border/60 bg-muted/20 p-0.5"
            >
              <button
                type="button"
                onClick={() => {
                  setDensity("comfortable");
                  try { window.localStorage.setItem("escolas:density", "comfortable"); } catch {}
                }}
                aria-pressed={density === "comfortable"}
                title="Confortável"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors",
                  density === "comfortable"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Rows3 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Confortável</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setDensity("compact");
                  try { window.localStorage.setItem("escolas:density", "compact"); } catch {}
                }}
                aria-pressed={density === "compact"}
                title="Compacto"
                className={cn(
                  "inline-flex h-9 items-center gap-1.5 rounded-[5px] px-2.5 text-xs font-medium transition-colors",
                  density === "compact"
                    ? "bg-card text-foreground shadow-sm ring-1 ring-border/60"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Rows4 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Compacto</span>
              </button>
            </div>
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

        {/* Table — virtualizada com agrupamento por prefixo */}
        <Card className="overflow-hidden border-border/70">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="ml-auto h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : lista.length === 0 ? (
            <div className="p-2">
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
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Limpar filtros
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <VirtualizedSchoolsTable
              unidades={lista}
              getStatus={getStatus}
              getPrograma={getPrograma}
              getDocMeta={getDocMeta}
              statusConfig={statusConfig}
              programaConfig={programaConfig}
              fmt={fmt}
              onOpenDocs={openDocs}
            />
          )}
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
        schoolName={selectedEscola?.designacao ?? ""}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
