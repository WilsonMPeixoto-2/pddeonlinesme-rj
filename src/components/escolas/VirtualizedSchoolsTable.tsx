import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, FileText, MoreVertical, Pencil, Eye, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

/* ─── Types (locais; alinhados ao Escolas.tsx) ─── */

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

type Props = {
  unidades: Unidade[];
  getStatus: (e: Unidade) => Status;
  getPrograma: (e: Unidade) => Programa;
  getDocMeta: (e: Unidade) => DocMeta;
  statusConfig: StatusConfig;
  programaConfig: ProgramaConfig;
  fmt: (n: number) => string;
  onOpenDocs: (e: Unidade) => void;
};

/* ─── Group prefix detection ─── */

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

/* ─── Execution mini-bar ─── */

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
  const tone = pct >= 90 ? "bg-warning" : pct >= 50 ? "bg-primary" : "bg-success";
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

/* ─── Secondary actions ─── */

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

/* ─── Grid template (must match header + rows) ─── */

const GRID_TEMPLATE =
  "minmax(300px,2.4fr) minmax(160px,1.2fr) 110px 70px minmax(180px,1fr) 180px 50px";

/* ─── Main ─── */

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
}: Props) {
  const navigate = useNavigate();
  const parentRef = useRef<HTMLDivElement>(null);

  // Build grouped flat list
  const rows: Row[] = useMemo(() => {
    const groups = new Map<string, Unidade[]>();
    for (const u of unidades) {
      const p = getPrefix(u.designacao);
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p)!.push(u);
    }
    // Stable order: known prefixes first, then OUTROS
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

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => (rows[i].kind === "group" ? 40 : 76),
    overscan: 8,
  });

  return (
    <div
      ref={parentRef}
      className="relative max-h-[70vh] overflow-auto"
      style={{ contain: "strict" }}
    >
      {/* Sticky header */}
      <div
        className="sticky top-0 z-20 grid items-center gap-0 border-b border-border/60 bg-muted/70 px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground backdrop-blur-md"
        style={{ gridTemplateColumns: GRID_TEMPLATE }}
        role="row"
      >
        <div>Unidade escolar</div>
        <div>Diretor(a)</div>
        <div>Status</div>
        <div className="text-right">Alunos</div>
        <div>Execução financeira</div>
        <div className="border-l border-border/40 bg-primary/5 -my-3 py-3 text-center text-primary/80">
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
                className="absolute left-0 right-0 flex items-center justify-between gap-3 border-b border-t border-border/50 bg-card/80 px-4 backdrop-blur-sm"
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

          return (
            <div
              key={row.key}
              className="group row-accent absolute left-0 right-0 grid items-center border-b border-border/40 px-4 transition-colors hover:bg-primary/[0.04]"
              style={{
                top: 0,
                transform: `translateY(${vRow.start}px)`,
                height: `${vRow.size}px`,
                gridTemplateColumns: GRID_TEMPLATE,
              }}
              role="row"
            >
              {/* Unidade */}
              <div className="min-w-0 pr-3">
                <div className="flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => navigate(`/escolas/${e.id}`)}
                    title="Abrir cadastro completo"
                    className="group/link inline-flex items-center gap-1.5 self-start truncate rounded-sm text-left font-medium text-primary underline decoration-primary/30 decoration-dotted underline-offset-4 transition-colors hover:decoration-primary hover:decoration-solid focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    aria-label={`Abrir cadastro de ${e.designacao}`}
                  >
                    <span className="truncate">{e.designacao}</span>
                    <ArrowUpRight
                      className="h-3.5 w-3.5 -translate-x-0.5 opacity-0 transition-all group-hover/link:translate-x-0 group-hover/link:opacity-100"
                      aria-hidden
                    />
                  </button>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="font-mono tabular-nums">INEP {e.inep ?? "—"}</span>
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
                        <span className="font-mono tabular-nums" title="Agência / Conta corrente">
                          Ag {e.agencia ?? "—"} · CC {e.conta_corrente ?? "—"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Diretor */}
              <div className="truncate pr-3 text-sm text-foreground/90">{e.diretor ?? "—"}</div>

              {/* Status */}
              <div>
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium",
                    cfg.badgeClass,
                  )}
                >
                  <span className={cn("inline-block h-1.5 w-1.5 rounded-full", cfg.dotClass)} />
                  {cfg.label}
                </span>
              </div>

              {/* Alunos */}
              <div className="text-right text-sm tabular-nums">{e.alunos}</div>

              {/* Execução */}
              <div className="pr-3">
                <ExecutionBar
                  recebido={Number(e.recebido)}
                  saldo={Number(e.saldo_anterior)}
                  gasto={Number(e.gasto)}
                  fmt={fmt}
                />
              </div>

              {/* Documentos (destaque) */}
              <div className="-my-2 h-full border-l border-border/40 bg-primary/[0.025] px-2 py-2">
                <div className="flex h-full flex-col justify-center gap-1">
                  <Button
                    size="sm"
                    variant="default"
                    className="h-8 w-full justify-center gap-2 text-xs shadow-[0_0_16px_hsl(var(--primary)/0.18)] transition-shadow hover:shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
                    onClick={() => onOpenDocs(e)}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    Documentos
                  </Button>
                  <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground">
                    <span
                      className={cn(
                        "font-semibold tabular-nums",
                        dm.generated > 0 ? "text-success" : "text-muted-foreground/60",
                      )}
                    >
                      {dm.generated}/{dm.total}
                    </span>
                    {dm.lastGen && (
                      <>
                        <span className="text-border">·</span>
                        <span>{dm.lastGen}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* More */}
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
