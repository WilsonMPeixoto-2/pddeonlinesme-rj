import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ReceiptText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SegundaParcelaOverview } from "@/lib/financeiroPDDE";

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

export function SegundaParcelaResumo({ overview }: { overview: SegundaParcelaOverview }) {
  if (overview.escolas.length === 0) return null;

  const composicaoCompleta = overview.custeioTotal !== null && overview.capitalTotal !== null;
  const composicaoTotal = composicaoCompleta
    ? (overview.custeioTotal ?? 0) + (overview.capitalTotal ?? 0)
    : null;
  const custeioPct = composicaoTotal && composicaoTotal > 0
    ? ((overview.custeioTotal ?? 0) / composicaoTotal) * 100
    : 0;
  const capitalPct = composicaoTotal && composicaoTotal > 0
    ? ((overview.capitalTotal ?? 0) / composicaoTotal) * 100
    : 0;
  const preview = overview.escolas.slice(0, 5);

  return (
    <section aria-labelledby="segundo-ciclo-title">
      <Card className="overflow-hidden border-border/70 shadow-sm">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="border-b border-border/60 p-5 lg:border-b-0 lg:border-r sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="ds-eyebrow">2º ciclo · PDDE Básico</p>
                  <h2 id="segundo-ciclo-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                    Ordens de pagamento identificadas
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Evidência de ordem de pagamento disponível sem presumir crédito bancário quando a data de pagamento não foi confirmada.
                  </p>
                </div>
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <ReceiptText className="h-5 w-5" aria-hidden="true" />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-3xl font-bold tabular-nums tracking-tight text-foreground">
                  {formatMoney(overview.totalInformado)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {overview.escolas.length} unidades · {overview.ordensIdentificadas} ordens identificadas
                </p>
              </div>

              <div className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                <span>
                  Ordem mais recente: <strong className="font-semibold text-foreground">{formatDate(overview.ultimaDataOrdem)}</strong>
                </span>
              </div>

              {overview.ultimaDataPagamento ? (
                <p className="mt-2 text-xs text-muted-foreground">
                  Pagamento confirmado até {formatDate(overview.ultimaDataPagamento)}.
                </p>
              ) : (
                <p className="mt-2 text-xs font-medium text-amber-700 dark:text-amber-300">
                  Crédito bancário ainda não confirmado neste recorte.
                </p>
              )}

              {composicaoCompleta && composicaoTotal !== null ? (
                <div className="mt-6 space-y-3">
                  <div
                    className="flex h-2.5 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`Composição do segundo ciclo: ${custeioPct.toFixed(1)}% custeio e ${capitalPct.toFixed(1)}% capital`}
                  >
                    <div className="h-full bg-fin-custeio" style={{ width: `${custeioPct}%` }} />
                    <div className="h-full bg-fin-capital" style={{ width: `${capitalPct}%` }} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Custeio</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatMoney(overview.custeioTotal)}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{custeioPct.toFixed(1)}% do total</p>
                    </div>
                    <div className="rounded-lg border border-border/60 bg-muted/10 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Capital</p>
                      <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatMoney(overview.capitalTotal)}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">{capitalPct.toFixed(1)}% do total</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="p-5 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Unidades contempladas</h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prévia das unidades com valor informado no 2º ciclo.
                  </p>
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link to="/repasses?ciclo=2">
                    Ver todas as {overview.escolas.length}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </Button>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      <th className="pb-2 pr-3">Unidade</th>
                      <th className="px-3 pb-2 text-right">Custeio</th>
                      <th className="px-3 pb-2 text-right">Capital</th>
                      <th className="pl-3 pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((school) => (
                      <tr key={school.unidadeId} className="border-b border-border/35 last:border-b-0">
                        <td className="py-3 pr-3">
                          <Link
                            to={`/escolas/${school.unidadeId}/recursos?return=${encodeURIComponent("/repasses?ciclo=2")}`}
                            className="text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {school.designacao}
                          </Link>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {school.inep ? `INEP ${school.inep}` : "INEP —"}
                          </p>
                        </td>
                        <td className="px-3 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.custeio)}</td>
                        <td className="px-3 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.capital)}</td>
                        <td className="pl-3 py-3 text-right text-sm font-semibold tabular-nums text-foreground">{formatMoney(school.valorInformado)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
