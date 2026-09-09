import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  type ColumnDef,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Building2,
  CalendarDays,
  Download,
  Search,
  SlidersHorizontal,
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
  buildPrimeiraParcelaOverview,
  isSchoolInBand,
  type EscolaPrimeiraParcela,
  type ValueBandOverview,
} from "@/lib/financeiroPDDE";
import { repassesFinanceirosOptions } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const repassesTableFeatures = tableFeatures({
  sorting: rowSortingFeature,
});

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

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  style: "percent",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function escapeCsv(value: string | number | null) {
  if (value === null) return "";
  const text = String(value).replaceAll('"', '""');
  return `"${text}"`;
}

function Kpi({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="border-l border-border/70 pl-4 first:border-l-0 first:pl-0">
      <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tabular-nums tracking-tight text-foreground sm:text-2xl">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function FilterBar({
  label,
  valueLabel,
  percentage,
  active,
  onClick,
}: {
  label: string;
  valueLabel: string;
  percentage: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "group w-full rounded-lg border px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active
          ? "border-primary/40 bg-primary/8"
          : "border-border/50 bg-background/40 hover:border-border hover:bg-muted/20",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-sm font-medium text-foreground">{label}</span>
        <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{valueLabel}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
        <div
          className={cn(
            "h-full rounded-full transition-[width]",
            active ? "bg-primary" : "bg-primary/45 group-hover:bg-primary/60",
          )}
          style={{ width: `${Math.max(2, Math.min(100, percentage * 100))}%` }}
        />
      </div>
    </button>
  );
}

function SortHeader({
  label,
  sorted,
  onClick,
}: {
  label: string;
  sorted: false | "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-left text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
    >
      {label}
      {sorted === "asc" ? (
        <ArrowDownAZ className="h-3.5 w-3.5" aria-hidden="true" />
      ) : sorted === "desc" ? (
        <ArrowUpAZ className="h-3.5 w-3.5" aria-hidden="true" />
      ) : null}
    </button>
  );
}

export default function Repasses() {
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);
  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const [search, setSearch] = useState("");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);
  const [selectedBandId, setSelectedBandId] = useState<ValueBandOverview["id"] | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const overview = useMemo(
    () => buildPrimeiraParcelaOverview(repassesQuery.data ?? [], exercicioNumero),
    [repassesQuery.data, exercicioNumero],
  );

  const selectedBand = useMemo(
    () => overview.faixas.find((band) => band.id === selectedBandId) ?? null,
    [overview.faixas, selectedBandId],
  );

  const filteredSchools = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("pt-BR");
    return overview.escolas.filter((school) => {
      if (selectedAction && school.acao !== selectedAction) return false;
      if (selectedBand && !isSchoolInBand(school.valorPago, selectedBand)) return false;
      if (selectedDate && school.dataPagamento !== selectedDate) return false;
      if (!term) return true;
      return [school.designacao, school.nome, school.inep ?? ""]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(term);
    });
  }, [overview.escolas, search, selectedAction, selectedBand, selectedDate]);

  const maxValue = overview.escolas[0]?.valorPago ?? 1;
  const hasFilters = Boolean(search.trim() || selectedAction || selectedBand || selectedDate);

  const columns = useMemo<ColumnDef<typeof repassesTableFeatures, EscolaPrimeiraParcela>[]>(
    () => [
      {
        accessorKey: "designacao",
        header: ({ column }) => (
          <SortHeader
            label="Unidade escolar"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler()}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-[230px]">
            <Link
              to={`/escolas/${row.original.unidadeId}/recursos`}
              viewTransition
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              {row.original.designacao}
            </Link>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {row.original.inep ? `INEP ${row.original.inep}` : "INEP —"}
            </p>
          </div>
        ),
      },
      {
        accessorKey: "acao",
        header: "Ação",
        cell: ({ row }) => <span className="text-sm text-foreground">{row.original.acao}</span>,
      },
      {
        accessorKey: "dataPagamento",
        header: ({ column }) => (
          <SortHeader
            label="Pagamento"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler()}
          />
        ),
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
            {formatDate(row.original.dataPagamento)}
          </span>
        ),
      },
      {
        accessorKey: "valorPago",
        header: ({ column }) => (
          <SortHeader
            label="Valor pago"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler()}
          />
        ),
        cell: ({ row }) => (
          <div className="min-w-[155px]">
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium tabular-nums text-foreground">
                {moneyFormatter.format(row.original.valorPago)}
              </span>
            </div>
            <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted/70">
              <div
                className="h-full rounded-full bg-primary/55"
                style={{ width: `${Math.max(3, (row.original.valorPago / maxValue) * 100)}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        accessorKey: "participacao",
        header: ({ column }) => (
          <SortHeader
            label="Participação"
            sorted={column.getIsSorted()}
            onClick={column.getToggleSortingHandler()}
          />
        ),
        cell: ({ row }) => (
          <span className="text-sm tabular-nums text-muted-foreground">
            {percentFormatter.format(row.original.participacao)}
          </span>
        ),
      },
    ],
    [maxValue],
  );

  const table = useTable({
    features: repassesTableFeatures,
    data: filteredSchools,
    columns,
    getRowId: (row) => row.unidadeId,
    initialState: {
      sorting: {
        sortBy: [{ id: "valorPago", desc: true }],
      },
    },
    getSortedRowModel: createSortedRowModel(),
  });

  const clearFilters = () => {
    setSearch("");
    setSelectedAction(null);
    setSelectedBandId(null);
    setSelectedDate(null);
  };

  const exportFiltered = () => {
    const header = ["Unidade escolar", "INEP", "Ação", "Data de pagamento", "Valor pago", "Participação"];
    const lines = filteredSchools.map((school) =>
      [
        school.designacao,
        school.inep,
        school.acao,
        school.dataPagamento,
        school.valorPago.toFixed(2).replace(".", ","),
        (school.participacao * 100).toFixed(2).replace(".", ","),
      ]
        .map(escapeCsv)
        .join(";"),
    );
    const csv = `\uFEFF${header.map(escapeCsv).join(";")}\n${lines.join("\n")}`;
    saveAs(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
      `pdde-repasses-primeira-parcela-${exercicio}-${filteredSchools.length}-escolas.csv`,
    );
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
              1ª parcela do PDDE Básico
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              Valores efetivamente pagos às unidades no recorte disponível e completo para o exercício selecionado.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={exportFiltered}
            disabled={filteredSchools.length === 0}
          >
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            Exportar {hasFilters ? "resultado" : "lista"}
          </Button>
        </header>

        {repassesQuery.isLoading ? (
          <div className="space-y-5">
            <Skeleton className="h-28 w-full" />
            <div className="grid gap-4 lg:grid-cols-2">
              <Skeleton className="h-64 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
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
            title={`Não há pagamentos publicados neste recorte para ${exercicio}`}
            description="Nenhum valor é presumido como zero quando a informação de pagamento não está disponível."
          />
        ) : (
          <>
            <Card className="shadow-sm">
              <CardContent className="grid gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <Kpi
                  label="Pago"
                  value={moneyFormatter.format(overview.totalPago)}
                  detail="Total da 1ª parcela/P1"
                />
                <Kpi
                  label="Unidades"
                  value={String(overview.escolas.length)}
                  detail="Escolas com pagamento informado"
                />
                <Kpi
                  label="Mediana"
                  value={moneyFormatter.format(overview.mediana)}
                  detail="Ponto central da distribuição"
                />
                <Kpi
                  label="Média"
                  value={moneyFormatter.format(overview.media)}
                  detail="Valor médio por unidade"
                />
              </CardContent>
            </Card>

            <div className="grid gap-4 xl:grid-cols-[0.95fr_0.95fr_1.35fr]">
              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Por ação</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Selecione uma barra para filtrar as escolas.</p>
                  </div>
                  <div className="space-y-2">
                    {overview.porAcao.map((item) => (
                      <FilterBar
                        key={item.acao}
                        label={item.acao}
                        valueLabel={`${item.escolas} escolas · ${compactMoneyFormatter.format(item.total)}`}
                        percentage={item.participacao}
                        active={selectedAction === item.acao}
                        onClick={() => setSelectedAction((current) => (current === item.acao ? null : item.acao))}
                      />
                    ))}
                  </div>
                  {overview.insightAcao ? (
                    <p className="mt-4 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
                      {overview.insightAcao}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-4">
                    <h2 className="text-sm font-semibold text-foreground">Faixa de valor</h2>
                    <p className="mt-1 text-xs text-muted-foreground">Use a distribuição como filtro operacional.</p>
                  </div>
                  <div className="space-y-2">
                    {overview.faixas.map((band) => (
                      <FilterBar
                        key={band.id}
                        label={band.label}
                        valueLabel={`${band.escolas} escolas`}
                        percentage={band.escolas / overview.escolas.length}
                        active={selectedBandId === band.id}
                        onClick={() => setSelectedBandId((current) => (current === band.id ? null : band.id))}
                      />
                    ))}
                  </div>
                  {overview.insightFaixa ? (
                    <p className="mt-4 border-t border-border/50 pt-3 text-xs leading-relaxed text-muted-foreground">
                      {overview.insightFaixa}
                    </p>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardContent className="p-5">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-sm font-semibold text-foreground">Ritmo dos pagamentos</h2>
                      <p className="mt-1 text-xs text-muted-foreground">Valor acumulado pelas datas informadas.</p>
                    </div>
                    <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  </div>
                  <div className="h-40 w-full text-primary" aria-label="Gráfico do valor acumulado por data">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={overview.porData} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                        <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.08} />
                        <XAxis
                          dataKey="data"
                          tickFormatter={(value) => formatDate(String(value)).slice(0, 5)}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tickFormatter={(value) => compactMoneyFormatter.format(Number(value))}
                          tick={{ fontSize: 10 }}
                          axisLine={false}
                          tickLine={false}
                          width={56}
                        />
                        <Tooltip
                          formatter={(value) => [moneyFormatter.format(Number(value)), "Acumulado"]}
                          labelFormatter={(label) => formatDate(String(label))}
                        />
                        <Area
                          type="monotone"
                          dataKey="acumulado"
                          stroke="currentColor"
                          fill="currentColor"
                          fillOpacity={0.12}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {overview.porData.map((item) => (
                      <button
                        key={item.data}
                        type="button"
                        onClick={() => setSelectedDate((current) => (current === item.data ? null : item.data))}
                        aria-pressed={selectedDate === item.data}
                        className={cn(
                          "rounded-md border px-2 py-1 text-[11px] tabular-nums transition-colors",
                          selectedDate === item.data
                            ? "border-primary/40 bg-primary/10 text-primary"
                            : "border-border/50 text-muted-foreground hover:bg-muted/30 hover:text-foreground",
                        )}
                      >
                        {formatDate(item.data)} · {item.escolas}
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="overflow-hidden shadow-sm">
              <CardContent className="p-0">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary" aria-hidden="true" />
                      <h2 className="text-sm font-semibold text-foreground">Unidades escolares</h2>
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
                    {hasFilters ? (
                      <Button size="sm" variant="ghost" onClick={clearFilters}>
                        <X className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                        Limpar filtros
                      </Button>
                    ) : (
                      <div className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex">
                        <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
                        Gráficos também filtram a lista
                      </div>
                    )}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      {table.getHeaderGroups().map((headerGroup) => (
                        <tr key={headerGroup.id} className="border-b border-border/60 bg-muted/20">
                          {headerGroup.headers.map((header) => (
                            <th key={header.id} className="px-4 py-3 align-middle text-xs font-semibold text-muted-foreground">
                              {header.isPlaceholder
                                ? null
                                : <table.FlexRender header={header} />}
                            </th>
                          ))}
                        </tr>
                      ))}
                    </thead>
                    <tbody>
                      {table.getRowModel().rows.length > 0 ? (
                        table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="border-b border-border/40 transition-colors last:border-b-0 hover:bg-muted/15">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3 align-middle text-sm">
                                {<table.FlexRender cell={cell} />}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-muted-foreground">
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
