import { useMemo, useRef, useState, useEffect } from "react";
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
  MoreVertical, FileText, Eye, Trash2, ArrowUpRight, AlertCircle,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useUnidadesLocalizador,
  type UnidadeLocalizador,
} from "@/hooks/useUnidadesLocalizador";
import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadesDetalheLista } from "@/hooks/useUnidadesDetalheLista";
import { useGerarDemonstrativosLote } from "@/hooks/useGerarDemonstrativosLote";
import type { UnidadeDetalhe } from "@/hooks/useUnidadeDetalhe";
import { hasCadastroEssencialCompleto } from "@/lib/demonstrativo/mapUnidadeToMemoria";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";

const PROGRAMA = "basico";
/* ─── Types ─── */

// Foundation v1: /escolas opera como localizador a partir de vw_unidades_localizador.
// O tipo vem do hook, que ja faz o narrowing de id/designacao no boundary.
type Unidade = UnidadeLocalizador;

type StatusFilter = "todas" | "completo" | "incompleto";

/* ─── Helpers ─── */

// Status reflete os campos cadastrais essenciais do Demonstrativo.
// INEP nao entra porque nao compoe o template atual.
function getStatus(e: Unidade, detalhe?: UnidadeDetalhe) {
  const cadastro = {
    designacao: detalhe?.designacao ?? e.designacao,
    cnpj: detalhe?.cnpj ?? e.cnpj,
    endereco: detalhe?.endereco,
    diretor: detalhe?.diretor ?? e.diretor,
    agencia: detalhe?.agencia,
    conta_corrente: detalhe?.conta_corrente,
  };

  return hasCadastroEssencialCompleto(cadastro) ? "completo" as const : "incompleto" as const;
}

const statusConfig = {
  completo: {
    label: "Cadastro completo",
    dotClass: "ds-dot-success",
    badgeClass: "ds-badge-success",
  },
  incompleto: {
    label: "Cadastro incompleto",
    dotClass: "ds-dot-warning",
    badgeClass: "ds-badge-warning",
  },
} as const;

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
  const [q, setQ] = useState("");
  const [confirmLote, setConfirmLote] = useState(false);
  const { exercicio } = useExercicio();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");

  // Documents panel state
  const [docsPanelOpen, setDocsPanelOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Unidade | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const prefetchUnidade = (unidadeId: string) => {
    const exercicioNumber = Number.parseInt(exercicio, 10);
    queryClient.prefetchQuery({
      queryKey: ["unidade-detalhe", unidadeId, exercicioNumber, "basico"],
      queryFn: async () => {
        const { data, error } = await supabase
          .from("vw_unidade_detalhe")
          .select(
            "unidade_id, designacao, nome, inep, cnpj, diretor, endereco, banco, agencia, conta_corrente, exercicio, programa, reprogramado_custeio, reprogramado_capital, parcela_1_custeio, parcela_1_capital, parcela_2_custeio, parcela_2_capital, total_reprogramado, total_parcelas, total_disponivel_inicial, updated_at"
          )
          .eq("unidade_id", unidadeId)
          .eq("exercicio", exercicioNumber)
          .eq("programa", "basico")
          .maybeSingle();

        if (error) {
          throw new Error(error.message);
        }

        return data ?? null;
      },
      staleTime: 5 * 60 * 1000,
    });
  };

  // Foundation v1: dados vem da view via React Query.
  const { data, isLoading, error, refetch, isFetching } = useUnidadesLocalizador();
  const unidades: Unidade[] = useMemo(() => data ?? [], [data]);
  const loading = isLoading;

  // Lote (Marco 9B + Marco 15): dados cadastrais essenciais + hook de geracao real.
  const { data: unidadesDetalhe, isLoading: loadingDetalheLista } = useUnidadesDetalheLista({
    exercicio,
    programa: PROGRAMA,
  });
  const lote = useGerarDemonstrativosLote();

  const detalheByUnidadeId = useMemo(() => {
    const entries = (unidadesDetalhe ?? [])
      .filter((u) => Boolean(u.unidade_id))
      .map((u) => [u.unidade_id, u] as const);

    return new Map(entries);
  }, [unidadesDetalhe]);

  useEffect(() => {
    if (error) toast.error(error.message ?? "Erro ao carregar unidades.");
  }, [error]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/") return;

      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName?.toLowerCase();
      if (tagName === "input" || tagName === "textarea" || target?.isContentEditable) return;

      event.preventDefault();
      searchRef.current?.focus();
      searchRef.current?.select();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const lista = useMemo(() => {
    let filtered = unidades;
    if (q.trim()) {
      const lower = q.toLowerCase();
      const digits = q.replace(/\D/g, "");
      filtered = filtered.filter((e) => {
        if (e.designacao.toLowerCase().includes(lower)) return true;
        if ((e.nome ?? "").toLowerCase().includes(lower)) return true;
        if ((e.diretor ?? "").toLowerCase().includes(lower)) return true;

        if (digits.length >= 2) {
          if ((e.inep ?? "").includes(digits)) return true;
          if ((e.cnpj ?? "").replace(/\D/g, "").includes(digits)) return true;
        }

        return false;
      });
    }
    if (statusFilter !== "todas") {
      filtered = filtered.filter((e) => getStatus(e, detalheByUnidadeId.get(e.id)) === statusFilter);
    }
    return filtered;
  }, [detalheByUnidadeId, q, statusFilter, unidades]);

  const isSearching =
    q.trim().length > 0 || statusFilter !== "todas";

  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
  };

  const statusCounts = useMemo(() => {
    const counts = { completo: 0, incompleto: 0 };
    unidades.forEach((e) => {
      counts[getStatus(e, detalheByUnidadeId.get(e.id))]++;
    });
    return counts;
  }, [detalheByUnidadeId, unidades]);

  const COLUMNS = 5;

  const openDocs = (e: Unidade) => {
    setSelectedEscola(e);
    setDocsPanelOpen(true);
  };

  const handleExportSelection = async () => {
    try {
      // Lazy-import keeps exceljs out of the initial bundle.
      const { default: ExcelJS } = await import("exceljs");
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Unidades");
      worksheet.columns = [
        { header: "INEP", key: "inep", width: 12 },
        { header: "CNPJ", key: "cnpj", width: 20 },
        { header: "Designação", key: "designacao", width: 40 },
        { header: "Nome", key: "nome", width: 40 },
        { header: "Diretor(a)", key: "diretor", width: 30 },
        { header: "Status", key: "status", width: 14 },
      ];
      lista.forEach((u) => {
        worksheet.addRow({
          inep: u.inep ?? "",
          cnpj: u.cnpj ?? "",
          designacao: u.designacao ?? "",
          nome: u.nome ?? "",
          diretor: u.diretor ?? "",
          status: getStatus(u, detalheByUnidadeId.get(u.id)) === "completo" ? "Completo" : "Incompleto",
        });
      });
      worksheet.getRow(1).font = { bold: true };

      const buffer = await workbook.xlsx.writeBuffer();
      const data = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(data, `PDDE_Selecao_4CRE_${exercicio}.xlsx`);
      toast.success("Seleção exportada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar a seleção.");
    }
  };

  const unidadesAlvoLote = useMemo(() => {
    if (!unidadesDetalhe) return [];
    const idsFiltrados = new Set(lista.map((u) => u.id));
    return unidadesDetalhe.filter((u) => u.unidade_id && idsFiltrados.has(u.unidade_id));
  }, [unidadesDetalhe, lista]);

  const cadastroEssencialOkLote = useMemo(
    () =>
      unidadesAlvoLote.filter((u) =>
        hasCadastroEssencialCompleto(u),
      ).length,
    [unidadesAlvoLote],
  );

  const handleGenerateLote = () => {
    setConfirmLote(false);
    if (unidadesAlvoLote.length === 0) {
      toast.warning("Nenhuma unidade encontrada nos filtros atuais.", {
        description: "Aguarde o carregamento dos dados completos ou ajuste os filtros.",
      });
      return;
    }

    void lote.start({
      unidades: unidadesAlvoLote,
      exercicio,
      programa: PROGRAMA,
      totalCadastrado: unidades.length,
    });
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        {/* Page header */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="ds-eyebrow">
              Cadastro · 4ª CRE · Exercício {exercicio}
            </p>
            <h1 className="ds-h1">Unidades Escolares</h1>
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
                    <span className={`ds-dot ${statusConfig[key].dotClass}`} />
                    <span className="font-semibold tabular-nums">{statusCounts[key]}</span>
                    <span>{statusConfig[key].label.toLowerCase()}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Clear filters (moved from removed Programa section) */}
        {isSearching && !loading && unidades.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={clearFilters}
              className="ml-auto inline-flex items-center gap-1 rounded-full border border-dashed border-border/60 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground"
            >
              <X className="h-3 w-3" />
              Limpar filtros
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Buscar por designação, nome, INEP, CNPJ ou diretor(a)…"
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
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="completo">Cadastro completo</SelectItem>
                <SelectItem value="incompleto">Cadastro incompleto</SelectItem>
              </SelectContent>
            </Select>

          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-10"
              onClick={handleExportSelection}
            >
              <Download className="mr-2 h-4 w-4" /> Exportar seleção
            </Button>
            <Button
              size="sm"
              className="h-10"
              onClick={() => setConfirmLote(true)}
              disabled={unidades.length === 0 || loadingDetalheLista || lote.phase === "running"}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              {lote.phase === "running"
                ? `Gerando ${lote.progress.done}/${lote.progress.total}`
                : "Gerar demonstrativos (.zip)"}
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="ds-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table className="table-fixed min-w-[800px]">
              <colgroup>
                <col className="w-[38%]" />
                <col className="w-[24%]" />
                <col className="w-[13%]" />
                <col className="w-[17%]" />
                <col className="w-[8%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md hover:bg-muted/50">
                  <TableHead className="ds-th h-11">
                    Unidade escolar
                  </TableHead>
                  <TableHead className="ds-th h-11">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="ds-th h-11">
                    Status
                  </TableHead>
                  <TableHead className="ds-th h-11 border-l border-border/40 bg-primary/5 text-center text-primary/80">
                    <span className="inline-flex items-center gap-1.5">
                      <FileText className="h-3 w-3" />
                      Documentos
                    </span>
                  </TableHead>
                  <TableHead className="ds-th h-11 text-right">
                    {""}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow
                      key={i}
                      className="border-b border-border/30"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <TableCell className="py-3.5">
                        <div className="space-y-1.5">
                          <Skeleton className="h-3.5 w-3/4" />
                          <Skeleton className="h-3 w-1/2 opacity-60" />
                        </div>
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-3.5 w-2/3" />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="h-5 w-20 rounded-full" />
                      </TableCell>
                      <TableCell className="py-3.5">
                        <Skeleton className="mx-auto h-3.5 w-24" />
                      </TableCell>
                      <TableCell className="py-3.5 text-right">
                        <Skeleton className="ml-auto h-7 w-7 rounded-md" />
                      </TableCell>
                    </TableRow>
                  ))
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={COLUMNS} className="p-0">
                      <EmptyState
                        variant="inline"
                        icon={AlertCircle}
                        title="Erro ao carregar unidades escolares"
                        description="Não foi possível consultar os dados do Supabase. Verifique sua sessão, conexão ou permissões."
                        action={
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => refetch()}
                            disabled={isFetching}
                          >
                            {isFetching ? "Tentando..." : "Tentar novamente"}
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
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
                  <>
                    {lista.map((e) => {
                      const st = getStatus(e, detalheByUnidadeId.get(e.id));
                      const cfg = statusConfig[st];
                      return (
                        <TableRow
                          key={e.id}
                          className="group border-b border-border/40 transition-colors hover:bg-primary/[0.04]"
                          onMouseEnter={() => prefetchUnidade(e.id)}
                        >
                          <TableCell className="ds-td py-3">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/escolas/${e.id}`, { viewTransition: true })}
                                title="Abrir cadastro completo"
                                className="group/link inline-flex items-center gap-1.5 self-start rounded-sm text-left font-medium text-primary underline decoration-primary/30 decoration-dotted underline-offset-4 transition-colors hover:decoration-primary hover:decoration-solid focus-visible:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                                aria-label={`Abrir cadastro de ${e.designacao}`}
                              >
                                <span>{e.designacao}</span>
                                <ArrowUpRight
                                  className="h-3.5 w-3.5 opacity-0 -translate-x-0.5 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0"
                                  aria-hidden="true"
                                />
                              </button>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                                <span className="ds-num-mono">
                                  INEP {e.inep ?? "—"}
                                </span>
                                {e.cnpj && (
                                  <>
                                    <span className="text-border">·</span>
                                    <span className="ds-num-mono">
                                      CNPJ {e.cnpj}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="ds-td">{e.diretor ?? "—"}</TableCell>
                          <TableCell>
                            <span className={cn("ds-badge-pill", cfg.badgeClass)}>
                              <span className={cn("ds-dot", cfg.dotClass)} />
                              {cfg.label}
                            </span>
                          </TableCell>
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
                              <p className="text-center text-[10px] text-muted-foreground">
                                Demonstrativo Básico disponível
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <SecondaryActions
                              onEdit={() => navigate(`/escolas/${e.id}`, { viewTransition: true })}
                              onView={() => navigate(`/escolas/${e.id}`, { viewTransition: true })}
                              onDelete={() => {
                                toast.info(`Em breve: remover ${e.designacao}`);
                              }}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
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
        title={`Gerar ${unidadesAlvoLote.length} demonstrativos das unidades filtradas?`}
        description={
          <>
            Sera gerado um arquivo <strong>.zip</strong> contendo um Demonstrativo Basico individual
            para cada unidade filtrada no exercicio <strong>{exercicio}</strong>. Dados fiscais
            ou financeiros ausentes nao bloqueiam esta fase; inconsistencias cadastrais entram
            no relatorio de pendencias cadastrais.
          </>
        }
        highlight={`${unidadesAlvoLote.length} de ${lista.length} unidades filtradas serao processadas · ${cadastroEssencialOkLote} com cadastro essencial OK`}
        confirmLabel="Iniciar geracao"
        onConfirm={handleGenerateLote}
      />

      <DocumentsPanel
        open={docsPanelOpen}
        onOpenChange={setDocsPanelOpen}
        unidadeId={selectedEscola?.id}
        schoolName={selectedEscola?.designacao ?? ""}
        exercicio={exercicio}
      />
    </Layout>
  );
}
