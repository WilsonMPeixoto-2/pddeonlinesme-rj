import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, CheckCircle2, Clock3, ReceiptText } from "lucide-react";

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
                    Pagamentos informados no 2º ciclo
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Pagamento informado pelo FNDE, ordem de pagamento e crédito localizado no extrato são evidências distintas. A ausência de extrato atualizado não apaga o pagamento oficial.
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
                  {overview.pagamentosIdentificados} de {overview.escolasEsperadas} unidades com pagamento oficial · {overview.escolasRegularesPagas} regular + {overview.escolasPrimeiraInfanciaPagas} Primeira Infância/P2
                </p>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <div className="rounded-xl border border-primary/25 bg-primary/[0.045] p-3">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Pagamento oficial FNDE</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                    {overview.pagamentosIdentificados}/{overview.escolasEsperadas}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {overview.coberturaPagamentoCompleta
                      ? "Cobertura completa da carteira"
                      : `${(overview.coberturaPagamento * 100).toFixed(1)}% da carteira esperada`}
                    {overview.ultimaDataPagamento ? ` · ${formatDate(overview.ultimaDataPagamento)}` : ""}
                  </p>
                </div>

                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.055] p-3">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Ordem de pagamento</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{overview.ordensIdentificadas}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {overview.ultimaDataOrdem ? `Mais recente em ${formatDate(overview.ultimaDataOrdem)}` : "Sem data separada de ordem"}
                  </p>
                </div>

                <div className={overview.creditosBancariosConfirmados > 0
                  ? "rounded-xl border border-success/25 bg-success/[0.055] p-3"
                  : "rounded-xl border border-border/60 bg-muted/20 p-3"}
                >
                  <div className={overview.creditosBancariosConfirmados > 0
                    ? "flex items-center gap-2 text-success"
                    : "flex items-center gap-2 text-muted-foreground"}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Crédito no extrato</p>
                  </div>
                  <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">{overview.creditosBancariosConfirmados}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {overview.ultimaDataCreditoBancario ? `Mais recente em ${formatDate(overview.ultimaDataCreditoBancario)}` : "Fonte bancária pública ainda sem cobertura suficiente"}
                  </p>
                </div>
              </div>

              {overview.ordensSemCredito > 0 ? (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-500/20 bg-amber-500/[0.035] px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200">
                  <CalendarDays className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    <strong className="font-semibold">{overview.ordensSemCredito}</strong> ordens ainda não têm crédito correspondente localizado no extrato público. O pagamento oficial permanece registrado separadamente.
                  </span>
                </div>
              ) : null}

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
                <table className="w-full min-w-[680px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/60 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                      <th className="pb-2 pr-3">Unidade</th>
                      <th className="px-3 pb-2">Situação</th>
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
                        <td className="px-3 py-3">
                          <span className={school.status === "credito-confirmado"
                            ? "inline-flex rounded-md border border-success/25 bg-success/[0.06] px-2 py-1 text-[10px] font-semibold text-success"
                            : school.status === "ordem-emitida"
                              ? "inline-flex rounded-md border border-amber-500/25 bg-amber-500/[0.06] px-2 py-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300"
                              : "inline-flex rounded-md border border-primary/25 bg-primary/[0.06] px-2 py-1 text-[10px] font-semibold text-primary"}
                          >
                            {school.status === "credito-confirmado"
                              ? "Crédito bancário confirmado"
                              : school.status === "ordem-emitida"
                                ? "Ordem emitida"
                                : "Pagamento informado pelo FNDE"}
                          </span>
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
