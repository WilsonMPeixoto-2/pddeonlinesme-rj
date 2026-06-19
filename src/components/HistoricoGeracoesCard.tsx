import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  History,
  Loader2,
  XCircle,
} from "lucide-react";
import { motion } from "framer-motion";

import {
  useDocumentGenerationRuns,
  type DocumentGenerationRun,
  type DocumentGenerationRunStatus,
} from "@/hooks/useDocumentGenerationRuns";
import { cn } from "@/lib/utils";

const STATUS_META: Record<
  DocumentGenerationRunStatus,
  { label: string; Icon: typeof CheckCircle2; tone: string }
> = {
  em_execucao: {
    label: "Em execução",
    Icon: Loader2,
    tone: "text-primary border-primary/30 bg-primary/10",
  },
  concluido: {
    label: "Concluído",
    Icon: CheckCircle2,
    tone: "text-success border-success/30 bg-success/10",
  },
  falha: {
    label: "Falha",
    Icon: XCircle,
    tone: "text-destructive border-destructive/30 bg-destructive/10",
  },
  cancelado: {
    label: "Cancelado",
    Icon: AlertTriangle,
    tone: "text-warning border-warning/30 bg-warning/10",
  },
};

const DOC_TYPE_LABEL: Record<string, string> = {
  demonstrativo_basico_lote: "Demonstrativo Básico — lote",
};

const RTF = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });

function relativeFrom(iso: string): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return "—";
  const diffSec = Math.round((then - now) / 1000);
  const abs = Math.abs(diffSec);
  if (abs < 60) return RTF.format(diffSec, "second");
  if (abs < 3600) return RTF.format(Math.round(diffSec / 60), "minute");
  if (abs < 86400) return RTF.format(Math.round(diffSec / 3600), "hour");
  if (abs < 86400 * 7) return RTF.format(Math.round(diffSec / 86400), "day");
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function asStatus(value: string): DocumentGenerationRunStatus {
  if (
    value === "em_execucao" ||
    value === "concluido" ||
    value === "falha" ||
    value === "cancelado"
  ) {
    return value;
  }
  return "falha";
}

interface HistoricoRowProps {
  run: DocumentGenerationRun;
}

function HistoricoRow({ run }: HistoricoRowProps) {
  const status = asStatus(run.status);
  const meta = STATUS_META[status];
  const Icon = meta.Icon;
  const label = DOC_TYPE_LABEL[run.doc_type] ?? run.doc_type;
  const running = status === "em_execucao";

  return (
    <li className="group -mx-1 flex items-start justify-between gap-3 rounded-md border-t border-border/40 px-1 py-3 transition-colors duration-200 first:border-t-0 first:pt-1.5 last:pb-1.5 hover:bg-muted/30">
      <div className="flex min-w-0 items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1",
            meta.tone,
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", running && "animate-spin")} />
        </span>
        <div className="min-w-0 space-y-0.5">
          <p className="truncate text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">
            <span className="tabular-nums">{run.total_sucesso}/{run.total_alvo}</span>{" "}
            gerados
            {run.total_falha > 0 && (
              <>
                {" · "}
                <span className="text-warning">{run.total_falha} falha{run.total_falha === 1 ? "" : "s"}</span>
              </>
            )}
            {" · "}exercício {run.exercicio}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2 pt-0.5">
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {relativeFrom(run.started_at)}
        </span>
        <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", meta.tone)}>
          {meta.label}
        </Badge>
      </div>
    </li>
  );
}

export function HistoricoGeracoesCard() {
  const { data, isLoading, error } = useDocumentGenerationRuns({ limit: 5 });
  const runs = useMemo(() => data?.runs ?? [], [data]);

  return (
    <Card className="ds-card">
      <CardContent className="p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                <History className="h-3.5 w-3.5" />
              </span>
              <h2 className="ds-h3">Histórico de gerações</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas corridas de geração documental em lote.
            </p>
          </div>
        </div>

        {isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-start gap-2.5">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-1/2 opacity-60" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </li>
            ))}
          </ul>
        ) : error ? (
          <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3 text-xs">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
            <p className="text-muted-foreground">
              Não foi possível carregar o histórico. {error.message}
            </p>
          </div>
        ) : runs.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-8 text-center">
            <Clock className="h-5 w-5 text-muted-foreground/60" />
            <p className="text-sm font-medium">Nenhuma corrida registrada</p>
            <p className="text-[11px] text-muted-foreground">
              As próximas gerações em lote aparecerão aqui.
            </p>
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="divide-y divide-border/40"
          >
            {runs.map((run) => (
              <motion.div
                key={run.id}
                variants={{
                  hidden: { opacity: 0, x: -8 },
                  show: { opacity: 1, x: 0 },
                }}
              >
                <HistoricoRow run={run} />
              </motion.div>
            ))}
          </motion.ul>
        )}

        {runs.length > 0 && (
          <div className="mt-4 border-t border-border/40 pt-3 flex justify-end">
            <Link
              to="/painel/historico"
              viewTransition
              className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
            >
              <span>Ver histórico completo</span>
              <History className="h-3 w-3" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
