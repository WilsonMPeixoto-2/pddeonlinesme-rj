import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowRight, CircleDollarSign, Layers3 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type {
  ProgramaFinanceiroOverview,
  SegundaParcelaOverview,
} from "@/lib/financeiroPDDE";

const currency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const compactCurrency = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const chartTooltipStyle = {
  border: "1px solid hsl(var(--border))",
  borderRadius: "10px",
  background: "hsl(var(--popover) / 0.98)",
  color: "hsl(var(--popover-foreground))",
  boxShadow: "var(--shadow-lg)",
  fontSize: "12px",
};

function shortProgramName(program: string) {
  return program.replace(/^PDDE\s+/i, "");
}

export function FinancialPortfolioChart({
  programs,
  onExplore,
}: {
  programs: ProgramaFinanceiroOverview[];
  onExplore: () => void;
}) {
  const data = programs.map((program) => ({
    name: shortProgramName(program.programa),
    programado: program.totalProgramado,
    pago: program.totalPago,
    escolas: program.escolas,
  }));

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-card/80 shadow-ds-sm">
      <CardContent className="p-0">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
                <CircleDollarSign className="h-4 w-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-foreground">Carteira por programa</p>
                <p className="text-[11px] text-muted-foreground">Programado × pagamento identificado</p>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onExplore} className="h-8 text-xs">
            Explorar
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>

        <div className="h-[286px] px-2 pb-3 pt-5 sm:px-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 18, left: 4, bottom: 4 }}
              barCategoryGap="32%"
            >
              <CartesianGrid
                stroke="hsl(var(--border) / 0.55)"
                strokeDasharray="3 6"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(value) => compactCurrency.format(Number(value))}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={82}
                axisLine={false}
                tickLine={false}
                tick={{ fill: "hsl(var(--foreground))", fontSize: 11, fontWeight: 600 }}
              />
              <Tooltip
                cursor={{ fill: "hsl(var(--muted) / 0.22)" }}
                contentStyle={chartTooltipStyle}
                formatter={(value, name) => [
                  value == null ? "—" : currency.format(Number(value)),
                  name === "programado" ? "Programado" : "Pagamento identificado",
                ]}
                labelFormatter={(label) => `PDDE ${label}`}
              />
              <Bar
                dataKey="programado"
                name="programado"
                fill="hsl(var(--muted-foreground) / 0.24)"
                radius={[0, 5, 5, 0]}
                maxBarSize={16}
              />
              <Bar
                dataKey="pago"
                name="pago"
                fill="hsl(var(--primary))"
                radius={[0, 5, 5, 0]}
                maxBarSize={16}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/50 px-5 py-3 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/25" />
            Programado
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-sm bg-primary" />
            Pagamento identificado
          </span>
          <span className="ml-auto hidden sm:inline">
            Ausência de dado permanece sem valor.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export function SecondCycleEvidenceChart({
  overview,
  onExplore,
}: {
  overview: SegundaParcelaOverview;
  onExplore: () => void;
}) {
  const counts = overview.escolas.reduce(
    (acc, school) => {
      acc[school.status] += 1;
      return acc;
    },
    {
      "pagamento-informado": 0,
      "ordem-emitida": 0,
      "credito-confirmado": 0,
    },
  );

  const data = [
    {
      key: "pagamento-informado",
      label: "Pagamento informado",
      value: counts["pagamento-informado"],
      fill: "hsl(var(--primary))",
    },
    {
      key: "ordem-emitida",
      label: "Ordem emitida",
      value: counts["ordem-emitida"],
      fill: "hsl(var(--warning))",
    },
    {
      key: "credito-confirmado",
      label: "Crédito confirmado",
      value: counts["credito-confirmado"],
      fill: "hsl(var(--success))",
    },
  ].filter((item) => item.value > 0);

  const coverage = overview.escolasEsperadas > 0
    ? (overview.escolas.length / overview.escolasEsperadas) * 100
    : 0;

  return (
    <Card className="h-full overflow-hidden border-border/60 bg-card/80 shadow-ds-sm">
      <CardContent className="p-0">
        <div className="flex items-start justify-between gap-3 border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300">
              <Layers3 className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-semibold text-foreground">Evidências do 2º ciclo de repasses</p>
              <p className="text-[11px] text-muted-foreground">Situação mais avançada por unidade</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onExplore} className="h-8 px-2 text-xs">
            Detalhar
          </Button>
        </div>

        <div className="grid min-h-[286px] grid-cols-[148px_1fr] items-center gap-1 px-4 py-4 sm:grid-cols-[168px_1fr]">
          <div className="relative h-[168px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={72}
                  paddingAngle={3}
                  stroke="hsl(var(--card))"
                  strokeWidth={3}
                >
                  {data.map((item) => (
                    <Cell key={item.key} fill={item.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name) => [`${value} unidade(s)`, name]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <strong className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {overview.escolas.length}
              </strong>
              <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
                de {overview.escolasEsperadas}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-3">
                <span className="inline-flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: item.fill }} />
                  <span className="truncate">{item.label}</span>
                </span>
                <strong className="text-sm font-semibold tabular-nums text-foreground">{item.value}</strong>
              </div>
            ))}

            <div className="border-t border-border/50 pt-3">
              <div className="flex items-center justify-between gap-3 text-[11px]">
                <span className="text-muted-foreground">Cobertura da carteira</span>
                <strong className="font-semibold tabular-nums text-foreground">{coverage.toFixed(coverage >= 99.95 ? 0 : 1)}%</strong>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted/70">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, coverage)}%` }} />
              </div>
            </div>

            <p className="text-[10px] leading-4 text-muted-foreground">
              Pagamento, ordem e crédito bancário são evidências distintas. O gráfico usa o estágio mais avançado conhecido por unidade.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
