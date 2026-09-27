import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Database,
  Inbox,
  RefreshCw,
  School,
  WalletCards,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { CentralDocumental } from "@/components/CentralDocumental";
import { ExecutiveKpi } from "@/components/dashboard/ExecutiveKpi";
import {
  FinancialPortfolioChart,
  SecondCycleEvidenceChart,
} from "@/components/dashboard/FinancialAnalyticsCharts";
import { HistoricoGeracoesCard } from "@/components/HistoricoGeracoesCard";
import { SegundaParcelaResumo } from "@/components/SegundaParcelaResumo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardUnidadesResumo } from "@/hooks/useDashboardUnidadesResumo";
import { useExercicio } from "@/hooks/useExercicio";
import {
  buildDashboardFinanceiroOverview,
  buildRecentFinancialEvents,
  buildSegundaParcelaOverview,
} from "@/lib/financeiroPDDE";
import {
  contasFinanceirasOptions,
  financialFreshnessOptions,
  repassesFinanceirosOptions,
} from "@/lib/queryKeys";
import { cn } from "@/lib/utils";

const moneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const compactMoneyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" });
const dateTimeFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return dateFormatter.format(new Date(`${value}T00:00:00Z`));
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return dateTimeFormatter.format(new Date(value));
}

function formatMoney(value: number | null) {
  return value === null ? "—" : moneyFormatter.format(value);
}

function formatCompactMoney(value: number | null) {
  return value === null ? "—" : compactMoneyFormatter.format(value);
}

const freshnessVisual = {
  CURRENT: {
    label: "Dados sincronizados",
    dot: "bg-success",
    badge: "border-success/25 bg-success/[0.06] text-success",
  },
  PROPAGATING: {
    label: "Atualização em propagação",
    dot: "bg-warning",
    badge: "border-warning/25 bg-warning/[0.06] text-warning",
  },
  STORAGE_LAG: {
    label: "Persistência atrasada",
    dot: "bg-destructive",
    badge: "border-destructive/25 bg-destructive/[0.06] text-destructive",
  },
  SOURCE_STALE: {
    label: "Fonte desatualizada",
    dot: "bg-destructive",
    badge: "border-destructive/25 bg-destructive/[0.06] text-destructive",
  },
  SOURCE_UNAVAILABLE: {
    label: "Fonte indisponível",
    dot: "bg-destructive",
    badge: "border-destructive/25 bg-destructive/[0.06] text-destructive",
  },
} as const;

const eventVisual = {
  "credito-confirmado": {
    label: "Crédito confirmado",
    className: "border-success/25 bg-success/[0.06] text-success",
  },
  "pagamento-informado": {
    label: "Pagamento informado",
    className: "border-primary/25 bg-primary/[0.06] text-primary",
  },
  "ordem-emitida": {
    label: "Ordem emitida",
    className: "border-warning/25 bg-warning/[0.06] text-warning",
  },
} as const;

export default function Dashboard() {
  const navigate = useNavigate();
  const { exercicio } = useExercicio();
  const exercicioNumero = Number(exercicio);

  const repassesQuery = useQuery(repassesFinanceirosOptions(exercicioNumero));
  const contasQuery = useQuery(contasFinanceirasOptions(exercicioNumero));
  const freshnessQuery = useQuery(financialFreshnessOptions(exercicioNumero));
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

  const segundoCiclo = useMemo(
    () => buildSegundaParcelaOverview(repassesQuery.data ?? [], exercicioNumero),
    [exercicioNumero, repassesQuery.data],
  );

  const recentFinancialEvents = useMemo(
    () => buildRecentFinancialEvents(repassesQuery.data ?? [], exercicioNumero).slice(0, 6),
    [exercicioNumero, repassesQuery.data],
  );

  const loading = repassesQuery.isLoading || contasQuery.isLoading || loadingResumo;
  const refreshing = repassesQuery.isFetching || contasQuery.isFetching || freshnessQuery.isFetching;
  const queryError = repassesQuery.error ?? contasQuery.error ?? errorResumo;
  const recentes = resumoUnidades?.recentes ?? [];
  const cadastroIncompletoCount = resumoUnidades?.cadastroIncompletoCount ?? 0;
  const totalUnidades = overview.totalEscolas > 0
    ? overview.totalEscolas
    : (resumoUnidades?.total ?? null);

  const primeiraCobertura = totalUnidades && totalUnidades > 0
    ? (overview.primeiraParcela.escolas / totalUnidades) * 100
    : null;
  const segundaCobertura = segundoCiclo.escolasEsperadas > 0
    ? (segundoCiclo.escolas.length / segundoCiclo.escolasEsperadas) * 100
    : null;

  const freshness = exercicioNumero === 2026 ? freshnessQuery.data : null;
  const freshnessState = freshness ? freshnessVisual[freshness.status] : null;
  const lastUpdate = freshness?.storageRecordedAt ?? freshness?.enginePublishedAt ?? null;

  const refreshDashboard = async () => {
    await Promise.all([
      repassesQuery.refetch(),
      contasQuery.refetch(),
      freshnessQuery.refetch(),
    ]);
  };

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.03 } },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.34, ease: [0.22, 1, 0.36, 1] as const },
    },
  };

  if (queryError && !loading) {
    return (
      <AppLayout>
        <Card className="border-destructive/20">
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-semibold">Erro ao carregar o Painel</h2>
            <p className="max-w-md text-sm text-muted-foreground">
              Não foi possível consultar as fontes financeiras e cadastrais correntes.
            </p>
            <Button onClick={() => window.location.reload()}>Tentar novamente</Button>
          </CardContent>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout wide>
      <div className="space-y-5 pb-3">
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-2xl border border-border/60 bg-card/85 shadow-ds-sm backdrop-blur-sm"
        >
          <div className="relative px-5 py-5 sm:px-6">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary/[0.07] via-transparent to-violet-500/[0.05]" />

            <div className="relative flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="ds-eyebrow">Painel executivo-operacional · GAD · 4ª CRE</p>
                  {freshnessState ? (
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold",
                      freshnessState.badge,
                    )}>
                      <span className={cn("h-1.5 w-1.5 rounded-full", freshnessState.dot)} aria-hidden="true" />
                      {freshnessState.label}
                    </span>
                  ) : null}
                </div>

                <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
                  <h1 className="text-2xl font-semibold tracking-[-0.03em] text-foreground sm:text-3xl">
                    Visão financeira · {exercicio}
                  </h1>
                  {lastUpdate ? (
                    <p className="pb-0.5 text-[11px] tabular-nums text-muted-foreground">
                      Atualizado {formatDateTime(lastUpdate)}
                    </p>
                  ) : null}
                </div>

                <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                  Leitura rápida da carteira, cobertura dos pagamentos e evidências financeiras. Cada indicador leva ao recorte operacional correspondente.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => void refreshDashboard()}
                  disabled={refreshing}
                  className="h-9"
                >
                  <RefreshCw className={cn("mr-2 h-3.5 w-3.5", refreshing && "animate-spin")} aria-hidden="true" />
                  {refreshing ? "Atualizando" : "Atualizar agora"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/atualizacoes", { viewTransition: true })}
                  className="h-9"
                >
                  <Activity className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
                  Mudanças recentes
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate("/repasses", { viewTransition: true })}
                  className="h-9 shadow-ds-sm"
                >
                  Analisar repasses
                  <ArrowRight className="ml-2 h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid border-t border-border/50 bg-muted/[0.08] sm:grid-cols-3">
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3 sm:border-b-0 sm:border-r">
              <Database className="h-4 w-4 text-primary" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Fonte operacional</p>
                <p className="text-xs font-medium text-foreground">Motor financeiro + Supabase</p>
              </div>
            </div>
            <div className="flex items-center gap-3 border-b border-border/50 px-5 py-3 sm:border-b-0 sm:border-r">
              <WalletCards className="h-4 w-4 text-violet-600 dark:text-violet-300" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Registros financeiros</p>
                <p className="text-xs font-medium tabular-nums text-foreground">
                  {loading ? "Carregando…" : `${overview.totalRepasses} repasses · ${overview.totalContas} contas`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 px-5 py-3">
              <School className="h-4 w-4 text-success" aria-hidden="true" />
              <div>
                <p className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">Carteira monitorada</p>
                <p className="text-xs font-medium tabular-nums text-foreground">
                  {loading ? "Carregando…" : `${totalUnidades ?? "—"} unidades escolares`}
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5"
          aria-label="Indicadores financeiros principais"
        >
          <motion.div variants={item}>
            <ExecutiveKpi
              label="Total programado"
              value={formatCompactMoney(overview.totalProgramado)}
              detail="Programação conhecida no exercício"
              icon={WalletCards}
              tone="violet"
              loading={loading}
              onClick={() => navigate("/repasses", { viewTransition: true })}
            />
          </motion.div>
          <motion.div variants={item}>
            <ExecutiveKpi
              label="1ª parcela paga"
              value={formatCompactMoney(overview.primeiraParcela.totalPago)}
              detail={`${overview.primeiraParcela.escolas} unidades com pagamento identificado`}
              icon={CheckCircle2}
              tone="primary"
              progress={primeiraCobertura}
              loading={loading}
              onClick={() => navigate("/repasses", { viewTransition: true })}
            />
          </motion.div>
          <motion.div variants={item}>
            <ExecutiveKpi
              label="2º ciclo informado"
              value={formatCompactMoney(segundoCiclo.escolas.length > 0 ? segundoCiclo.totalInformado : null)}
              detail={`${segundoCiclo.escolas.length} unidades no recorte oficial`}
              icon={Activity}
              tone="warning"
              loading={loading}
              onClick={() => navigate("/repasses?ciclo=2", { viewTransition: true })}
            />
          </motion.div>
          <motion.div variants={item}>
            <ExecutiveKpi
              label="Cobertura · 2º ciclo"
              value={loading ? "—" : `${segundoCiclo.escolas.length}/${segundoCiclo.escolasEsperadas}`}
              detail={segundoCiclo.coberturaPagamentoCompleta ? "Carteira integralmente identificada" : "Cobertura ainda em formação"}
              icon={School}
              tone={segundoCiclo.coberturaPagamentoCompleta ? "success" : "warning"}
              progress={segundaCobertura}
              loading={loading}
              onClick={() => navigate("/repasses?ciclo=2", { viewTransition: true })}
            />
          </motion.div>
          <motion.div variants={item}>
            <ExecutiveKpi
              label="Unidades monitoradas"
              value={totalUnidades === null ? "—" : totalUnidades.toLocaleString("pt-BR")}
              detail={cadastroIncompletoCount > 0
                ? `${cadastroIncompletoCount} cadastro(s) exigem revisão`
                : "Cadastros essenciais completos"}
              icon={Database}
              tone={cadastroIncompletoCount > 0 ? "warning" : "muted"}
              loading={loading}
              onClick={() => navigate("/escolas", { viewTransition: true })}
            />
          </motion.div>
        </motion.section>

        <section className="grid gap-3 lg:grid-cols-[1.55fr_0.9fr]" aria-label="Visualizações financeiras">
          {loading ? (
            <>
              <Skeleton className="h-[360px] w-full rounded-xl" />
              <Skeleton className="h-[360px] w-full rounded-xl" />
            </>
          ) : (
            <>
              <FinancialPortfolioChart
                programs={overview.porPrograma}
                onExplore={() => navigate("/repasses", { viewTransition: true })}
              />
              <SecondCycleEvidenceChart
                overview={segundoCiclo}
                onExplore={() => navigate("/repasses?ciclo=2", { viewTransition: true })}
              />
            </>
          )}
        </section>

        <section className="grid gap-3 lg:grid-cols-[1.45fr_0.85fr]" aria-labelledby="novidades-financeiras-title">
          <Card className="overflow-hidden border-border/60 bg-card/80 shadow-ds-sm">
            <CardContent className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/50 px-5 py-4">
                <div>
                  <p className="ds-eyebrow">Monitoramento contínuo</p>
                  <h2 id="novidades-financeiras-title" className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
                    Atividade financeira recente
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/atualizacoes", { viewTransition: true })}>
                  Ver todas
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>

              {loading ? (
                <div className="space-y-2 p-5">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Skeleton key={index} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentFinancialEvents.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">
                  Nenhum evento financeiro datado está disponível no recorte atual.
                </div>
              ) : (
                <div className="divide-y divide-border/50">
                  {recentFinancialEvents.map((event) => {
                    const stage = eventVisual[event.stage];
                    return (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => navigate(`/escolas/${event.unidadeId}/recursos`, { viewTransition: true })}
                        className="group flex w-full items-center justify-between gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/20"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-medium">{event.designacao}</p>
                            <span className={cn(
                              "inline-flex rounded-md border px-1.5 py-0.5 text-[9.5px] font-semibold",
                              stage.className,
                            )}>
                              {stage.label}
                            </span>
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                            {event.acao} · {event.parcela} · {formatDate(event.dataEvento)}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-sm font-semibold tabular-nums text-foreground">
                            {event.valor === null ? "—" : formatMoney(event.valor)}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors group-hover:text-primary" aria-hidden="true" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 bg-card/80 shadow-ds-sm">
            <CardContent className="p-5">
              <div>
                <p className="ds-eyebrow">Ações e exceções</p>
                <h2 className="mt-0.5 text-base font-semibold tracking-tight text-foreground">
                  O que exige atenção
                </h2>
              </div>

              <div className="mt-4 space-y-2.5">
                {cadastroIncompletoCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate("/escolas", { viewTransition: true })}
                    className="flex w-full items-start gap-3 rounded-xl border border-warning/25 bg-warning/[0.045] p-3 text-left transition-colors hover:bg-warning/[0.07]"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {cadastroIncompletoCount} cadastro{cadastroIncompletoCount === 1 ? "" : "s"} incompleto{cadastroIncompletoCount === 1 ? "" : "s"}
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        Falta CNPJ, INEP ou diretor(a) em parte da carteira.
                      </p>
                    </div>
                  </button>
                ) : !loading ? (
                  <div className="flex items-start gap-3 rounded-xl border border-success/25 bg-success/[0.045] p-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Cadastros essenciais completos</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        Nenhuma pendência cadastral essencial detectada.
                      </p>
                    </div>
                  </div>
                ) : null}

                {segundoCiclo.ordensSemCredito > 0 ? (
                  <button
                    type="button"
                    onClick={() => navigate("/repasses?ciclo=2", { viewTransition: true })}
                    className="flex w-full items-start gap-3 rounded-xl border border-primary/20 bg-primary/[0.035] p-3 text-left transition-colors hover:bg-primary/[0.06]"
                  >
                    <Activity className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {segundoCiclo.ordensSemCredito} ordem{segundoCiclo.ordensSemCredito === 1 ? "" : "ns"} sem crédito bancário localizado
                      </p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        O pagamento oficial permanece registrado separadamente.
                      </p>
                    </div>
                  </button>
                ) : null}

                {freshness?.status === "STORAGE_LAG" || freshness?.status === "SOURCE_STALE" || freshness?.status === "SOURCE_UNAVAILABLE" ? (
                  <button
                    type="button"
                    onClick={() => navigate("/atualizacoes", { viewTransition: true })}
                    className="flex w-full items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/[0.04] p-3 text-left transition-colors hover:bg-destructive/[0.07]"
                  >
                    <Database className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{freshnessState?.label}</p>
                      <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                        Abra o histórico de atualizações para verificar a cadeia de sincronização.
                      </p>
                    </div>
                  </button>
                ) : null}
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate("/escolas", { viewTransition: true })}>
                  Unidades
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate("/repasses", { viewTransition: true })}>
                  Repasses
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {!loading ? <SegundaParcelaResumo overview={segundoCiclo} /> : null}

        <CentralDocumental />

        <section className="grid gap-3 lg:grid-cols-[1.45fr_0.85fr]">
          <Card className="border-border/60 bg-card/80 shadow-ds-sm">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="ds-eyebrow">Cadastro</p>
                  <h2 className="mt-0.5 text-base font-semibold tracking-tight">Unidades atualizadas recentemente</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/escolas", { viewTransition: true })}>
                  Ver todas
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>

              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              ) : recentes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Inbox className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium">Nenhuma unidade cadastrada ainda</p>
                </div>
              ) : (
                <motion.ul variants={container} initial="hidden" animate="show" className="divide-y divide-border/50">
                  {recentes.map((row) => (
                    <motion.li
                      key={row.id}
                      variants={item}
                      className="group flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 transition-colors group-hover:bg-primary" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{row.designacao}</p>
                          {row.updated_at ? (
                            <p className="mt-0.5 text-[10px] tabular-nums text-muted-foreground">
                              Atualizada {new Date(row.updated_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs"
                        onClick={() => navigate(`/escolas/${row.id}`, { viewTransition: true })}
                      >
                        Abrir
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </motion.li>
                  ))}
                </motion.ul>
              )}
            </CardContent>
          </Card>

          <HistoricoGeracoesCard />
        </section>
      </div>
    </AppLayout>
  );
}
