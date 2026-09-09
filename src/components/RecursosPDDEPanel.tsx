import {
  CalendarDays,
  Landmark,
  WalletCards,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ProgramaFinanceiro } from "@/lib/financeiroPDDE";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
});

const PROGRAM_TONE: Record<
  string,
  { border: string; icon: string; surface: string }
> = {
  "PDDE BÁSICO": {
    border: "border-l-primary",
    icon: "bg-primary/10 text-primary ring-primary/20",
    surface: "bg-primary/[0.035]",
  },
  "PDDE QUALIDADE": {
    border: "border-l-success",
    icon: "bg-success/10 text-success ring-success/20",
    surface: "bg-success/[0.035]",
  },
  "PDDE EQUIDADE": {
    border: "border-l-warning",
    icon: "bg-warning/10 text-warning ring-warning/20",
    surface: "bg-warning/[0.035]",
  },
};

function formatMoney(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : moneyFormatter.format(value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatAccountPart(value: string | null | undefined) {
  return value?.trim() ? value : "—";
}

function AccountRow({
  banco,
  agencia,
  conta,
  principal,
}: {
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  principal: boolean;
}) {
  return (
    <div className="grid gap-2 border-b border-border/40 py-2.5 last:border-b-0 sm:grid-cols-[minmax(150px,1fr)_120px_150px] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-foreground">
          {formatAccountPart(banco)}
        </p>
        {principal ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">Conta principal da unidade</p>
        ) : null}
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:hidden">
          Agência
        </p>
        <p className="font-mono text-sm tabular-nums text-foreground">
          {formatAccountPart(agencia)}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground sm:hidden">
          Conta
        </p>
        <p className="font-mono text-sm tabular-nums text-foreground">
          {formatAccountPart(conta)}
        </p>
      </div>
    </div>
  );
}

function ComponentsBreakdown({
  custeio,
  capital,
  label,
}: {
  custeio: number | null;
  capital: number | null;
  label: "Programado" | "Pago";
}) {
  if (custeio === null && capital === null) return null;

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 pt-2 text-xs text-muted-foreground">
      {custeio !== null ? (
        <span>
          Custeio {label.toLowerCase()}: <strong className="font-medium text-foreground">{formatMoney(custeio)}</strong>
        </span>
      ) : null}
      {capital !== null ? (
        <span>
          Capital {label.toLowerCase()}: <strong className="font-medium text-foreground">{formatMoney(capital)}</strong>
        </span>
      ) : null}
    </div>
  );
}

export function RecursosPDDEPanel({
  programas,
  isLoading = false,
  error,
}: {
  programas: ProgramaFinanceiro[];
  isLoading?: boolean;
  error?: string | null;
}) {
  if (isLoading) {
    return (
      <div className="space-y-4" aria-label="Carregando recursos PDDE">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-44 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (programas.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
        <WalletCards className="mx-auto h-6 w-6 text-muted-foreground" />
        <p className="mt-2 text-sm font-medium">Nenhum recurso financeiro disponível para este exercício.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          A ausência de registro não é tratada como valor zero.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {programas.map((programa) => {
        const tone = PROGRAM_TONE[programa.programa] ?? {
          border: "border-l-border",
          icon: "bg-muted text-muted-foreground ring-border/50",
          surface: "bg-muted/[0.025]",
        };

        return (
          <Card
            key={programa.programa}
            className={cn(
              "overflow-hidden border-l-4 shadow-sm",
              tone.border,
              tone.surface,
            )}
          >
            <CardContent className="p-0">
              <div className="flex items-center gap-3 border-b border-border/50 px-5 py-4">
                <div
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1",
                    tone.icon,
                  )}
                >
                  <WalletCards className="h-4 w-4" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-semibold tracking-tight text-foreground">
                    {programa.programa}
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    {programa.contas.length === 1
                      ? "1 conta vinculada"
                      : `${programa.contas.length} contas vinculadas`}
                    {programa.acoes.length > 0
                      ? ` · ${programa.acoes.length} ${programa.acoes.length === 1 ? "ação" : "ações"}`
                      : ""}
                  </p>
                </div>
              </div>

              {programa.contas.length > 0 ? (
                <section className="px-5 py-3" aria-label={`Contas do ${programa.programa}`}>
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                    <Landmark className="h-3.5 w-3.5" aria-hidden="true" />
                    Contas
                  </div>
                  <div>
                    {programa.contas.map((conta) => (
                      <AccountRow
                        key={conta.id}
                        banco={conta.banco}
                        agencia={conta.agencia}
                        conta={conta.conta_corrente}
                        principal={conta.principal}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {programa.acoes.length > 0 ? (
                <div className="border-t border-border/50">
                  {programa.acoes.map((acao) => (
                    <section
                      key={acao.acao}
                      className="border-b border-border/50 px-5 py-4 last:border-b-0"
                      aria-label={acao.label}
                    >
                      <h3 className="text-sm font-semibold text-foreground">{acao.label}</h3>
                      <div className="mt-3 space-y-2.5">
                        {acao.parcelas.map((parcela) => {
                          const paid = parcela.valorPago !== null;
                          return (
                            <div
                              key={parcela.id}
                              className="rounded-lg border border-border/50 bg-background/60 px-4 py-3"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground">
                                    {parcela.parcela}
                                  </p>
                                  <p className="mt-0.5 text-lg font-semibold tabular-nums text-foreground">
                                    {formatMoney(paid ? parcela.valorPago : parcela.valorProgramado)}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground">
                                    {paid ? "Valor pago" : "Valor programado"}
                                  </p>
                                </div>
                                <div className="min-w-[160px] text-left sm:text-right">
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground sm:justify-end">
                                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                    {paid ? `Pagamento ${formatDate(parcela.dataPagamento)}` : "Pagamento ainda não informado"}
                                  </div>
                                  {parcela.dataOrdemPagamento ? (
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                      Ordem de pagamento {formatDate(parcela.dataOrdemPagamento)}
                                    </p>
                                  ) : null}
                                </div>
                              </div>

                              {paid ? (
                                <ComponentsBreakdown
                                  label="Pago"
                                  custeio={parcela.custeioPago}
                                  capital={parcela.capitalPago}
                                />
                              ) : (
                                <ComponentsBreakdown
                                  label="Programado"
                                  custeio={parcela.custeioProgramado}
                                  capital={parcela.capitalProgramado}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="border-t border-border/50 px-5 py-4 text-xs text-muted-foreground">
                  Nenhum repasse associado a este programa no recorte atual.
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
