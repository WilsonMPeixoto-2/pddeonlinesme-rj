import { useState } from "react";
import {
  CalendarDays,
  Check,
  Copy,
  Landmark,
  WalletCards,
} from "lucide-react";

import { Button } from "@/components/ui/button";
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
  { border: string; icon: string; surface: string; eyebrow: string; dot: string }
> = {
  "PDDE BÁSICO": {
    border: "border-l-primary",
    icon: "bg-primary/10 text-primary ring-primary/20",
    surface: "bg-primary/[0.025]",
    eyebrow: "text-primary",
    dot: "bg-primary",
  },
  "PDDE QUALIDADE": {
    border: "border-l-violet-500",
    icon: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
    surface: "bg-violet-500/[0.025]",
    eyebrow: "text-violet-700 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  "PDDE EQUIDADE": {
    border: "border-l-teal-600",
    icon: "bg-teal-600/10 text-teal-700 ring-teal-600/20 dark:text-teal-300",
    surface: "bg-teal-600/[0.025]",
    eyebrow: "text-teal-700 dark:text-teal-300",
    dot: "bg-teal-600",
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

function formatBank(value: string | null | undefined) {
  if (!value?.trim()) return "—";
  if (value.trim() === "001") return "Banco do Brasil · 001";
  return value;
}

function installmentLabel(value: string) {
  const normalized = value.trim().toLocaleLowerCase("pt-BR");
  if (normalized === "1ª parcela" || normalized === "p1") return "Repasse · 1ª parcela";
  if (normalized === "2ª parcela" || normalized === "p2") return "2ª parcela";
  return value;
}

function AccountRow({
  id,
  banco,
  agencia,
  conta,
  principal,
}: {
  id: string;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  principal: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const copyValue = [formatBank(banco), formatAccountPart(agencia), formatAccountPart(conta)].join(" · ");

  const handleCopy = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(copyValue);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="grid gap-3 border-b border-border/40 py-3 last:border-b-0 sm:grid-cols-[minmax(170px,1fr)_110px_150px_auto] sm:items-center">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{formatBank(banco)}</p>
        {principal ? (
          <p className="mt-0.5 text-[11px] text-muted-foreground">Conta principal no cadastro atual</p>
        ) : null}
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Agência</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-foreground">{formatAccountPart(agencia)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Conta</p>
        <p className="mt-1 font-mono text-sm tabular-nums text-foreground">{formatAccountPart(conta)}</p>
      </div>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        onClick={handleCopy}
        disabled={!navigator.clipboard}
        className="h-8 justify-self-start px-2 text-xs sm:justify-self-end"
        aria-label={`Copiar dados da conta ${id}`}
      >
        {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
        {copied ? "Copiado" : "Copiar"}
      </Button>
    </div>
  );
}

function ComponentsBreakdown({
  custeio,
  capital,
}: {
  custeio: number | null;
  capital: number | null;
}) {
  if (custeio === null && capital === null) return null;

  return (
    <div className="grid gap-3 border-t border-border/40 pt-3 sm:grid-cols-2">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Custeio</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatMoney(custeio)}</p>
      </div>
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Capital</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatMoney(capital)}</p>
      </div>
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
          <Skeleton key={index} className="h-52 w-full rounded-xl" />
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
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {programas.map((programa) => {
        const tone = PROGRAM_TONE[programa.programa] ?? {
          border: "border-l-border",
          icon: "bg-muted text-muted-foreground ring-border/50",
          surface: "bg-muted/[0.025]",
          eyebrow: "text-foreground",
          dot: "bg-muted-foreground",
        };

        return (
          <Card
            key={programa.programa}
            className={cn("overflow-hidden border-l-4 shadow-sm", tone.border, tone.surface)}
          >
            <CardContent className="p-0">
              <div className="flex items-start gap-4 border-b border-border/50 px-5 py-5 sm:px-6">
                <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1", tone.icon)}>
                  <WalletCards className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", tone.eyebrow)}>Programa</p>
                  <h2 className="mt-0.5 text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                    {programa.programa}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {programa.contas.length === 1 ? "1 conta" : `${programa.contas.length} contas`}
                    {programa.acoes.length > 0
                      ? ` · ${programa.acoes.length} ${programa.acoes.length === 1 ? "ação" : "ações"}`
                      : ""}
                  </p>
                </div>
              </div>

              {programa.contas.length > 0 ? (
                <section className="px-5 py-4 sm:px-6" aria-label={`Contas do ${programa.programa}`}>
                  <div className="mb-1 flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Contas vinculadas</h3>
                  </div>
                  <div>
                    {programa.contas.map((conta) => (
                      <AccountRow
                        key={conta.id}
                        id={conta.id}
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
                      className="border-b border-border/50 px-5 py-5 last:border-b-0 sm:px-6"
                      aria-label={acao.label}
                    >
                      <div className="flex items-center gap-2">
                        <span className={cn("h-2 w-2 rounded-full", tone.dot)} aria-hidden="true" />
                        <h3 className="text-base font-semibold text-foreground">{acao.label}</h3>
                      </div>

                      <div className="mt-4 grid gap-3 xl:grid-cols-2">
                        {acao.parcelas.map((parcela) => {
                          const paid = parcela.valorPago !== null;
                          return (
                            <article
                              key={parcela.id}
                              className="rounded-xl border border-border/55 bg-background/65 p-4"
                            >
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-foreground">{installmentLabel(parcela.parcela)}</p>
                                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                                    {paid ? "Pagamento identificado" : "Programado"}
                                  </p>
                                </div>
                                <span className="rounded-md border border-border/60 bg-muted/30 px-2 py-1 text-[10px] font-semibold text-muted-foreground">
                                  {paid ? "Pago" : "Programado"}
                                </span>
                              </div>

                              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Valor programado</p>
                                  <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatMoney(parcela.valorProgramado)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Valor pago</p>
                                  <p className="mt-1 text-base font-semibold tabular-nums text-foreground">{formatMoney(parcela.valorPago)}</p>
                                </div>
                                <div>
                                  <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                    Data do pagamento
                                  </div>
                                  <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{formatDate(parcela.dataPagamento)}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Ordem de pagamento</p>
                                  <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{formatDate(parcela.dataOrdemPagamento)}</p>
                                </div>
                              </div>

                              <div className="mt-4">
                                <ComponentsBreakdown
                                  custeio={paid ? parcela.custeioPago : parcela.custeioProgramado}
                                  capital={paid ? parcela.capitalPago : parcela.capitalProgramado}
                                />
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <div className="border-t border-border/50 px-5 py-4 text-xs text-muted-foreground sm:px-6">
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
