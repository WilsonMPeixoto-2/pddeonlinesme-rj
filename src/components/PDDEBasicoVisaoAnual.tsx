import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  BarChart3,
  CalendarDays,
  Download,
  Search,
  School,
  WalletCards,
  X,
} from "lucide-react";
import { saveAs } from "file-saver";

import AppLayout from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercicio } from "@/hooks/useExercicio";
import {
  buildPDDEBasicoAnualOverview,
  type FaixaPDDEBasicoAnual,
} from "@/lib/financeiroPDDE";
import { repassesFinanceirosOptions } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

const compactMoneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "short",
  timeZone: "UTC",
});

const fullDateFormatter = new Intl.DateTimeFormat("pt-BR", {
  timeZone: "UTC",
});

function formatDate(value: string) {
  return dateFormatter.format(new Date(`${value}T00:00:00Z`)).replace(".", "");
}

function formatFullDate(value: string) {
  return fullDateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

function escapeCsv(value: string | number | null) {
  if (value === null) return "";
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

export function PDDEBasicoVisaoAnual() {
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);
  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [selectedBandId, setSelectedBandId] = useState<FaixaPDDEBasicoAnual["id"] | null>(() => {
    const raw = searchParams.get("faixaAnual");
    return raw === "ate-5" || raw === "5-10" || raw === "10-15" || raw === "15-20" || raw === "acima-20"
      ? raw
      : null;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(() => searchParams.get("dataAnual"));
  const [sort, setSort] = useState<"valor" | "nome">("valor");

  const overview = useMemo(
    () => buildPDDEBasicoAnualOverview(repassesQuery.data ?? [], exercicioNumero),
    [repassesQuery.data, exercicioNumero],
  );

  const selectedBand = overview.faixas.find((band) => band.id === selectedBandId) ?? null;
  const selectedTimelineEvent = overview.linhaTempo.find((event) => event.data === selectedDate) ?? null;
  const maxBandCount = Math.max(1, ...overview.faixas.map((band) => band.escolas));
  const firstCycleShare = overview.totalAnual > 0 ? overview.totalPrimeiroCiclo / overview.totalAnual : 0;
  const secondCycleShare = overview.totalAnual > 0 ? overview.totalSegundoCiclo / overview.totalAnual : 0;

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const rows = overview.escolas.filter((school) => {
      if (selectedBand) {
        const aboveMin = selectedBand.minExclusive === null || school.totalAnual > selectedBand.minExclusive;
        const belowMax = selectedBand.maxInclusive === null || school.totalAnual <= selectedBand.maxInclusive;
        if (!aboveMin || !belowMax) return false;
      }
      if (selectedTimelineEvent && !selectedTimelineEvent.unidadeIds.includes(school.unidadeId)) return false;
      if (!term) return true;
      return [school.designacao, school.nome, school.inep ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term);
    });

    return [...rows].sort((a, b) =>
      sort === "nome"
        ? a.designacao.localeCompare(b.designacao, "pt-BR")
        : b.totalAnual - a.totalAnual || a.designacao.localeCompare(b.designacao, "pt-BR"),
    );
  }, [overview.escolas, search, selectedBand, selectedTimelineEvent, sort]);

  const syncParams = (
    nextSearch = search,
    nextBand = selectedBandId,
    nextDate = selectedDate,
  ) => {
    const next = new URLSearchParams();
    next.set("visao", "anual");
    const term = nextSearch.trim();
    if (term) next.set("q", term);
    if (nextBand) next.set("faixaAnual", nextBand);
    if (nextDate) next.set("dataAnual", nextDate);
    setSearchParams(next, { replace: true });
  };

  const exportRows = () => {
    const header = [
      "Unidade escolar",
      "INEP",
      "1º ciclo de repasses",
      "2º ciclo de repasses",
      "Total PDDE Básico",
    ];
    const rows = filteredSchools.map((school) => [
      school.designacao,
      school.inep,
      school.primeiroCiclo.toFixed(2).replace(".", ","),
      school.segundoCiclo.toFixed(2).replace(".", ","),
      school.totalAnual.toFixed(2).replace(".", ","),
    ]);
    const csv = `\uFEFF${[header, ...rows].map((row) => row.map(escapeCsv).join(";")).join("\n")}`;
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `pdde-basico-${exercicio}-visao-anual-${filteredSchools.length}-unidades.csv`,
    );
  };

  if (repassesQuery.isLoading) {
    return (
      <AppLayout>
        <div className="space-y-5">
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      </AppLayout>
    );
  }

  if (repassesQuery.isError) {
    return (
      <AppLayout>
        <EmptyState
          icon={WalletCards}
          title="Não foi possível carregar a visão anual"
          description={repassesQuery.error.message}
          action={<Button onClick={() => repassesQuery.refetch()}>Tentar novamente</Button>}
        />
      </AppLayout>
    );
  }

  if (overview.escolas.length === 0) {
    return (
      <AppLayout>
        <EmptyState
          icon={WalletCards}
          title={`Nenhum repasse oficial do PDDE Básico disponível para ${exercicio}`}
          description="A visão anual considera somente pagamentos informados pelo FNDE com valor e data de pagamento."
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
              Repasses · PDDE Básico · {exercicio}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Visão anual dos repasses
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Soma dos pagamentos oficiais informados pelo FNDE nos dois ciclos de repasses do exercício.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportRows}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar {filteredSchools.length} unidades
          </Button>
        </header>

        <div className="inline-flex flex-wrap rounded-lg border border-border/60 bg-muted/15 p-1" aria-label="Selecionar visão de repasses">
          <Button variant="secondary" size="sm" className="h-8" aria-current="page">
            Visão anual
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/repasses?ciclo=1">1º ciclo de repasses</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/repasses?ciclo=2">2º ciclo de repasses</Link>
          </Button>
        </div>

        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-[1.2fr_0.8fr]">
              <div className="p-6 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {overview.coberturaCompleta ? "Total de repasses" : "Total oficial identificado"} · PDDE Básico · {exercicio}
                </p>
                <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-foreground sm:text-5xl">
                  {formatMoney(overview.totalAnual)}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {overview.coberturaCompleta
                    ? `${overview.escolasComDoisCiclos} de ${overview.escolasEsperadas} unidades com pagamentos oficiais nos dois ciclos de repasses.`
                    : `${overview.escolasComDoisCiclos} de ${overview.escolasEsperadas} unidades já possuem os dois ciclos de repasses informados.`}
                </p>

                <div
                  className="mt-6 flex h-3 overflow-hidden rounded-full bg-muted"
                  role="img"
                  aria-label={`Composição anual: ${(firstCycleShare * 100).toFixed(1)}% no primeiro ciclo e ${(secondCycleShare * 100).toFixed(1)}% no segundo ciclo`}
                >
                  <div className="h-full bg-primary" style={{ width: `${firstCycleShare * 100}%` }} />
                  <div className="h-full bg-violet-500" style={{ width: `${secondCycleShare * 100}%` }} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Link
                    to="/repasses?ciclo=1"
                    className="rounded-xl border border-primary/20 bg-primary/[0.035] p-4 transition-colors hover:bg-primary/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-primary">1º ciclo de repasses</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{(firstCycleShare * 100).toFixed(1)}%</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                      {formatMoney(overview.totalPrimeiroCiclo)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{overview.escolasPrimeiroCiclo} unidades</p>
                  </Link>

                  <Link
                    to="/repasses?ciclo=2"
                    className="rounded-xl border border-violet-500/20 bg-violet-500/[0.035] p-4 transition-colors hover:bg-violet-500/[0.07]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">2º ciclo de repasses</span>
                      <span className="text-[10px] tabular-nums text-muted-foreground">{(secondCycleShare * 100).toFixed(1)}%</span>
                    </div>
                    <p className="mt-2 text-xl font-semibold tabular-nums text-foreground">
                      {formatMoney(overview.totalSegundoCiclo)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">{overview.escolasSegundoCiclo} unidades</p>
                  </Link>
                </div>
              </div>

              <div className="border-t border-border/60 bg-muted/[0.12] p-6 lg:border-l lg:border-t-0 sm:p-7">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  Distribuição por unidade
                </p>
                <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Média</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{compactMoneyFormatter.format(overview.media)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Mediana</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{compactMoneyFormatter.format(overview.mediana)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Menor total</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{compactMoneyFormatter.format(overview.menorTotal)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Maior total</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{compactMoneyFormatter.format(overview.maiorTotal)}</p>
                  </div>
                </div>
                <div className="mt-5 border-t border-border/50 pt-4">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">Cobertura dos dois ciclos</span>
                    <span className={cn(
                      "font-semibold tabular-nums",
                      overview.coberturaCompleta ? "text-success" : "text-amber-700 dark:text-amber-300",
                    )}>
                      {overview.escolasComDoisCiclos}/{overview.escolasEsperadas}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                    Estes valores representam repasses oficiais do exercício. Saldo bancário e conciliação são dimensões independentes.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Linha do tempo dos repasses</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Cada marco representa pagamentos oficiais informados pelo FNDE. Clique para filtrar as unidades correspondentes.
                  </p>
                </div>
              </div>
              {selectedTimelineEvent ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedDate(null);
                    syncParams(search, selectedBandId, null);
                  }}
                >
                  <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Limpar data
                </Button>
              ) : null}
            </div>

            <div className="relative mt-6">
              <div className="absolute left-3 right-3 top-3 hidden h-px bg-border md:block" aria-hidden="true" />
              <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                {overview.linhaTempo.map((event) => {
                  const active = selectedDate === event.data;
                  return (
                    <button
                      key={`${event.ciclo}-${event.data}`}
                      type="button"
                      aria-label={`Filtrar pagamentos de ${formatFullDate(event.data)}: ${event.ciclo}º ciclo de repasses, ${event.escolas} ${event.escolas === 1 ? "unidade" : "unidades"}, ${formatMoney(event.total)}`}
                      aria-pressed={active}
                      onClick={() => {
                        const next = active ? null : event.data;
                        setSelectedDate(next);
                        syncParams(search, selectedBandId, next);
                      }}
                      className={cn(
                        "relative z-10 rounded-xl border bg-background px-3 pb-3 pt-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active
                          ? "border-primary/40 bg-primary/[0.055]"
                          : "border-border/55 hover:border-border hover:bg-muted/15",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute left-3 top-2 h-2.5 w-2.5 rounded-full ring-4 ring-background",
                          event.ciclo === 1 ? "bg-primary" : "bg-violet-500",
                        )}
                        aria-hidden="true"
                      />
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                        {event.ciclo}º ciclo de repasses
                      </p>
                      <p className="mt-1 text-sm font-semibold text-foreground">{formatDate(event.data)}</p>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                        {compactMoneyFormatter.format(event.total)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {event.escolas} {event.escolas === 1 ? "unidade" : "unidades"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" aria-hidden="true" />
                <div>
                  <h2 className="text-sm font-semibold text-foreground">Distribuição dos totais por escola</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">Clique em uma faixa para filtrar a tabela.</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {overview.faixas.map((band) => {
                  const active = selectedBandId === band.id;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => {
                        const next = active ? null : band.id;
                        setSelectedBandId(next);
                        syncParams(search, next, selectedDate);
                      }}
                      aria-pressed={active}
                      className={cn(
                        "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                        active ? "border-primary/35 bg-primary/[0.06]" : "border-border/50 hover:bg-muted/20",
                      )}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-medium text-foreground">{band.label}</span>
                        <span className="text-xs tabular-nums text-muted-foreground">{band.escolas} escolas</span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn("h-full rounded-full", active ? "bg-primary" : "bg-primary/55")}
                          style={{ width: `${Math.max(2, (band.escolas / maxBandCount) * 100)}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden shadow-sm">
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                <div className="flex items-center gap-2">
                  <School className="h-4 w-4 text-primary" aria-hidden="true" />
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">Unidades escolares</h2>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {filteredSchools.length} de {overview.escolas.length} unidades
                    </p>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
                  <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={search}
                      onChange={(event) => {
                        const value = event.target.value;
                        setSearch(value);
                        syncParams(value, selectedBandId, selectedDate);
                      }}
                      placeholder="Buscar unidade ou INEP"
                      className="h-9 pl-9"
                      aria-label="Buscar unidade escolar"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setSort((current) => current === "valor" ? "nome" : "valor")}
                  >
                    <ArrowDownWideNarrow className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                    {sort === "valor" ? "Maior total" : "Nome"}
                  </Button>
                  {(search || selectedBandId || selectedDate) ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setSearch("");
                        setSelectedBandId(null);
                        setSelectedDate(null);
                        syncParams("", null, null);
                      }}
                    >
                      <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      Limpar
                    </Button>
                  ) : null}
                </div>
              </div>

              {(selectedBand || selectedTimelineEvent) ? (
                <div className="flex flex-wrap items-center gap-2 border-b border-border/50 bg-primary/[0.025] px-5 py-3 text-xs">
                  <span className="font-semibold text-foreground">Análise ativa:</span>
                  {selectedTimelineEvent ? (
                    <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-muted-foreground">
                      {formatDate(selectedTimelineEvent.data)} · {selectedTimelineEvent.escolas} {selectedTimelineEvent.escolas === 1 ? "unidade" : "unidades"}
                    </span>
                  ) : null}
                  {selectedBand ? (
                    <span className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-muted-foreground">
                      {selectedBand.label}
                    </span>
                  ) : null}
                  <span className="ml-auto tabular-nums text-muted-foreground">
                    {filteredSchools.length} registros no recorte
                  </span>
                </div>
              ) : null}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground">
                      <th className="px-4 py-3">Unidade escolar</th>
                      <th className="px-4 py-3 text-right">1º ciclo de repasses</th>
                      <th className="px-4 py-3 text-right">2º ciclo de repasses</th>
                      <th className="px-4 py-3 text-right">Total PDDE Básico</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSchools.map((school) => (
                      <tr key={school.unidadeId} className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/15">
                        <td className="px-4 py-3">
                          <Link
                            to={`/escolas/${school.unidadeId}/recursos?return=${encodeURIComponent(`/repasses?${searchParams.toString()}`)}`}
                            viewTransition
                            className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                          >
                            {school.designacao}
                          </Link>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {school.inep ? `INEP ${school.inep}` : "INEP —"}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.primeiroCiclo)}</td>
                        <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.segundoCiclo)}</td>
                        <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">{formatMoney(school.totalAnual)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
