import { CalendarDays, Landmark } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { EscolaPDDEBasicoAnual } from "@/lib/financeiroPDDE";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

export function PDDEBasicoAnualUnidadeResumo({
  escola,
  exercicio,
}: {
  escola: EscolaPDDEBasicoAnual | undefined;
  exercicio: number;
}) {
  if (!escola) return null;

  const firstShare = escola.totalAnual > 0 ? escola.primeiroCiclo / escola.totalAnual : 0;
  const secondShare = escola.totalAnual > 0 ? escola.segundoCiclo / escola.totalAnual : 0;

  return (
    <Card className="overflow-hidden border-primary/20 bg-primary/[0.018] shadow-sm">
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[1fr_1.2fr]">
          <div className="border-b border-border/50 p-5 lg:border-b-0 lg:border-r sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">
                  PDDE Básico · {exercicio}
                </p>
                <h2 className="mt-1 text-sm font-semibold text-foreground">
                  Total de repasses do exercício
                </h2>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <Landmark className="h-4 w-4" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-5 text-3xl font-bold tabular-nums tracking-tight text-foreground">
              {moneyFormatter.format(escola.totalAnual)}
            </p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Soma dos pagamentos oficiais informados pelo FNDE nos dois ciclos de repasses. Saldo bancário e conciliação são apresentados separadamente.
            </p>
          </div>

          <div className="p-5 sm:p-6">
            <div
              className="flex h-3 overflow-hidden rounded-full bg-muted"
              role="img"
              aria-label={`Composição anual: ${(firstShare * 100).toFixed(1)}% no primeiro ciclo e ${(secondShare * 100).toFixed(1)}% no segundo ciclo`}
            >
              <div className="h-full bg-primary" style={{ width: `${firstShare * 100}%` }} />
              <div className="h-full bg-violet-500" style={{ width: `${secondShare * 100}%` }} />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-primary/20 bg-primary/[0.035] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                  1º ciclo de repasses
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                  {moneyFormatter.format(escola.primeiroCiclo)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {formatDate(escola.primeiroCicloData)}
                </p>
              </div>

              <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.035] p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-700 dark:text-violet-300">
                  2º ciclo de repasses
                </p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                  {moneyFormatter.format(escola.segundoCiclo)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <CalendarDays className="h-3 w-3" aria-hidden="true" />
                  {formatDate(escola.segundoCicloData)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
