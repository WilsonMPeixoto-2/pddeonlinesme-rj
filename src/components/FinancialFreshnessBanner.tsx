import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Database } from "lucide-react";

import { useExercicio } from "@/hooks/useExercicio";
import { financialFreshnessOptions, financialSyncHealthOptions } from "@/lib/queryKeys";
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
  const freshnessQuery = useQuery(financialFreshnessOptions(exercise));
  const healthQuery = useQuery(financialSyncHealthOptions());

  if (exercise !== 2026) return null;
  if (freshnessQuery.isLoading) return null;

  if (freshnessQuery.isError || !freshnessQuery.data) {
    return (
      <div className="border-b border-destructive/30 bg-destructive/8">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs text-destructive">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Não foi possível comprovar o frescor da base financeira. Ausência de atualização não é tratada como zero.
        </div>
      </div>
    );
  }

  const freshness = freshnessQuery.data;
  const syncHealth = healthQuery.data ?? null;
  const syncFailed = Boolean(syncHealth && syncHealth.status === "FAILED");

  if (!syncFailed && (freshness.status === "CURRENT" || freshness.status === "PROPAGATING")) {
    return null;
  }

  const tone = freshness.status === "STORAGE_LAG" || syncFailed
    ? "border-amber-500/25 bg-amber-500/6 text-amber-800 dark:text-amber-300"
    : "border-destructive/30 bg-destructive/8 text-destructive";
  const icon = freshness.status === "STORAGE_LAG" || syncFailed
    ? <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    : <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;

  let message: string;
  if (syncFailed) {
    message = `A sincronização financeira mais recente falhou. Último snapshot de origem: ${formatDate(syncHealth?.source_published_at ?? freshness.enginePublishedAt)}.`;
  } else if (freshness.status === "STORAGE_LAG") {
    message = `A persistência financeira está atrasada em relação ao snapshot validado em ${formatDate(freshness.enginePublishedAt)}.`;
  } else if (freshness.status === "SOURCE_STALE") {
    message = `A atualização da fonte financeira está atrasada. Último snapshot validado: ${formatDate(freshness.enginePublishedAt)}.`;
  } else {
    message = "A fonte financeira corrente está temporariamente indisponível. Valores ausentes não são tratados como zero.";
  }

  return (
    <div className={cn("border-b", tone)} role="alert">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs">
        {icon}
        <span>{message}</span>
      </div>
    </div>
  );
}
