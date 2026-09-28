import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, Search, Sigma, WalletCards } from "lucide-react";
import { saveAs } from "file-saver";

import AppLayout from "@/components/AppLayout";
import { EmptyState } from "@/components/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useExercicio } from "@/hooks/useExercicio";
import { buildPddeBasicoTotalOverview } from "@/lib/financeiroPDDE";
import { repassesFinanceirosOptions } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 2,
});

function formatMoney(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

function escapeCsv(value: string | number | null) {
  if (value === null) return "";
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function statusLabel(status: ReturnType<typeof buildPddeBasicoTotalOverview>["escolas"][number]["segundaSituacao"]) {
  if (status === "credito-confirmado") return "Crédito bancário confirmado";
  if (status === "pagamento-informado") return "Pagamento informado pelo FNDE";
  if (status === "ordem-emitida") return "Ordem de pagamento emitida";
  return "Sem evidência do 2º ciclo de repasses";
}

export function PddeBasicoTotalView() {
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);
  const [searchParams] = useSearchParams();
  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "");

  const overview = useMemo(
    () => buildPddeBasicoTotalOverview(repassesQuery.data ?? [], exercicioNumero),
    [repassesQuery.data, exercicioNumero],
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    if (!term) return overview.escolas;
    return overview.escolas.filter((school) =>
      [school.designacao, school.nome, school.inep ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term),
    );
  }, [overview.escolas, search]);

  const exportFiltered = () => {
    const header = [
      "Unidade escolar",
      "INEP",
      "1ª parcela",
      "2º ciclo de repasses",
      "Total PDDE Básico",
      "Situação do 2º ciclo de repasses",
    ];
    const lines = filtered.map((school) => [
      school.designacao,
      school.inep,
      school.primeiraParcela === null ? null : school.primeiraParcela.toFixed(2).replace(".", ","),
      school.segundoCiclo === null ? null : school.segundoCiclo.toFixed(2).replace(".", ","),
      school.totalInformado.toFixed(2).replace(".", ","),
      statusLabel(school.segundaSituacao),
    ].map(escapeCsv).join(";"));

    const csv = `\uFEFF${header.map(escapeCsv).join(";")}\n${lines.join("\n")}`;
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `pdde-basico-total-por-unidade-${exercicio}-${filtered.length}-escolas.csv`,
    );
  };

  return (
    <AppLayout wide>
      <div className="space-y-5">
        <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              <WalletCards className="h-3.5 w-3.5" aria-hidden="true" />
              Repasses · {exercicio}
            </div>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              PDDE Básico · total por unidade
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              Soma da 1ª parcela com o 2º ciclo de repasses para cada unidade escolar. O valor do 2º ciclo mantém a situação da evidência financeira visível e não é confundido com crédito bancário confirmado.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={exportFiltered} disabled={filtered.length === 0}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar {filtered.length} unidades
          </Button>
        </header>

        <div className="inline-flex flex-wrap rounded-lg border border-border/60 bg-muted/15 p-1" aria-label="Selecionar visão de repasses">
          <Button variant="secondary" size="sm" className="h-8" aria-current="page">
            Total PDDE Básico
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/repasses">1ª parcela</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="h-8">
            <Link to="/repasses?ciclo=2">2º ciclo de repasses</Link>
          </Button>
        </div>

        {repassesQuery.isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        ) : repassesQuery.isError ? (
          <EmptyState
            icon={WalletCards}
            title="Não foi possível carregar os repasses"
            description={repassesQuery.error.message}
            action={<Button onClick={() => repassesQuery.refetch()}>Tentar novamente</Button>}
          />
        ) : overview.escolas.length === 0 ? (
          <EmptyState
            icon={WalletCards}
            title={`Não há dados do PDDE Básico disponíveis para ${exercicio}`}
            description="A ausência de informação permanece como ausência e não é convertida em zero."
          />
        ) : (
          <>
            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-ds-sm">
              <CardContent className="grid p-0 md:grid-cols-4">
                <div className="p-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Total PDDE Básico
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-foreground">
                    {formatMoney(overview.totalInformado)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">1ª parcela + 2º ciclo de repasses</p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    1ª parcela
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {formatMoney(overview.totalPrimeiraParcela)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Pagamentos publicados</p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    2º ciclo de repasses
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {formatMoney(overview.totalSegundoCiclo)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Valor informado oficialmente</p>
                </div>
                <div className="border-t border-border/60 p-5 md:border-l md:border-t-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Unidades
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                    {overview.escolas.length}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">Com ao menos uma parcela registrada</p>
                </div>
              </CardContent>
            </Card>

            <Card className="overflow-hidden border-border/60 bg-card/80 shadow-ds-sm">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Sigma className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h2 className="text-sm font-semibold text-foreground">Total recebido/informado por unidade</h2>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filtered.length} de {overview.escolas.length} unidades no recorte
                    </p>
                  </div>

                  <div className="relative min-w-[240px] sm:w-80">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Buscar unidade ou INEP"
                      className="h-9 pl-9"
                      aria-label="Buscar unidade escolar no total do PDDE Básico"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full min-w-[980px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border/60 bg-muted/20 text-xs font-semibold text-muted-foreground">
                        <th className="px-4 py-3">Unidade escolar</th>
                        <th className="px-4 py-3 text-right">1ª parcela</th>
                        <th className="px-4 py-3 text-right">2º ciclo de repasses</th>
                        <th className="px-4 py-3 text-right">Total PDDE Básico</th>
                        <th className="px-4 py-3">Situação do 2º ciclo de repasses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((school) => (
                        <tr key={school.unidadeId} className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/15">
                          <td className="px-4 py-3">
                            <Link
                              to={`/escolas/${school.unidadeId}/recursos?return=${encodeURIComponent("/repasses?visao=basico")}`}
                              viewTransition
                              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
                            >
                              {school.designacao}
                            </Link>
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {school.inep ? `INEP ${school.inep}` : "INEP —"}
                            </p>
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                            {formatMoney(school.primeiraParcela)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium tabular-nums text-foreground">
                            {formatMoney(school.segundoCiclo)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="inline-flex rounded-md bg-primary/[0.07] px-2 py-1 font-semibold tabular-nums text-primary">
                              {moneyFormatter.format(school.totalInformado)}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn(
                              "inline-flex rounded-md border px-2 py-1 text-[11px] font-medium",
                              school.segundaSituacao === "credito-confirmado"
                                ? "border-success/25 bg-success/[0.06] text-success"
                                : school.segundaSituacao === "ordem-emitida"
                                  ? "border-warning/25 bg-warning/[0.06] text-warning"
                                  : school.segundaSituacao === "pagamento-informado"
                                    ? "border-primary/25 bg-primary/[0.06] text-primary"
                                    : "border-border bg-muted/30 text-muted-foreground",
                            )}>
                              {statusLabel(school.segundaSituacao)}
                            </span>
                          </td>
                        </tr>
                      ))}
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
