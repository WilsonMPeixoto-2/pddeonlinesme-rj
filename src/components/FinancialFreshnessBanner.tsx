import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Database, RefreshCw } from "lucide-react";

import { useExercicio } from "@/hooks/useExercicio";
import { financialFreshnessOptions } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function formatDate(value: string | null): string {
  if (!value) return "não disponível";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateFormatter.format(parsed);
}

export function FinancialFreshnessBanner() {
  const { exercicio } = useExercicio();
  const exercise = Number(exercicio);
  const query = useQuery(financialFreshnessOptions(exercise));

  if (exercise !== 2026) return null;

  if (query.isLoading) {
    return (
      <div className="border-b border-border/50 bg-muted/15">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-1.5 text-[11px] text-muted-foreground">
          <RefreshCw className="h-3 w-3 animate-spin" aria-hidden="true" />
          Verificando a atualização dos dados financeiros…
        </div>
      </div>
    );
  }

  if (query.isError || !query.data) {
    return (
      <div className="border-b border-destructive/30 bg-destructive/8">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Não foi possível comprovar o frescor da base financeira. O sistema não deve interpretar ausência de atualização como zero.
        </div>
      </div>
    );
  }

  const freshness = query.data;
  const tone = freshness.status === "CURRENT"
    ? "border-success/25 bg-success/6 text-success"
    : freshness.status === "PROPAGATING"
      ? "border-amber-500/25 bg-amber-500/6 text-amber-800 dark:text-amber-300"
      : "border-destructive/30 bg-destructive/8 text-destructive";

  const icon = freshness.status === "CURRENT"
    ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    : freshness.status === "PROPAGATING" || freshness.status === "STORAGE_LAG"
      ? <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      : <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;

  let message: string;
  if (freshness.status === "CURRENT") {
    message = `Dados financeiros correntes · snapshot validado em ${formatDate(freshness.enginePublishedAt)} · persistência sincronizada.`;
  } else if (freshness.status === "PROPAGATING") {
    message = `Novo snapshot validado em ${formatDate(freshness.enginePublishedAt)}. Os dados já são usados no layout e a persistência está dentro da janela de propagação de 15 minutos.`;
  } else if (freshness.status === "STORAGE_LAG") {
    message = `Dados financeiros desatualizados no Supabase: o snapshot validado em ${formatDate(freshness.enginePublishedAt)} já está sendo usado no layout, mas a persistência ultrapassou a meta de 15 minutos.`;
  } else if (freshness.status === "SOURCE_STALE") {
    message = `Coleta financeira diária atrasada. Último snapshot validado: ${formatDate(freshness.enginePublishedAt)}. O sistema não apresentará ausência de atualização como zero.`;
  } else {
    message = "Não foi possível consultar o snapshot financeiro corrente. A interface sinaliza a indisponibilidade em vez de presumir zero.";
  }

  return (
    <div className={cn("border-b", tone)} role={freshness.status === "CURRENT" ? "status" : "alert"}>
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs">
        {icon}
        <span>{message}</span>
      </div>
    </div>
  );
}
