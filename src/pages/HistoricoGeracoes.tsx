import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  History,
  Info,
  Loader2,
  Search,
  XCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDocumentGenerationRuns, type DocumentGenerationRun, type DocumentGenerationRunStatus } from "@/hooks/useDocumentGenerationRuns";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  DocumentGenerationRunStatus,
  { label: string; Icon: typeof CheckCircle2; tone: string; glow: string }
> = {
  em_execucao: {
    label: "Em execução",
    Icon: Loader2,
    tone: "text-primary border-primary/30 bg-primary/10",
    glow: "shadow-[0_0_15px_rgba(59,130,246,0.15)]",
  },
  concluido: {
    label: "Concluído",
    Icon: CheckCircle2,
    tone: "text-success border-success/30 bg-success/10",
    glow: "shadow-[0_0_15px_rgba(34,197,94,0.15)]",
  },
  falha: {
    label: "Falha",
    Icon: XCircle,
    tone: "text-destructive border-destructive/30 bg-destructive/10",
    glow: "shadow-[0_0_15px_rgba(239,68,68,0.15)]",
  },
  cancelado: {
    label: "Cancelado",
    Icon: AlertTriangle,
    tone: "text-warning border-warning/30 bg-warning/10",
    glow: "shadow-[0_0_15px_rgba(234,179,8,0.15)]",
  },
};

const DOC_TYPE_LABEL: Record<string, string> = {
  demonstrativo_basico_lote: "Demonstrativo Básico — lote",
};

export default function HistoricoGeracoes() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [exercicioFilter, setExercicioFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedRunId, setExpandedRunId] = useState<string | null>(null);

  const limit = 10;

  const { data, isLoading, error } = useDocumentGenerationRuns({
    limit,
    page,
    status: statusFilter,
    exercicio: exercicioFilter,
  });

  const runs = useMemo(() => data?.runs ?? [], [data]);
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / limit));

  // Filtragem local secundária (busca textual)
  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return runs;
    const q = searchQuery.toLowerCase();
    return runs.filter((run) => {
      const typeLabel = (DOC_TYPE_LABEL[run.doc_type] ?? run.doc_type).toLowerCase();
      const prog = run.programa.toLowerCase();
      return typeLabel.includes(q) || prog.includes(q) || run.id.includes(q);
    });
  }, [runs, searchQuery]);

  const handleToggleExpand = (runId: string) => {
    setExpandedRunId((prev) => (prev === runId ? null : runId));
  };

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const formatDuration = (start: string, end?: string | null) => {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    if (ms < 0) return "0s";
    const sec = Math.floor(ms / 1000);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m > 0) return `${m}m ${s}s`;
    return `${sec}s`;
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-1 border-b border-border/60 pb-5">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            <Link to="/dashboard" viewTransition className="hover:text-primary transition-colors">
              Painel
            </Link>
            <span>/</span>
            <span className="text-foreground/80">Histórico de Gerações</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Histórico de Gerações</h1>
          <p className="text-sm text-muted-foreground">
            Auditoria completa de execuções, diagnósticos de pendências e contagens de demonstrativos em lote.
          </p>
        </div>

        {/* Filters Card */}
        <Card className="border-border/70 shadow-sm bg-card/60 backdrop-blur-sm">
          <CardContent className="p-4 flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full space-y-1.5">
              <label htmlFor="search" className="text-xs font-medium text-muted-foreground">
                Buscar por termo
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Demonstrativo, programa ou ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-10 border-border/60 bg-background/50 focus:bg-background"
                />
              </div>
            </div>

            <div className="w-full md:w-[160px] space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={statusFilter}
                onValueChange={(val) => {
                  setStatusFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 border-border/60 bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-border/60 bg-popover/95 backdrop-blur-md">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="concluido">Concluído</SelectItem>
                  <SelectItem value="em_execucao">Em execução</SelectItem>
                  <SelectItem value="falha">Falha</SelectItem>
                  <SelectItem value="cancelado">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-[140px] space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Exercício</label>
              <Select
                value={exercicioFilter}
                onValueChange={(val) => {
                  setExercicioFilter(val);
                  setPage(1);
                }}
              >
                <SelectTrigger className="h-10 border-border/60 bg-background/50">
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent className="border-border/60 bg-popover/95 backdrop-blur-md">
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setExercicioFilter("all");
                setPage(1);
              }}
              className="h-10 border-border/60 bg-background/40 hover:bg-background/80 w-full md:w-auto"
            >
              Limpar filtros
            </Button>
          </CardContent>
        </Card>

        {/* History Table Card */}
        <Card className="border-border/70 overflow-hidden shadow-md">
          <CardHeader className="border-b border-border/60 bg-muted/20 py-4 px-6 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="h-4.5 w-4.5 text-primary" />
              <CardTitle className="text-sm font-semibold">Corridas de Geração Documental</CardTitle>
            </div>
            <Badge variant="outline" className="font-mono tabular-nums text-xs bg-muted/40 border-border/70">
              {totalCount} registro{totalCount === 1 ? "" : "s"}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-medium">Carregando histórico…</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-4">
                <div className="h-12 w-12 rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-base">Falha ao buscar dados</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  {error.message || "Verifique sua conexão com o banco do Supabase e tente novamente."}
                </p>
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-4">
                <Clock className="h-10 w-10 text-muted-foreground/40" />
                <h3 className="font-semibold text-base">Nenhuma corrida localizada</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Não encontramos registros que correspondam aos filtros definidos.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border/50 bg-muted/10">
                      <TableHead className="w-10 text-center text-[10px] uppercase font-bold tracking-wider">#</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Documento / Lote</TableHead>
                      <TableHead className="hidden md:table-cell text-[10px] uppercase font-bold tracking-wider text-center">Exercício</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center">Sucessos</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider text-center">Falhas</TableHead>
                      <TableHead className="hidden sm:table-cell text-[10px] uppercase font-bold tracking-wider">Início</TableHead>
                      <TableHead className="text-[10px] uppercase font-bold tracking-wider">Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRuns.map((run, index) => {
                      const status = run.status as DocumentGenerationRunStatus;
                      const meta = STATUS_META[status];
                      const Icon = meta.Icon;
                      const isExpanded = expandedRunId === run.id;
                      const rowNum = (page - 1) * limit + index + 1;

                      return (
                        <TableRow
                          key={run.id}
                          className={cn(
                            "group border-b border-border/40 hover:bg-muted/15 transition-colors cursor-pointer",
                            isExpanded && "bg-muted/10",
                          )}
                          onClick={() => handleToggleExpand(run.id)}
                        >
                          <TableCell className="text-center font-mono text-[10px] text-muted-foreground tabular-nums py-3.5">
                            {rowNum}
                          </TableCell>
                          <TableCell className="font-medium py-3.5">
                            <div className="space-y-0.5">
                              <p className="text-xs">
                                {DOC_TYPE_LABEL[run.doc_type] ?? run.doc_type}
                              </p>
                              <p className="text-[10px] text-muted-foreground font-mono">
                                ID: {run.id.slice(0, 8)}...
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-center font-mono text-xs py-3.5 tabular-nums">
                            {run.exercicio}
                          </TableCell>
                          <TableCell className="text-center font-mono text-xs py-3.5 text-success font-semibold tabular-nums">
                            {run.total_sucesso}
                          </TableCell>
                          <TableCell
                            className={cn(
                              "text-center font-mono text-xs py-3.5 tabular-nums",
                              run.total_falha > 0 ? "text-destructive font-semibold" : "text-muted-foreground opacity-60",
                            )}
                          >
                            {run.total_falha}
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-xs text-muted-foreground py-3.5 font-mono tabular-nums">
                            {formatDateTime(run.started_at)}
                          </TableCell>
                          <TableCell className="py-3.5">
                            <Badge
                              variant="outline"
                              className={cn(
                                "h-5.5 px-2 text-[10px] gap-1 font-medium",
                                meta.tone,
                                meta.glow,
                              )}
                            >
                              <Icon className={cn("h-3 w-3 shrink-0", status === "em_execucao" && "animate-spin")} />
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right py-3.5 pr-4">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted/40">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expanded Run Detail (Overlay and Drawer using Framer Motion) */}
        <AnimatePresence>
          {expandedRunId && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            >
              {(() => {
                const run = runs.find((r) => r.id === expandedRunId);
                if (!run) return null;

                const status = run.status as DocumentGenerationRunStatus;
                const meta = STATUS_META[status];
                const failList = (run.falhas as Array<{ escola?: string; erro?: string; error?: string; message?: string }>) || [];

                return (
                  <Card className="border-primary/20 shadow-lg bg-card/60 backdrop-blur-md overflow-hidden ring-1 ring-primary/10">
                    <CardHeader className="border-b border-border/50 bg-primary/5 py-4 px-6 flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <CardTitle className="text-sm font-semibold">Detalhamento da Corrida</CardTitle>
                        <CardDescription className="text-xs font-mono">ID: {run.id}</CardDescription>
                      </div>
                      <Badge variant="outline" className={cn("h-6 text-[10px] px-2", meta.tone)}>
                        {meta.label}
                      </Badge>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Iniciado por</p>
                          <p className="text-xs font-medium truncate font-mono">{run.user_id}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Início / Fim</p>
                          <p className="text-xs font-medium font-mono tabular-nums leading-snug">
                            {formatDateTime(run.started_at)}
                            {run.completed_at && (
                              <>
                                <br />
                                <span className="opacity-70">{formatDateTime(run.completed_at)}</span>
                              </>
                            )}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Duração total</p>
                          <p className="text-sm font-semibold font-mono tabular-nums">
                            {formatDuration(run.started_at, run.completed_at)}
                          </p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-background/40 p-3 space-y-1">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Aproveitamento</p>
                          <p className="text-sm font-semibold font-mono tabular-nums text-success">
                            {run.total_alvo > 0 ? `${Math.round((run.total_sucesso / run.total_alvo) * 100)}%` : "0%"}
                            <span className="text-xs font-normal text-muted-foreground ml-1">
                              ({run.total_sucesso}/{run.total_alvo})
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Diagnostic list of failures */}
                      {run.total_falha > 0 && (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-destructive font-medium text-xs">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Inconsistências Administrativas localizadas ({run.total_falha})</span>
                          </div>

                          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-destructive/20 bg-destructive/[0.02] p-1.5 space-y-1.5 custom-scrollbar">
                            {failList.length === 0 ? (
                              <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                                <Info className="h-3.5 w-3.5" />
                                Nenhuma descrição detalhada salva no log de falhas.
                              </div>
                            ) : (
                              failList.map((fail, i) => {
                                const schoolName = fail.escola || fail.escola === "" ? fail.escola : "Unidade Escolar Desconhecida";
                                const errorMsg = fail.erro || fail.error || fail.message || "Pendência cadastral ou erro genérico";
                                return (
                                  <div
                                    key={i}
                                    className="flex items-start gap-2.5 rounded border border-destructive/15 bg-background/80 p-3 text-xs"
                                  >
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-destructive/10 text-destructive font-mono text-[9px] tabular-nums font-bold">
                                      {i + 1}
                                    </span>
                                    <div className="min-w-0 space-y-1">
                                      <p className="font-semibold text-foreground truncate">{schoolName}</p>
                                      <p className="text-muted-foreground leading-relaxed text-[11px]">{errorMsg}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-border/40 pt-4 px-1">
            <span className="text-xs text-muted-foreground tabular-nums">
              Página <strong className="text-foreground font-medium">{page}</strong> de{" "}
              <strong className="text-foreground font-medium">{totalPages}</strong> · exibindo registros{" "}
              <strong className="text-foreground font-medium">{(page - 1) * limit + 1}</strong> a{" "}
              <strong className="text-foreground font-medium">{Math.min(page * limit, totalCount)}</strong>
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="h-8 border-border/60 bg-background/50 hover:bg-background"
              >
                <ChevronLeft className="mr-1 h-3.5 w-3.5" /> Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="h-8 border-border/60 bg-background/50 hover:bg-background"
              >
                Próxima <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
