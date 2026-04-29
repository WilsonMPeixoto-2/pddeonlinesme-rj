import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  FileText,
  MoreVertical,
  Pencil,
  Eye,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export type Unidade = {
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

type Status = "pronta" | "incompleta" | "pendente";
type Programa = "basico" | "qualidade" | "equidade";

type StatusConfig = Record<Status, { label: string; dotClass: string; badgeClass: string }>;
type ProgramaConfig = Record<Programa, { label: string; short: string; className: string }>;

type DocMeta = { generated: number; total: number; lastGen: string | null };

export type DensityMode = "comfortable" | "compact";

type Props = {
  unidades: Unidade[];
  getStatus: (e: Unidade) => Status;
  getPrograma: (e: Unidade) => Programa;
  getDocMeta: (e: Unidade) => DocMeta;
  statusConfig: StatusConfig;
  programaConfig: ProgramaConfig;
  fmt: (n: number) => string;
  onOpenDocs: (e: Unidade) => void;
  density?: DensityMode;
};

const PREFIX_LABELS: Record<string, { label: string; tone: string }> = {
  EM: { label: "Escolas Municipais (EM)", tone: "text-primary" },
  CMEI: { label: "Centros Municipais de Ed. Infantil (CMEI)", tone: "text-success" },
  CIEP: { label: "CIEPs", tone: "text-warning" },
  EDI: { label: "Espaços de Desenvolvimento Infantil (EDI)", tone: "text-success" },
  GINASIO: { label: "Ginásios", tone: "text-primary" },
  COLEGIO: { label: "Colégios", tone: "text-primary" },
  OUTROS: { label: "Outras unidades", tone: "text-muted-foreground" },
};

function getPrefix(designacao: string): string {
  const upper = (designacao ?? "").trim().toUpperCase();
  if (/^E\.?\s*M\b/.test(upper) || upper.startsWith("EM ")) return "EM";
  if (upper.startsWith("CMEI")) return "CMEI";
  if (upper.startsWith("CIEP")) return "CIEP";
  if (upper.startsWith("EDI")) return "EDI";
  if (upper.startsWith("GIN")) return "GINASIO";
  if (upper.startsWith("COL")) return "COLEGIO";
  return "OUTROS";
}

function ExecutionBar({
  recebido,
  saldo,
  gasto,
  fmt,
}: {
  recebido: number;
  saldo: number;
  gasto: number;
  fmt: (n: number) => string;
}) {
  const total = recebido + saldo;
  const pct = total > 0 ? Math.min(100, (gasto / total) * 100) : 0;
  const tone =
    pct >= 90
      ? "from-warning/80 to-warning"
      : pct >= 50
      ? "from-primary/70 to-primary"
      : "from-success/70 to-success";
  const trackPct = total > 0 ? 100 : 0;

  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-2 text-[11px] leading-none">
        <span className="font-medium tabular-nums text-foreground/90">{fmt(gasto)}</span>
        <span className="tabular-nums text-muted-foreground/70">
          {total > 0 ? `${pct.toFixed(0)}%` : "—"}
        </span>
      </div>
      <div
        className="relative h-1.5 overflow-hidden rounded-full bg-muted/30 ring-1 ring-inset ring-border/40"
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Execução financeira"
      >
        <div
          className="absolute inset-y-0 left-0 bg-foreground/[0.04]"
          style={{ width: `${trackPct}%` }}
        />
        <div
          className={cn(
            "relative h-full rounded-full bg-gradient-to-r transition-[width] duration-500",
            tone,
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[10px] leading-none text-muted-foreground/70">
        <span className="tabular-nums">de {fmt(total)}</span>
        {pct >= 90 && total > 0 && (
          <span className="font-medium text-warning/90">crítico</span>
        )}
      </div>
    </div>
  );
}

function DocsCounter({
  generated,
  total,
  lastGen,
}: {
  generated: number;
  total: number;
  lastGen: string | null;
}) {
  const pct = total > 0 ? Math.min(100, (generated / total) * 100) : 0;
  const done = generated > 0;
  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-baseline gap-1 text-[11px] leading-none">
        <span
          className={cn(
            "font-semibold tabular-nums",
            done ? "text-success" : "text-muted-foreground/70",
          )}
        >
          {generated}
        </span>
        <span className="text-muted-foreground/60">/</span>
        <span className="tabular-nums text-muted-foreground/80">{total}</span>
      </div>
      <div className="h-[3px] w-full max-w-[80px] overflow-hidden rounded-full bg-muted/30 ring-1 ring-inset ring-border/30">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-500",
            done ? "bg-success/80" : "bg-muted-foreground/30",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {lastGen && (
        <span className="text-[10px] leading-none text-muted-foreground/70">{lastGen}</span>
      )}
    </div>
  );
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
        className="w-[200px] border-border/60 bg-popover/95 backdrop-blur-md"
      >
        <DropdownMenuItem onClick={onEdit} className="gap-2.5">
          <Pencil className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm">Editar cadastro</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onView} className="gap-2.5">
          <Eye className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">Ver detalhes</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border/50" />
        <DropdownMenuItem onClick={onDelete} className="gap-2.5 text-destructive focus:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          <span className="text-sm">Remover</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

const GRID_TEMPLATE =
  "minmax(300px,2.4fr) minmax(160px,1.2fr) 110px 80px minmax(180px,1fr) 200px 50px";

type Row =
  | { kind: "group"; key: string; prefix: string; count: number }
  | { kind: "item"; key: string; unidade: Unidade };

export default function VirtualizedSchoolsTable({
  unidades,
  getStatus,
  getPrograma,
  getDocMeta,
  statusConfig,
  programaConfig,
  fmt,
  onOpenDocs,
  density = "comfortable",
}: Props) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);
  const isCompact = density === "compact";

  const rows: Row[] = useMemo(() => {
    const groups = new Map<string, Unidade[]>();
    for (const u of unidades) {
      const p = getPrefix(u.designacao);
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p)!.push(u);
    }
    const order = ["EM", "CMEI", "CIEP", "EDI", "GINASIO", "COLEGIO", "OUTROS"];
    const flat: Row[] = [];
    for (const p of order) {
      const items = groups.get(p);
      if (!items || items.length === 0) continue;
      flat.push({ kind: "group", key: `g-${p}`, prefix: p, count: items.length });
      for (const u of items) flat.push({ kind: "item", key: u.id, unidade: u });
    }
    return flat;
  }, [unidades]);

  const groupSize = isCompact ? 34 : 40;
  const itemSize = isCompact ? 60 : 80;

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i].kind === "group" ? groupSize : itemSize),
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="relative max-h-[72vh] overflow-auto"
      style={{ contain: "strict" }}
    >
      <div
        className="sticky top-0 z-20 grid items-center gap-0 border-b border-border/60 bg-muted/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground shadow-[0_1px_0_0_hsl(var(--border)/0.6)] backdrop-blur-md"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
        role="row"
      >
        <div>Unidade escolar</div>
        <div>Diretor(a)</div>
        <div>Status</div>
        <div className="text-right tabular-nums">Alunos</div>
        <div>Execução financeira</div>
        <div className="-my-3 border-l border-border/40 bg-primary/[0.06] py-3 text-center text-primary/80">
          <span className="inline-flex items-center gap-1.5">
            <FileText className="h-3 w-3" />
            Documentos
          </span>
        </div>
        <div />
      </div>

      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((vRow) => {
          const row = rows[vRow.index];
          if (row.kind === "group") {
            const meta = PREFIX_LABELS[row.prefix] ?? PREFIX_LABELS.OUTROS;
            return (
              <div
                key={row.key}
                className="absolute left-0 right-0 flex items-center justify-between gap-3 border-b border-t border-border/50 bg-card/85 px-4 backdrop-blur-sm"
                style={{
                  top: 0,
                  transform: `translateY(${vRow.start}px)`,
                  height: `${vRow.size}px`,
                }}
                role="row"
                aria-label={`Grupo ${meta.label}`}
              >
                <div className="flex items-center gap-2">
                  <span className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", meta.tone)}>
                    {row.prefix}
                  </span>
                  <span className="text-xs font-medium text-foreground/90">{meta.label}</span>
                </div>
                <span className="rounded-full border border-border/60 bg-muted/40 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {row.count}
                </span>
              </div>
            );
          }

          const e = row.unidade;
          const st = getStatus(e);
          const cfg = statusConfig[st];
          const prog = getPrograma(e);
          const progCfg = programaConfig[prog];
          const dm = getDocMeta(e);
          const isPendente = st === "pendente";
          const isIncompleta = st === "incompleta";

          return (
            <div
              key={row.key}
              className={cn(
                "group row-accent absolute left-0 right-0 grid items-center border-b border-border/40 px-4 transition-colors",
                "hover:bg-primary/[0.04]",
                isPendente && "bg-destructive/[0.035] hover:bg-destructive/[0.06]",
              )}
              style={{
                top: 0,
                transform: `translateY(${vRow.start}px)`,
                height: `${vRow.size}px`,
                gridTemplateColumns: GRID_TEMPLATE,
              }}
              role="row"
            >
              <div className="min-w-0 pr-3">
                <div className={cn("flex flex-col", isCompact ? "gap-0" : "gap-1")}>
                  <button
                    type="button"
                    onClick={() => navigate(`/escolas/${e.id}`)}
                    title="Abrir cadastro completo"
                    className={cn(
                      "group/link inline-flex items-center gap-1.5 self-start truncate rounded-sm text-left font-medium tracking-tight text-foreground transition-colors",
                      "hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      isCompact ? "text-[13px]" : "text-sm",
                    )}
                    aria-label={`Abrir cadastro de ${e.designacao}`}
                  >
                    {isPendente && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 shrink-0 text-destructive/80"
                        aria-label="Cadastro pendente"
                      />
                    )}
                    <span className="truncate">{e.designacao}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
                      aria-hidden
                    />
                  </button>
                  {!isCompact && (
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span className="font-mono tabular-nums">INEP {e.inep ?? "—"}</span>
                      <span className="text-border">·</span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-md border px-1.5 py-0 text-[10px] font-medium",
                          progCfg.className,
                        )}
                        title={progCfg.label}
                      >
                        {progCfg.short}
                      </span>
                      {(e.agencia || e.conta_corrente) && (
                        <>
                          <span className="text-border">·</span>
                          <span className="font-mono tabular-nums" title="Agência / Conta corrente">
                            Ag {e.agencia ?? "—"} · CC {e.conta_corrente ?? "—"}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={cn(
                  "truncate pr-3 text-foreground/85",
                  isCompact ? "text-[13px]" : "text-sm",
                )}
              >
                {e.diretor ?? <span className="text-muted-foreground/60">—</span>}
              </div>

              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium leading-none",
                    cfg.badgeClass,
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-1.5 w-1.5 rounded-full",
                      cfg.dotClass,
                      st === "pronta" && "pulse-dot-success",
                    )}
                  />
                  {cfg.label}
                </span>
              </div>

              <div className="pr-1 text-right font-mono text-[13px] tabular-nums text-foreground/90">
                {e.alunos > 0 ? (
                  e.alunos.toLocaleString("pt-BR")
                ) : (
                  <span className="text-muted-foreground/50">—</span>
                )}
              </div>

              <div className="pr-3">
                <ExecutionBar
                  recebido={Number(e.recebido)}
                  saldo={Number(e.saldo_anterior)}
                  gasto={Number(e.gasto)}
                  fmt={fmt}
                />
              </div>

              <div className="-my-2 h-full border-l border-border/40 bg-primary/[0.03] px-2 py-2">
                <div className="flex h-full items-center gap-2">
                  <Button
                    size="sm"
                    variant={isIncompleta || isPendente ? "outline" : "default"}
                    className={cn(
                      "h-8 flex-1 justify-center gap-1.5 text-xs transition-shadow",
                      !isIncompleta &&
                        !isPendente &&
                        "shadow-[0_0_14px_hsl(var(--primary)/0.18)] hover:shadow-[0_0_22px_hsl(var(--primary)/0.32)]",
                    )}
                    onClick={() => onOpenDocs(e)}
                    disabled={isPendente}
                    title={
                      isPendente
                        ? "Conclua o cadastro para gerar documentos"
                        : "Abrir documentos da unidade"
                    }
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Docs
                  </Button>
                  <DocsCounter
                    generated={dm.generated}
                    total={dm.total}
                    lastGen={isCompact ? null : dm.lastGen}
                  />
                </div>
              </div>

              <div className="text-right">
                <SecondaryActions
                  onEdit={() => navigate(`/escolas/${e.id}`)}
                  onView={() => navigate(`/escolas/${e.id}`)}
                  onDelete={() => toast.info(`Em breve: remover ${e.designacao}`)}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
