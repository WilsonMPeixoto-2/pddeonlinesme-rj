import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Coins,
  Inbox,
  Receipt,
  School,
  Wallet,
} from "lucide-react";
import { NumberTicker } from "@/components/NumberTicker";
import { TiltCard } from "@/components/TiltCard";
import { useDashboardBasico } from "@/hooks/useDashboardBasico";
import { useDashboardUnidadesResumo } from "@/hooks/useDashboardUnidadesResumo";
import { useExercicio } from "@/hooks/useExercicio";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

const PROGRAMA_PADRAO = "basico";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtBRLDecimal = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Retorna "—" quando não há dado (indicadores sem linha na view).
const fmtBRLOrDash = (n: number | null): string =>
  n !== null ? fmtBRL(n) : "—";

type Tone = "primary" | "success" | "warning" | "muted";
const toneRing: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
  success: "bg-success/10 text-success ring-1 ring-success/20",
  warning: "bg-warning/10 text-warning ring-1 ring-warning/20",
  muted: "bg-muted text-muted-foreground ring-1 ring-border/50",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { exercicio } = useExercicio();

  const {
    data: indicadores,
    isLoading: loadingBasico,
    error: errorBasico,
  } = useDashboardBasico({ exercicio, programa: PROGRAMA_PADRAO });

  const {
    data: resumoUnidades,
    isLoading: loadingResumo,
    error: errorResumo,
  } = useDashboardUnidadesResumo();

  const loading = loadingBasico || loadingResumo;
  const queryError = errorBasico ?? errorResumo;

  // Marco 9B: total_unidades vem da view de indicadores; resumoUnidades.total
  // funciona como fallback quando a view de dashboard ainda não retornou.
  const totalUnidades =
    indicadores?.total_unidades ?? resumoUnidades?.total ?? null;

  // Manter null quando indicadores não retornou linha (exercício sem dados em
  // execucao_financeira), para não exibir R$0,00 enganoso no Dashboard.
  const totalReprogramado = indicadores?.total_reprogramado ?? null;
  const totalParcelas = indicadores?.total_parcelas ?? null;
  const totalDisponivelInicial = indicadores?.total_disponivel_inicial ?? null;
  const reprogramadoCusteio = indicadores?.total_reprogramado_custeio ?? null;
  const reprogramadoCapital = indicadores?.total_reprogramado_capital ?? null;

  const cadastroIncompletoCount = resumoUnidades?.cadastroIncompletoCount ?? 0;
  const recentes = resumoUnidades?.recentes ?? [];

  // parcelasZeradas só faz sentido quando os indicadores foram carregados e a
  // view retornou uma linha (indicadores != null); zero significa valor real = 0.
  const parcelasZeradas = !loading && indicadores != null && totalParcelas === 0;

  const chartData = [
    { name: "Reprogramado Custeio", value: reprogramadoCusteio || 0, color: "hsl(var(--primary))" },
    { name: "Reprogramado Capital", value: reprogramadoCapital || 0, color: "hsl(var(--primary) / 0.5)" },
    { name: "Parcelas", value: totalParcelas || 0, color: "hsl(var(--success))" },
  ].filter((d) => d.value > 0);

  const stats: {
    label: string;
    value: number | null;
    icon: typeof School;
    hint: string;
    tone: Tone;
    format?: (n: number) => string;
  }[] = [
    {
      label: "Unidades escolares",
      value: totalUnidades,
      icon: School,
      hint: "Cadastradas na 4ª CRE",
      tone: "primary",
    },
    {
      label: "Total reprogramado",
      value: totalReprogramado,
      icon: Coins,
      hint: "Custeio + capital reprogramados",
      tone: "primary",
      format: fmtBRL,
    },
    {
      label: "Parcelas lançadas",
      value: totalParcelas,
      icon: Receipt,
      hint: parcelasZeradas
        ? "Nenhum valor lançado na BASE atual"
        : "1ª e 2ª parcelas do exercício",
      tone: parcelasZeradas ? "muted" : "primary",
      format: fmtBRL,
    },
    {
      label: "Disponível inicial",
      value: totalDisponivelInicial,
      icon: Wallet,
      hint: "Reprogramado + parcelas",
      tone: "success",
      format: fmtBRL,
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const item = {
    hidden: { opacity: 0, y: 14 },
    show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
  };

  if (queryError && !loading) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Erro ao carregar indicadores do Dashboard</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Não foi possível consultar os dados do Supabase. Verifique sua sessão, conexão ou permissões.
            </p>
            <Button onClick={() => window.location.reload()}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* HERO — manifesto institucional */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/60 to-card/40 px-6 py-10 backdrop-blur-sm sm:px-10 sm:py-14"
        >
          {/* Atmospheric glow */}
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-primary/8 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-end">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="ds-dot-success animate-pulse pulse-dot-success" />
                <p className="ds-eyebrow">
                  Painel operacional · Exercício {exercicio} · PDDE Básico
                </p>
              </div>

              <div>
                <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  {loading ? (
                    <Skeleton className="h-16 w-[80%]" />
                  ) : totalDisponivelInicial !== null ? (
                    <NumberTicker
                      value={totalDisponivelInicial}
                      format={fmtBRLDecimal}
                      className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent tabular-nums"
                    />
                  ) : (
                    <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                      —
                    </span>
                  )}
                </h1>
                <p className="mt-3 text-sm font-light tracking-wide text-muted-foreground sm:text-base">
                  Disponibilidade inicial identificada na BASE para{" "}
                  <span className="font-medium text-foreground">{totalUnidades ?? "—"}</span>{" "}
                  unidades escolares da 4ª Coordenadoria Regional de Educação.
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => navigate("/escolas")}>
                  Ver unidades escolares
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/base")}>
                  Importar BASE
                </Button>
              </div>
            </div>

            {/* Composição financeira com Recharts */}
            <div className="ds-card-elevated space-y-4 p-5 backdrop-blur-md">
              <p className="ds-eyebrow">
                Composição da disponibilidade
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-6">
                {/* Chart Area */}
                <div className="h-[120px] w-[120px] shrink-0 relative">
                  {!loading && chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={42}
                          outerRadius={55}
                          paddingAngle={3}
                          dataKey="value"
                          stroke="none"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          formatter={(value: number) => fmtBRL(value)}
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px"
                          }}
                          itemStyle={{ color: "hsl(var(--foreground))" }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-24 w-24 rounded-full border-4 border-muted/30" />
                    </div>
                  )}
                  {/* Central Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase text-muted-foreground font-medium tracking-widest">Total</span>
                  </div>
                </div>

                {/* Legend & Details Area */}
                <div className="flex-1 space-y-3 w-full">
                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">Reprogramado</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground ml-4">
                        Custeio {fmtBRLOrDash(reprogramadoCusteio)} · Capital {fmtBRLOrDash(reprogramadoCapital)}
                      </span>
                    </div>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {loading ? "—" : fmtBRLOrDash(totalReprogramado)}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-sm font-medium">Parcelas lançadas</span>
                      </div>
                      {parcelasZeradas && (
                        <span className="text-[10px] text-muted-foreground ml-4">
                          Sem valores na BASE atual
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-sm tabular-nums text-foreground">
                      {loading ? "—" : fmtBRLOrDash(totalParcelas)}
                    </span>
                  </div>

                  <div className="border-t border-border/40 pt-2 flex items-baseline justify-between gap-4">
                    <span className="text-sm font-semibold ml-4">Disponível inicial</span>
                    <span className="font-mono text-base font-semibold tabular-nums text-primary">
                      {loading ? "—" : fmtBRLOrDash(totalDisponivelInicial)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* STAT GRID — staggered */}
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((s) => {
            const Icon = s.icon;
            const isReady = s.value !== null && s.value !== undefined;
            return (
              <motion.div key={s.label} variants={item}>
                <TiltCard className="h-full">
                  <Card className="ds-card-interactive ds-lift group relative h-full overflow-hidden">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="ds-label">
                        {s.label}
                      </p>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 ${toneRing[s.tone]}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>

                    <div>
                      {loading ? (
                        <Skeleton className="h-9 w-24" />
                      ) : !isReady ? (
                        <p className="ds-h1 ds-num">
                          —
                        </p>
                      ) : (
                        <p className="ds-h1 ds-num text-foreground">
                          <NumberTicker
                            value={s.value as number}
                            format={s.format ?? ((n) => Math.round(n).toLocaleString("pt-BR"))}
                          />
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>
                    </div>
                  </CardContent>
                </Card>
                </TiltCard>
              </motion.div>
            );
          })}
        </motion.div>

        {/* RECENT ACTIVITY + ALERTS */}
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="ds-card lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="ds-h3">Atualizadas recentemente</h2>
                  <p className="text-xs text-muted-foreground">
                    Últimas modificações no cadastro das unidades.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/escolas")} className="text-xs">
                  Ver todas
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>

              {loading ? (
                <ul className="divide-y divide-border/60">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <li key={i} className="flex items-center justify-between py-3">
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-7 w-16" />
                    </li>
                  ))}
                </ul>
              ) : recentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Nenhuma unidade cadastrada ainda</p>
                  <p className="text-xs text-muted-foreground">
                    Importe a BASE ou cadastre uma unidade para começar.
                  </p>
                </div>
              ) : (
                <motion.ul
                  variants={container}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-border/60"
                >
                  {recentes.map((r) => (
                    <motion.li
                      key={r.id}
                      variants={item}
                      className="group flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 transition-all group-hover:bg-primary group-hover:shadow-[0_0_8px_hsl(var(--primary)/0.7)]" />
                        <span className="truncate text-sm font-medium">{r.designacao}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {r.updated_at && (
                          <span className="hidden text-[11px] tabular-nums text-muted-foreground/70 xl:inline">
                            {new Date(r.updated_at).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/escolas/${r.id}`)}
                        >
                          Abrir
                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </CardContent>
          </Card>

          <Card className="ds-card">
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="ds-h3">Atenção operacional</h2>
                <p className="text-xs text-muted-foreground">Indicadores que exigem revisão.</p>
              </div>

              <ul className="space-y-2">
                {/* Cadastros incompletos — dado real de vw_unidades_localizador */}
                {cadastroIncompletoCount > 0 ? (
                  <li className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {cadastroIncompletoCount} cadastro{cadastroIncompletoCount === 1 ? "" : "s"} incompleto{cadastroIncompletoCount === 1 ? "" : "s"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Unidades sem CNPJ, INEP ou diretor(a).
                      </p>
                    </div>
                  </li>
                ) : !loading ? (
                  <li className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Cadastros completos</p>
                      <p className="text-[11px] text-muted-foreground">
                        Todas as unidades têm CNPJ, INEP e diretor(a) preenchidos.
                      </p>
                    </div>
                  </li>
                ) : null}

                {/* Parcelas zeradas — informativo, não erro */}
                {parcelasZeradas && (
                  <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                    <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Parcelas zeradas</p>
                      <p className="text-[11px] text-muted-foreground">
                        As colunas de parcelas existem na BASE, mas não há valores lançados no arquivo atual.
                      </p>
                    </div>
                  </li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
