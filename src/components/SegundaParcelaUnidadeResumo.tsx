import { CalendarDays, ReceiptText } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EscolaSegundaParcela } from "@/lib/financeiroPDDE";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatMoney(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

export function SegundaParcelaUnidadeResumo({
  escola,
  compact = false,
}: {
  escola: EscolaSegundaParcela | undefined;
  compact?: boolean;
}) {
  if (!escola) return null;

  const creditoConfirmado = escola.dataPagamento !== null;

  return (
    <Card className="border-amber-500/25 bg-amber-500/[0.025]">
      <CardHeader className={compact ? "pb-2" : "pb-3"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-700 dark:text-amber-300">
              2º ciclo · PDDE Básico
            </p>
            <CardTitle className="mt-1 text-sm font-semibold">Situação da 2ª parcela</CardTitle>
          </div>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-700 ring-1 ring-amber-500/20 dark:text-amber-300">
            <ReceiptText className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </CardHeader>
      <CardContent className={compact ? "space-y-3 pt-0" : "space-y-4 pt-0"}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Total informado</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatMoney(escola.valorInformado)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Custeio</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatMoney(escola.custeio)}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Capital</p>
            <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatMoney(escola.capital)}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/50 pt-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
            Ordem: <strong className="font-semibold text-foreground">{formatDate(escola.dataOrdem)}</strong>
          </span>
          {creditoConfirmado ? (
            <span>
              Crédito confirmado em <strong className="font-semibold text-success">{formatDate(escola.dataPagamento)}</strong>
            </span>
          ) : (
            <span className="font-medium text-amber-700 dark:text-amber-300">
              Crédito bancário ainda não confirmado.
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
