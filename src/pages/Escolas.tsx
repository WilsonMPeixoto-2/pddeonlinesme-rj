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
import {
  useUnidadesLocalizador,
  type UnidadeLocalizador,
} from "@/hooks/useUnidadesLocalizador";
import { useExercicio } from "@/hooks/useExercicio";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { saveAs } from "file-saver";
/* ─── Types ─── */

// Foundation v1: /escolas opera como localizador a partir de vw_unidades_localizador.
// O tipo vem do hook, que ja faz o narrowing de id/designacao no boundary.
type Unidade = UnidadeLocalizador;

type StatusFilter = "todas" | "completo" | "incompleto";

/* ─── Helpers ─── */

// Foundation v1: status reflete somente completude de identidade (INEP, CNPJ, diretor).
// Dados financeiros vivem na pagina individual via vw_unidade_detalhe.
function getStatus(e: Unidade) {
  const identityFields = [e.inep, e.cnpj, e.diretor];
  const filled = identityFields.filter(
    (f) => Boolean(f && String(f).trim()),
  ).length;
  if (filled === identityFields.length) return "completo" as const;
  return "incompleto" as const;
}



const statusConfig = {
  completo: {
    label: "Cadastro completo",
    dotClass: "bg-success",
    badgeClass: "border-success/30 bg-success/10 text-success",
  },
  incompleto: {
    label: "Cadastro incompleto",
    dotClass: "bg-warning",
    badgeClass: "border-warning/30 bg-warning/10 text-warning",
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

  // Foundation v1: dados vem da view via React Query.
  const { data, isLoading, error, refetch, isFetching } = useUnidadesLocalizador();
  const unidades: Unidade[] = useMemo(() => data ?? [], [data]);
  const loading = isLoading;

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
      filtered = filtered.filter((e) => getStatus(e) === statusFilter);
    }
    return filtered;
  }, [q, statusFilter, unidades]);

  const isSearching =
    q.trim().length > 0 || statusFilter !== "todas";

  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
  };

  const statusCounts = useMemo(() => {
    const counts = { completo: 0, incompleto: 0 };
    unidades.forEach((e) => {
      counts[getStatus(e)]++;
    });
    return counts;
  }, [unidades]);



  const COLUMNS = 5;

  const openDocs = (e: Unidade) => {
    setSelectedEscola(e);
    setDocsPanelOpen(true);
  };

  const handleExportSelection = () => {
    try {
      const exportData = lista.map(u => ({
        "INEP": u.inep,
        "CNPJ": u.cnpj,
        "Designação": u.designacao,
        "Nome": u.nome,
        "Diretor(a)": u.diretor,
        "Status": getStatus(u) === "completo" ? "Completo" : "Incompleto"
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Unidades");
      
      const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
      const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(data, `PDDE_Selecao_4CRE_${exercicio}.xlsx`);
      toast.success("Seleção exportada com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao exportar a seleção.");
    }
  };

  const handleGenerateZip = async () => {
    try {
      setConfirmLote(false);
      const zip = new JSZip();
      
      const resumos = zip.folder(`Resumos_Cadastrais_Preliminares_${exercicio}`);
      if (!resumos) return;

      lista.forEach(u => {
        const textContent = [
          "RESUMO CADASTRAL PRELIMINAR",
          "",
          "Artefato técnico preliminar, sem valor de documento oficial.",
          "Não substitui prestação de contas, demonstrativo oficial, assinatura, validação humana ou conferência documental.",
          "",
          `Unidade: ${u.designacao}`,
          `Nome: ${u.nome || "Não informado"}`,
          `INEP: ${u.inep || "N/A"}`,
          `CNPJ: ${u.cnpj || "N/A"}`,
          `Diretor(a): ${u.diretor || "N/A"}`,
          `Exercício: ${exercicio}`,
          "",
        ].join("\n");
        resumos.file(`Resumo_Cadastral_${u.inep || u.id}.txt`, textContent);
      });

      const content = await zip.generateAsync({ type: "blob" });
      saveAs(content, `Resumos_Cadastrais_Preliminares_4CRE_${exercicio}.zip`);
      toast.success("Resumos cadastrais preliminares gerados com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar os resumos preliminares.");
    }
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
              disabled={unidades.length === 0}
            >
              <FileSpreadsheet className="mr-2 h-4 w-4" /> Gerar resumos (.zip)
            </Button>
          </div>
        </div>

        {/* Table */}
        <Card className="overflow-hidden border-border/70">
          <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md hover:bg-muted/50">
                  <TableHead className="h-11 min-w-[300px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Unidade escolar
                  </TableHead>
                  <TableHead className="h-11 min-w-[180px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Diretor(a)
                  </TableHead>
                  <TableHead className="h-11 w-[150px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Status
                  </TableHead>
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
                  <AnimatePresence mode="popLayout">
                    {lista.map((e) => {
                      const st = getStatus(e);
                      const cfg = statusConfig[st];
                      return (
                        <motion.tr
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          key={e.id}
                          className="group border-b border-border/40 transition-colors hover:bg-primary/[0.04]"
                        >
                          <TableCell className="py-3">
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => navigate(`/escolas/${e.id}`)}
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
                                <span className="font-mono tabular-nums">
                                  INEP {e.inep ?? "—"}
                                </span>
                                {e.cnpj && (
                                  <>
                                    <span className="text-border">·</span>
                                    <span className="font-mono tabular-nums">
                                      CNPJ {e.cnpj}
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
                                "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium",
                                cfg.badgeClass,
                              )}
                            >
                              <span className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
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
                              <div className="flex items-center justify-center text-[10px] text-muted-foreground">
                                <span>Em breve</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <SecondaryActions
                              onEdit={() => navigate(`/escolas/${e.id}`)}
                              onView={() => navigate(`/escolas/${e.id}`)}
                              onDelete={() => {
                                toast.info(`Em breve: remover ${e.designacao}`);
                              }}
                            />
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                )}
              </TableBody>
          </Table>
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
        title="Gerar resumos cadastrais preliminares"
        description={
          <>
            Será gerado um arquivo <strong>.zip</strong> com resumos cadastrais preliminares
            das unidades filtradas. Estes arquivos são artefatos técnicos preliminares e não têm valor de documento oficial.
          </>
        }
        highlight={`${lista.length} unidades filtradas serão processadas`}
        confirmLabel="Gerar resumos"
        onConfirm={handleGenerateZip}
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
