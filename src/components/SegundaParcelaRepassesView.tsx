import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownWideNarrow,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Download,
  Search,
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
import { buildSegundaParcelaOverview } from "@/lib/financeiroPDDE";
import { repassesFinanceirosOptions } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

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

function formatMoney(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

function escapeCsv(value: string | number | null) {
  if (value === null) return "";
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function statusLabel(status: "credito-confirmado" | "ordem-emitida" | "pagamento-informado") {
  if (status === "credito-confirmado") return "Crédito bancário confirmado";
  if (status === "ordem-emitida") return "Ordem emitida";
  return "Pagamento informado";
}

function statusClasses(status: "credito-confirmado" | "ordem-emitida" | "pagamento-informado") {
  if (status === "credito-confirmado") {
    return "border-success/30 bg-success/8 text-success";
  }
  if (status === "ordem-emitida") {
    return "border-amber-500/30 bg-amber-500/8 text-amber-700 dark:text-amber-300";
  }
  return "border-border bg-muted/30 text-muted-foreground";
}

export function SegundaParcelaRepassesView() {
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);
  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");
  const [status, setStatus] = useState<"todos" | "ordem" | "pago">(() => {
    const raw = searchParams.get("status2");
    return raw === "ordem" || raw === "pago" ? raw : "todos";
  });
  const [sort, setSort] = useState<"valor" | "nome">(() =>
    searchParams.get("ordem2") === "nome" ? "nome" : "valor",
  );

  const overview = useMemo(
    () => buildSegundaParcelaOverview(repassesQuery.data ?? [], exercicioNumero),
    [repassesQuery.data, exercicioNumero],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    next.set("ciclo", "2");
    const term = search.trim();
    if (term) next.set("q", term);
    if (status !== "todos") next.set("status2", status);
    if (sort !== "valor") next.set("ordem2", sort);
    setSearchParams(next, { replace: true });
  }, [search, setSearchParams, sort, status]);

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    const rows = overview.escolas.filter((school) => {
      if (status === "ordem" && school.status !== "ordem-emitida") return false;
      if (status === "pago" && school.status !== "credito-confirmado") return false;
      if (!term) return true;
      return [school.designacao, school.nome, school.inep ?? "", school.acao]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term);
    });

    return [...rows].sort((a, b) =>
      sort === "nome"
        ? a.designacao.localeCompare(b.designacao, "pt-BR")
        : b.valorInformado - a.valorInformado || a.designacao.localeCompare(b.designacao, "pt-BR"),
    );
  }, [overview.escolas, search, sort, status]);

  const composicaoCompleta = overview.custeioTotal !== null && overview.capitalTotal !== null;
  const totalComposicao = composicaoCompleta
    ? (overview.custeioTotal ?? 0) + (overview.capitalTotal ?? 0)
    : null;
  const custeioPct = totalComposicao && totalComposicao > 0
    ? ((overview.custeioTotal ?? 0) / totalComposicao) * 100
    : 0;
  const capitalPct = totalComposicao && totalComposicao > 0
    ? ((overview.capitalTotal ?? 0) / totalComposicao) * 100
    : 0;

  const exportFiltered = () => {
    const header = [
      "Unidade escolar",
      "INEP",
      "Ação",
      "Situação",
      "Ordem de pagamento",
      "Data informada pelo FNDE",
      "Crédito bancário confirmado",
      "Custeio",
      "Capital",
      "Total informado",
    ];
    const lines = filteredSchools.map((school) =>
      [
        school.designacao,
        school.inep,
        school.acao,
        statusLabel(school.status),
        school.dataOrdem,
        school.dataPagamento,
        school.dataCreditoBancario,
        school.custeio === null ? null : school.custeio.toFixed(2).replace(".", ","),
        school.capital === null ? null : school.capital.toFixed(2).replace(".", ","),
        school.valorInformado.toFixed(2).replace(".", ","),
      ]
        .map(escapeCsv)
        .join(";"),
    );
    const csv = `\uFEFF${header.map(escapeCsv).join(";")}\n${lines.join("\n")}`;
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `pdde-segundo-ciclo-${exercicio}-${filteredSchools.length}-escolas.csv`,
    );
  };

  const clearFilters = () => {
    setSearch("");
    setStatus("todos");
    setSort("valor");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
              Repasses · {exercicio}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              2º ciclo · PDDE Básico
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Valor informado, ordem emitida e crédito bancário confirmado são exibidos como estágios distintos do mesmo ciclo.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFiltered}
            disabled={filteredSchools.length === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar {filteredSchools.length} unidades
          </Button>
        </header>

        <div className="inline-flex rounded-lg border border-border/60 bg-muted/15 p-1" aria-label="Selecionar ciclo de repasse">
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/repasses">1ª parcela paga</Link>
          </Button>
          <Button variant="secondary" size="sm" className="h-8" aria-current="page">
            2º ciclo · pagamentos
          </Button>
        </div>

        {repassesQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-44 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : repassesQuery.isError ? (
          <EmptyState
            icon={WalletCards}
            title="Não foi possível carregar o segundo ciclo"
            description={repassesQuery.error.message}
            action={<Button onClick={() => repassesQuery.refetch()}>Tentar novamente</Button>}
          />
        ) : overview.escolas.length === 0 ? (
          <EmptyState
            icon={WalletCards}
            title={`Nenhuma evidência do 2º ciclo disponível para ${exercicio}`}
            description="A ausência de evidência não é convertida em pagamento ou zero."
          />
        ) : (
          <>
            <Card className="overflow-hidden shadow-sm">
              <CardContent className="grid p-0 md:grid-cols-4">
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Valor informado</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatMoney(overview.totalInformado)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{overview.escolas.length} unidades no recorte</p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <div className="flex items-center gap-2 text-primary">
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Pagamento informado</p>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{overview.pagamentosIdentificados}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {overview.ultimaDataPagamento ? `Data mais recente ${formatDate(overview.ultimaDataPagamento)}` : "Valor informado sem data específica"}
                  </p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                    <Clock3 className="h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Ordens emitidas</p>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{overview.ordensIdentificadas}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {overview.ultimaDataOrdem ? `Mais recente em ${formatDate(overview.ultimaDataOrdem)}` : "Sem data de ordem separada"}
                  </p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <div className={overview.creditosBancariosConfirmados > 0 ? "flex items-center gap-2 text-success" : "flex items-center gap-2 text-muted-foreground"}>
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Crédito bancário confirmado</p>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{overview.creditosBancariosConfirmados}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {overview.ultimaDataCreditoBancario ? `Mais recente em ${formatDate(overview.ultimaDataCreditoBancario)}` : "Evidência bancária independente ainda não localizada"}
                  </p>
                </div>
              </CardContent>
            </Card>

            {composicaoCompleta && totalComposicao !== null ? (
              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Composição do 2º ciclo</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Custeio e capital apenas nos valores efetivamente informados pela fonte.</p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">{formatMoney(totalComposicao)}</span>
                  </div>
                  <div
                    className="mt-4 flex h-3 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`Composição do segundo ciclo: ${custeioPct.toFixed(1)}% custeio e ${capitalPct.toFixed(1)}% capital`}
                  >
                    <div className="h-full bg-fin-custeio" style={{ width: `${custeioPct}%` }} />
                    <div className="h-full bg-fin-capital" style={{ width: `${capitalPct}%` }} />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                    <span><strong className="font-semibold text-foreground">Custeio:</strong> {formatMoney(overview.custeioTotal)} · {custeioPct.toFixed(1)}%</span>
                    <span><strong className="font-semibold text-foreground">Capital:</strong> {formatMoney(overview.capitalTotal)} · {capitalPct.toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h2 className="text-sm font-semibold text-foreground">Unidades contempladas</h2>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filteredSchools.length} de {overview.escolas.length} unidades no recorte
                    </p>
                  </div>

                  <div className="flex flex-1 flex-wrap items-center justify-end gap-2 sm:flex-none">
                    <div className="relative min-w-[220px] flex-1 sm:w-72 sm:flex-none">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                      <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Buscar unidade ou INEP"
                        className="h-9 pl-9"
                        aria-label="Buscar unidade escolar"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant={status === "ordem" ? "secondary" : "outline"}
                      onClick={() => setStatus((current) => current === "ordem" ? "todos" : "ordem")}
                    >
                      Ordem emitida
                    </Button>
                    {overview.creditosBancariosConfirmados > 0 ? (
                      <Button
                        size="sm"
                        variant={status === "pago" ? "secondary" : "outline"}
                        onClick={() => setStatus((current) => current === "pago" ? "todos" : "pago")}
                      >
                        Crédito bancário confirmado
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSort((current) => current === "valor" ? "nome" : "valor")}
                    >
                      <ArrowDownWideNarrow className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                      {sort === "valor" ? "Maior valor" : "Nome"}
                    </Button>
                    {(search || status !== "todos" || sort !== "valor") ? (
                      <Button size="sm" variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Limpar
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1040px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground">
                        <th className="px-4 py-3">Unidade escolar</th>
                        <th className="px-4 py-3">Ação</th>
                        <th className="px-4 py-3">Situação</th>
                        <th className="px-4 py-3">Datas / evidências</th>
                        <th className="px-4 py-3 text-right">Custeio</th>
                        <th className="px-4 py-3 text-right">Capital</th>
                        <th className="px-4 py-3 text-right">Valor informado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSchools.length > 0 ? (
                        filteredSchools.map((school) => (
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
                            <td className="px-4 py-3 text-sm text-foreground">{school.acao}</td>
                            <td className="px-4 py-3">
                              <span className={cn(
                                "inline-flex rounded-md border px-2 py-1 text-[11px] font-semibold",
                                statusClasses(school.status),
                              )}>
                                {statusLabel(school.status)}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {school.dataPagamento ? (
                                <div className="flex items-center gap-1.5 whitespace-nowrap text-sm tabular-nums text-muted-foreground">
                                  <CalendarDays className="h-3.5 w-3.5" aria-hidden="true" />
                                  Pagamento informado: {formatDate(school.dataPagamento)}
                                </div>
                              ) : null}
                              {school.dataOrdem ? (
                                <p className="mt-1 text-[10px] text-muted-foreground">
                                  Ordem: {formatDate(school.dataOrdem)}
                                </p>
                              ) : null}
                              {school.dataCreditoBancario ? (
                                <p className="mt-1 text-[10px] font-medium text-success">
                                  Crédito bancário: {formatDate(school.dataCreditoBancario)}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.custeio)}</td>
                            <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">{formatMoney(school.capital)}</td>
                            <td className="px-4 py-3 text-right text-sm font-semibold tabular-nums text-foreground">{formatMoney(school.valorInformado)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                            Nenhuma unidade corresponde aos filtros aplicados.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
