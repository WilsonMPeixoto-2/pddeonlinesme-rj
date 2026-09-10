import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Inbox,
  Landmark,
  Receipt,
  School,
  WalletCards,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { CentralDocumental } from "@/components/CentralDocumental";
import { HistoricoGeracoesCard } from "@/components/HistoricoGeracoesCard";
import { NumberTicker } from "@/components/NumberTicker";
import { TiltCard } from "@/components/TiltCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardUnidadesResumo } from "@/hooks/useDashboardUnidadesResumo";
import { useExercicio } from "@/hooks/useExercicio";
import {
  buildDashboardFinanceiroOverview,
  type ProgramaFinanceiroOverview,
} from "@/lib/financeiroPDDE";
import {
  contasFinanceirasOptions,
  repassesFinanceirosOptions,
} from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const fmtBRL = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });

const fmtBRLDecimal = (value: number) =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatMoneyOrDash(value: number | null) {
  return value === null ? "—" : fmtBRL(value);
}

type Tone = "primary" | "violet" | "teal" | "muted";

const toneRing: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
  violet: "bg-violet-500/10 text-violet-700 ring-1 ring-violet-500/20 dark:text-violet-300",
  teal: "bg-teal-500/10 text-teal-700 ring-1 ring-teal-500/20 dark:text-teal-300",
  muted: "bg-muted text-muted-foreground ring-1 ring-border/50",
};

const PROGRAM_STYLE: Record<
  string,
  { dot: string; text: string; border: string; surface: string; chart: string }
> = {
  "PDDE BÁSICO": {
    dot: "bg-primary",
    text: "text-primary",
    border: "border-primary/25",
    surface: "bg-primary/[0.035]",
    chart: "hsl(var(--primary))",
  },
  "PDDE QUALIDADE": {
    dot: "bg-violet-500",
    text: "text-violet-700 dark:text-violet-300",
    border: "border-violet-500/25",
    surface: "bg-violet-500/[0.035]",
    chart: "rgb(139 92 246)",
  },
  "PDDE EQUIDADE": {
    dot: "bg-teal-600",
    text: "text-teal-700 dark:text-teal-300",
    border: "border-teal-600/25",
    surface: "bg-teal-600/[0.035]",
    chart: "rgb(13 148 136)",
  },
};

function ProgramCard({ program }: { program: ProgramaFinanceiroOverview }) {
  const style = PROGRAM_STYLE[program.programa] ?? {
    dot: "bg-muted-foreground",
    text: "text-foreground",
    border: "border-border",
    surface: "bg-muted/20",
    chart: "hsl(var(--muted-foreground))",
  };

  return (
    <Card className={cn("overflow-hidden border", style.border, style.surface)}>
      <CardContent className="p-5">
        <div className="flex items-center gap-2">
          <span className={cn("h-2.5 w-2.5 rounded-full", style.dot)} aria-hidden="true" />
          <p className={cn("text-sm font-semibold tracking-wide", style.text)}>{program.programa}</p>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-4">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Programado
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {formatMoneyOrDash(program.totalProgramado)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Pagamento identificado
            </p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">
              {formatMoneyOrDash(program.totalPago)}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Contas</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">{program.contas}</p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Ações</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-foreground">
              {program.acoes > 0 ? program.acoes : "—"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);

  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const contasQuery = useQuery(contasFinanceirasOptions(exercicioNumero));
  const {
    data: resumoUnidades,
    isLoading: loadingResumo,
    error: errorResumo,
  } = useDashboardUnidadesResumo();

  const overview = useMemo(
    () => buildDashboardFinanceiroOverview(
      repassesQuery.data ?? [],
      contasQuery.data ?? [],
      exercicioNumero,
    ),
    [contasQuery.data, exercicioNumero, repassesQuery.data],
  );

  const loading = repassesQuery.isLoading || contasQuery.isLoading || loadingResumo;
  const queryError = repassesQuery.error ?? contasQuery.error ?? errorResumo;
  const recentes = resumoUnidades?.recentes ?? [];
  const cadastroIncompletoCount = resumoUnidades?.cadastroIncompletoCount ?? 0;
  const totalUnidades = overview.totalEscolas > 0
    ? overview.totalEscolas
    : (resumoUnidades?.total ?? null);
  const composicaoDisponivel = overview.primeiraParcela.custeioPago !== null
    && overview.primeiraParcela.capitalPago !== null;
  const totalComposicao = composicaoDisponivel
    ? (overview.primeiraParcela.custeioPago ?? 0) + (overview.primeiraParcela.capitalPago ?? 0)
    : null;
  const custeioPercentual = totalComposicao && totalComposicao > 0
    ? ((overview.primeiraParcela.custeioPago ?? 0) / totalComposicao) * 100
    : 0;
  const capitalPercentual = totalComposicao && totalComposicao > 0
    ? ((overview.primeiraParcela.capitalPago ?? 0) / totalComposicao) * 100
    : 0;

  const stats: Array<{
    label: string;
    value: number | null;
    icon: typeof School;
    hint: string;
    tone: Tone;
    format?: (value: number) => string;
    destination: string;
  }> = [
    {
      label: "Unidades escolares",
      value: totalUnidades,
      icon: School,
      hint: "Carteira da 4ª CRE no recorte financeiro",
      tone: "primary",
      destination: "/escolas",
    },
    {
      label: "Repasse · 1ª parcela",
      value: overview.primeiraParcela.totalPago,
      icon: Receipt,
      hint: `${overview.primeiraParcela.escolas} escolas com pagamento identificado`,
      tone: "primary",
      format: fmtBRL,
      destination: "/repasses",
    },
    {
      label: "Custeio · 1ª parcela",
      value: overview.primeiraParcela.custeioPago,
      icon: Coins,
      hint: overview.primeiraParcela.detalhamentoCompleto > 0
        ? `${overview.primeiraParcela.detalhamentoCompleto}/${overview.primeiraParcela.escolas} repasses com composição completa`
        : "Detalhamento ainda não informado",
      tone: "violet",
      format: fmtBRL,
      destination: "/repasses",
    },
    {
      label: "Capital · 1ª parcela",
      value: overview.primeiraParcela.capitalPago,
      icon: Landmark,
      hint: "Componente de capital do mesmo recorte",
      tone: "teal",
      format: fmtBRL,
      destination: "/repasses",
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };

  const item = {
    hidden: { opacity: 0, y: 14 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  if (queryError && !loading) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Erro ao carregar o Painel</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Não foi possível consultar os dados financeiros e cadastrais no Supabase.
            </p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-card/80 via-card/60 to-card/40 px-6 py-10 backdrop-blur-sm sm:px-10 sm:py-14"
        >
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-violet-500/8 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[1.35fr_1fr] lg:items-end">
            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary" aria-hidden="true" />
                <p className="ds-eyebrow">
                  Painel Executivo-Operacional · GAD · 4ª CRE · Exercício {exercicio}
                </p>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-muted-foreground">
                  1ª parcela paga · PDDE Básico · {exercicio}
                </p>
                <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  {loading ? (
                    <Skeleton className="h-16 w-[80%]" />
                  ) : overview.primeiraParcela.totalPago !== null ? (
                    <NumberTicker
                      value={overview.primeiraParcela.totalPago}
                      format={fmtBRLDecimal}
                      className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent tabular-nums"
                    />
                  ) : (
                    <span className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">—</span>
                  )}
                </h1>
                <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-muted-foreground">
                  Pagamento identificado para {overview.primeiraParcela.escolas} de {totalUnidades ?? "—"} unidades escolares no recorte exibido.
                  {overview.primeiraParcela.ultimaDataPagamento
                    ? ` Última data de pagamento deste recorte: ${formatDate(overview.primeiraParcela.ultimaDataPagamento)}.`
                    : ""}
                </p>
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <Button onClick={() => navigate("/repasses", { viewTransition: true })}>
                  Explorar repasses
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="outline" onClick={() => navigate("/escolas", { viewTransition: true })}>
                  Ver unidades escolares
                </Button>
              </div>
            </div>

            <div className="ds-card-elevated space-y-5 p-5 backdrop-blur-md">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="ds-eyebrow">Composição da 1ª parcela</p>
                  <p className="mt-1 text-xs text-muted-foreground">Custeio e capital no mesmo recorte do destaque principal.</p>
                </div>
                <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                  {overview.primeiraParcela.detalhamentoCompleto}/{overview.primeiraParcela.escolas} completos
                </span>
              </div>

              {composicaoDisponivel && totalComposicao !== null && totalComposicao > 0 ? (
                <div className="space-y-5">
                  <div
                    className="flex h-3 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`Composição da primeira parcela: ${custeioPercentual.toFixed(1)}% custeio e ${capitalPercentual.toFixed(1)}% capital`}
                  >
                    <div className="h-full bg-fin-custeio" style={{ width: `${custeioPercentual}%` }} />
                    <div className="h-full bg-fin-capital" style={{ width: `${capitalPercentual}%` }} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl border border-border/60 bg-card/55 p-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-fin-custeio" aria-hidden="true" />
                        <p className="text-xs font-medium text-muted-foreground">Custeio</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                        {formatMoneyOrDash(overview.primeiraParcela.custeioPago)}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                        {custeioPercentual.toFixed(1)}% do total
                      </p>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card/55 p-4">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-fin-capital" aria-hidden="true" />
                        <p className="text-xs font-medium text-muted-foreground">Capital</p>
                      </div>
                      <p className="mt-2 text-lg font-semibold tabular-nums text-foreground">
                        {formatMoneyOrDash(overview.primeiraParcela.capitalPago)}
                      </p>
                      <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                        {capitalPercentual.toFixed(1)}% do total
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 border-t border-border/50 pt-4">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Cobertura do detalhamento</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Somente valores conhecidos; ausência de dado não é convertida em zero.
                      </p>
                    </div>
                    <span className="text-sm font-semibold tabular-nums text-foreground">
                      {formatMoneyOrDash(totalComposicao)}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border bg-muted/20 p-5">
                  <p className="text-sm font-medium text-foreground">Composição ainda não disponível para todo o recorte</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    O Painel preserva a ausência de informação em vez de inferir custeio ou capital como zero.
                  </p>
                </div>
              )}
            </div>
          </div>
        </motion.section>

        <CentralDocumental />

        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
        >
          {stats.map((stat) => {
            const Icon = stat.icon;
            const isReady = stat.value !== null && stat.value !== undefined;
            return (
              <motion.div key={stat.label} variants={item} className="@container">
                <button
                  type="button"
                  onClick={() => navigate(stat.destination, { viewTransition: true })}
                  className="block h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label={`${stat.label}: ${isReady ? stat.format?.(stat.value as number) ?? stat.value : "sem dado"}. Ver detalhamento`}
                >
                  <TiltCard className="h-full">
                    <Card className="ds-card-interactive ds-lift ds-glow-card group relative h-full transform-3d">
                      <CardContent className="flex h-full flex-col gap-4 p-5 transform-3d @xs:gap-5">
                        <div className="flex items-start justify-between gap-3 transform-3d">
                          <p className="ds-label [transform:translateZ(12px)]">{stat.label}</p>
                          <div
                            className={cn(
                              "flex h-8 w-8 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 [transform:translateZ(24px)]",
                              toneRing[stat.tone],
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden="true" />
                          </div>
                        </div>
                        <div className="transform-3d">
                          {loading ? (
                            <Skeleton className="h-9 w-24 animate-pulse [transform:translateZ(16px)]" />
                          ) : !isReady ? (
                            <p className="ds-h1 ds-num [transform:translateZ(16px)]">—</p>
                          ) : (
                            <p className="ds-h1 ds-num tracking-tight text-foreground [transform:translateZ(18px)]">
                              <NumberTicker
                                value={stat.value as number}
                                format={stat.format ?? ((n) => Math.round(n).toLocaleString("pt-BR"))}
                              />
                            </p>
                          )}
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <p className="text-[10px] leading-normal text-muted-foreground [transform:translateZ(10px)]">
                              {stat.hint}
                            </p>
                            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-primary" aria-hidden="true" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TiltCard>
                </button>
              </motion.div>
            );
          })}
        </motion.div>

        <section className="space-y-4" aria-labelledby="programas-pdde-title">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="ds-eyebrow">Carteira financeira</p>
              <h2 id="programas-pdde-title" className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                Programas e recursos
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Valores programados, pagamentos identificados e contas por programa.
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate("/repasses", { viewTransition: true })}>
              Explorar os repasses
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-44 w-full rounded-xl" />)
              : overview.porPrograma.map((program) => <ProgramCard key={program.programa} program={program} />)}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="ds-card lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="ds-h3">Atualizadas recentemente</h2>
                  <p className="text-xs text-muted-foreground">Últimas modificações no cadastro das unidades.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/escolas", { viewTransition: true })} className="text-xs">
                  Ver todas
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>

              {loading ? (
                <ul className="divide-y divide-border/60">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <li key={index} className="flex items-center justify-between py-3">
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
                  <p className="text-xs text-muted-foreground">Cadastre uma unidade para iniciar o acompanhamento.</p>
                </div>
              ) : (
                <motion.ul variants={container} initial="hidden" animate="show" className="divide-y divide-border/60">
                  {recentes.map((row) => (
                    <motion.li key={row.id} variants={item} className="group flex items-center justify-between gap-4 py-3 first:pt-1 last:pb-1">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 transition-all group-hover:bg-primary" />
                        <span className="truncate text-sm font-medium">{row.designacao}</span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {row.updated_at ? (
                          <span className="hidden text-[11px] tabular-nums text-muted-foreground/70 xl:inline">
                            {new Date(row.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                          </span>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => navigate(`/escolas/${row.id}`, { viewTransition: true })}
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

          <div className="space-y-4">
            <HistoricoGeracoesCard />
            <Card className="ds-card">
              <CardContent className="space-y-4 p-5">
                <div>
                  <h2 className="ds-h3">Atenção operacional</h2>
                  <p className="text-xs text-muted-foreground">Dados cadastrais que exigem revisão.</p>
                </div>
                {cadastroIncompletoCount > 0 ? (
                  <div className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">
                        {cadastroIncompletoCount} cadastro{cadastroIncompletoCount === 1 ? "" : "s"} incompleto{cadastroIncompletoCount === 1 ? "" : "s"}
                      </p>
                      <p className="text-[11px] text-muted-foreground">Unidades sem CNPJ, INEP ou diretor(a).</p>
                    </div>
                  </div>
                ) : !loading ? (
                  <div className="flex items-start gap-3 rounded-lg border border-success/20 bg-success/5 p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Cadastros essenciais completos</p>
                      <p className="text-[11px] text-muted-foreground">Todas as unidades têm CNPJ, INEP e diretor(a) preenchidos.</p>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}