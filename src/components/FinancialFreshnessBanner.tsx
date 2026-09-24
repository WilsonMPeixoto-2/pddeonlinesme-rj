import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Database } from "lucide-react";

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

  if (query.isLoading) return null;

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
  const storageLagIncident = freshness.status === "STORAGE_LAG" && (freshness.lagMinutes ?? 0) > 15;
  if (freshness.status === "CURRENT") return null;
  if (freshness.status === "STORAGE_LAG" && !storageLagIncident) return null;

  const isStorageLag = freshness.status === "STORAGE_LAG";
  const tone = isStorageLag
    ? "border-amber-500/25 bg-amber-500/6 text-amber-800 dark:text-amber-300"
    : "border-destructive/30 bg-destructive/8 text-destructive";
  const icon = isStorageLag
    ? <Database className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
    : <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />;

  const message = isStorageLag
    ? `Os dados oficiais mais recentes já estão visíveis, mas a consolidação histórica está atrasada. Referência: ${formatDate(freshness.enginePublishedAt)}.`
    : freshness.status === "SOURCE_STALE"
      ? `A atualização financeira está atrasada. Última referência disponível: ${formatDate(freshness.enginePublishedAt)}.`
      : "A fonte financeira corrente está temporariamente indisponível. Valores ausentes não são tratados como zero.";

  return (
    <div className={cn("border-b", tone)} role="alert">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2 text-xs">
        {icon}
        <span>{message}</span>
      </div>
    </div>
  );
}
