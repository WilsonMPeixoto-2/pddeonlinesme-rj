import { useEffect, useMemo, useRef, useState } from "react";
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
  ArrowUpRight, Download, Eye, FileSpreadsheet, FileText, MoreVertical,
  Pencil, SchoolIcon, Search, SearchX, Trash2, X,
} from "lucide-react";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { DocumentsPanel } from "@/components/DocumentsPanel";
import { toast } from "sonner";
import { useExercicio } from "@/hooks/useExercicio";
import {
  useUnidadesLocalizador,
  type UnidadeLocalizador,
} from "@/hooks/useUnidadesLocalizador";
import { cn } from "@/lib/utils";

type Unidade = UnidadeLocalizador;

type StatusFilter = "todas" | "pronta" | "incompleta" | "pendente";

const statusConfig = {
  pronta: {
    label: "Completa",
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

function getDisplayName(e: Unidade) {
  return e.designacao ?? e.nome ?? "Unidade sem identificação";
}

function getStatus(e: Unidade) {
  const hasIdentity = Boolean(e.designacao?.trim() || e.nome?.trim());
  const hasMinimumRegistration =
    hasIdentity &&
    Boolean(e.inep?.trim()) &&
    Boolean(e.cnpj?.trim()) &&
    Boolean(e.diretor?.trim());

  if (hasMinimumRegistration) return "pronta" as const;
  if (hasIdentity || e.inep || e.cnpj || e.diretor) return "incompleta" as const;
  return "pendente" as const;
}

function formatCnpj(cnpj: string | null) {
  const digits = cnpj?.replace(/\D/g, "") ?? "";
  if (digits.length !== 14) return cnpj ?? "—";
  return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
}

function getDocMeta(e: Unidade) {
  const st = getStatus(e);
  if (st === "pronta") {
    const seed = e.id ? e.id.charCodeAt(0) % 3 : 0;
    const counts = [1, 2, 3];
    const times = ["Há 2 dias", "Há 5 dias", "Há 1 semana"];
    return { generated: counts[seed], total: 6, lastGen: times[seed] };
  }
  return { generated: 0, total: 6, lastGen: null };
}

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

export default function Escolas() {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [confirmLote, setConfirmLote] = useState(false);
  const { exercicio } = useExercicio();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todas");
  const [docsPanelOpen, setDocsPanelOpen] = useState(false);
  const [selectedEscola, setSelectedEscola] = useState<Unidade | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const {
    data: unidades = [],
    error,
    isLoading: loading,
  } = useUnidadesLocalizador();

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message);
    }
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
        if ((e.designacao ?? "").toLowerCase().includes(lower)) return true;
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

  const isSearching = q.trim().length > 0 || statusFilter !== "todas";

  const clearFilters = () => {
    setQ("");
    setStatusFilter("todas");
  };

  const statusCounts = useMemo(() => {
    const counts = { pronta: 0, incompleta: 0, pendente: 0 };
    unidades.forEach((e) => {
      counts[getStatus(e)]++;
    });
    return counts;
  }, [unidades]);

  const COLUMNS = 6;

  const openDocs = (e: Unidade) => {
    setSelectedEscola(e);
    setDocsPanelOpen(true);
  };

  const openSchool = (e: Unidade) => {
    if (!e.id) {
      toast.error("Unidade sem identificador para navegação.");
      return;
    }
    navigate(`/escolas/${e.id}`);
  };

  return (
    <AppLayout>
      <div className="space-y-5">
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Localizador · 4ª CRE · Exercício {exercicio}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Unidades Escolares</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Carregando cadastro…"
                : `${unidades.length} unidades · dados cadastrais da view Foundation v1.`}
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Buscar por unidade, nome, INEP, CNPJ ou diretor(a)…"
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
              <SelectTrigger className="h-10 w-[170px] shrink-0">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos status</SelectItem>
                <SelectItem value="pronta">Completas</SelectItem>
                <SelectItem value="incompleta">Incompletas</SelectItem>
                <SelectItem value="pendente">Pendentes</SelectItem>
              </SelectContent>
            </Select>

            {isSearching && (
              <Button variant="outline" size="sm" className="h-10" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Limpar filtros
              </Button>
            )}
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

        <Card className="overflow-hidden border-border/70">
          <Table>
            <TableHeader>
              <TableRow className="sticky top-0 z-10 border-b border-border/60 bg-muted/50 backdrop-blur-md hover:bg-muted/50">
                <TableHead className="h-11 min-w-[300px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Unidade escolar
                </TableHead>
                <TableHead className="h-11 w-[170px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  INEP / CNPJ
                </TableHead>
                <TableHead className="h-11 min-w-[180px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Diretor(a)
                </TableHead>
                <TableHead className="h-11 w-[140px] text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  Status cadastral
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
              ) : lista.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={COLUMNS} className="p-0">
                    <EmptyState
                      variant="inline"
                      icon={isSearching ? SearchX : SchoolIcon}
                      title={
                        error
                          ? "Não foi possível carregar as unidades"
                          : isSearching
                            ? "Nenhum resultado para os filtros aplicados"
                            : "Nenhuma unidade cadastrada ainda"
                      }
                      description={
                        error
                          ? "Verifique a conexão com o Supabase e tente novamente."
                          : isSearching
                            ? "Verifique o termo digitado ou altere os filtros."
                            : "A view de localizador ainda não retornou registros."
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
                  const st = getStatus(e);
                  const cfg = statusConfig[st];
                  const name = getDisplayName(e);
                  return (
                    <TableRow
                      key={e.id ?? name}
                      className="group border-b border-border/40 transition-colors hover:bg-primary/[0.04]"
                    >
                      <TableCell className="py-3">
                        <div className="flex flex-col gap-1">
                          <button
                            type="button"
                            onClick={() => openSchool(e)}
                            title="Abrir cadastro completo"
                            className="group/link inline-flex items-center gap-1.5 self-start rounded-sm text-left font-medium text-primary underline decoration-primary/30 decoration-dotted underline-offset-4 transition-colors hover:decoration-primary hover:decoration-solid focus-visible:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            aria-label={`Abrir cadastro de ${name}`}
                          >
                            <span>{name}</span>
                            <ArrowUpRight
                              className="h-3.5 w-3.5 opacity-0 -translate-x-0.5 transition-all group-hover/link:opacity-100 group-hover/link:translate-x-0"
                              aria-hidden="true"
                            />
                          </button>
                          {e.nome && e.nome !== e.designacao && (
                            <span className="text-xs text-muted-foreground">{e.nome}</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-0.5 text-xs">
                          <div className="font-mono tabular-nums">
                            INEP {e.inep ?? "—"}
                          </div>
                          <div className="font-mono tabular-nums text-muted-foreground">
                            {formatCnpj(e.cnpj)}
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
                          {(() => {
                            const dm = getDocMeta(e);
                            return (
                              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                                <span className={cn(
                                  "font-semibold tabular-nums",
                                  dm.generated > 0 ? "text-success" : "text-muted-foreground/60",
                                )}>
                                  {dm.generated}/{dm.total}
                                </span>
                                {dm.lastGen && (
                                  <>
                                    <span className="text-border">·</span>
                                    <span>{dm.lastGen}</span>
                                  </>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <SecondaryActions
                          onEdit={() => openSchool(e)}
                          onView={() => openSchool(e)}
                          onDelete={() => {
                            toast.info(`Em breve: remover ${name}`);
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>

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
        schoolName={selectedEscola ? getDisplayName(selectedEscola) : ""}
        exercicio={exercicio}
      />
    </AppLayout>
  );
}
