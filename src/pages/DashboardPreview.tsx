import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Coins,
  Landmark,
  Receipt,
  School,
} from "lucide-react";

import AppLayout from "@/components/AppLayout";
import { CentralDocumental } from "@/components/CentralDocumental";
import { NumberTicker } from "@/components/NumberTicker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardUnidadesResumo } from "@/hooks/useDashboardUnidadesResumo";
import { useExercicio } from "@/hooks/useExercicio";
import { buildDashboardFinanceiroOverview } from "@/lib/financeiroPDDE";
import {
  contasFinanceirasOptions,
  repassesFinanceirosOptions,
} from "@/lib/queryKeys";

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

const fmtDate = (value: string | null) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(
    new Date(`${value}T00:00:00Z`),
  );
};

const formatMoneyOrDash = (value: number | null) =>
  value === null ? "—" : fmtBRL(value);

function DestinationCard({
  title,
  description,
  eyebrow,
  action,
  destination,
  icon: Icon,
  metric,
  metricLabel,
}: {
  title: string;
  description: string;
  eyebrow: string;
  action: string;
  destination: string;
  icon: typeof School;
  metric?: string;
  metricLabel?: string;
}) {
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(destination, { viewTransition: true })}
      className="group h-full w-full rounded-2xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
    >
      <Card className="h-full border-slate-200/80 bg-white/90 shadow-[0_18px_45px_-34px_rgba(15,23,42,0.42)] transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-primary/30 group-hover:shadow-[0_24px_58px_-34px_rgba(15,23,42,0.5)] dark:border-border dark:bg-card">
        <CardContent className="flex h-full flex-col p-6 sm:p-7">
          <div className="flex items-start justify-between gap-5">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-800 shadow-sm dark:border-border dark:bg-muted dark:text-foreground">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
                  {eyebrow}
                </p>
                <h2 className="mt-1.5 text-[1.08rem] font-semibold leading-snug tracking-[-0.015em] text-slate-950 dark:text-foreground">
                  {title}
                </h2>
              </div>
            </div>
            <ArrowUpRight className="mt-1 h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-primary" aria-hidden="true" />
          </div>

          <p className="mt-5 max-w-[45ch] text-sm leading-6 text-slate-600 dark:text-muted-foreground">
            {description}
          </p>

          <div className="mt-auto pt-6">
            {metric ? (
              <div className="border-t border-slate-200/80 pt-4 dark:border-border">
                <p className="text-xl font-semibold tracking-tight text-slate-950 dark:text-foreground">
                  {metric}
                </p>
                {metricLabel ? (
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                    {metricLabel}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between gap-3 text-sm font-semibold text-primary">
              <span>{action}</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/[0.04] transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </button>
  );
}

export default function DashboardPreview() {
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
    () =>
      buildDashboardFinanceiroOverview(
        repassesQuery.data ?? [],
        contasQuery.data ?? [],
        exercicioNumero,
      ),
    [contasQuery.data, exercicioNumero, repassesQuery.data],
  );

  const contas = contasQuery.data ?? [];
  const unidadesComConta = useMemo(
    () => new Set(contas.map((conta) => conta.unidade_id)).size,
    [contas],
  );
  const contasComCadastroCompleto = useMemo(
    () => contas.filter((conta) => conta.banco && conta.agencia && conta.conta_corrente).length,
    [contas],
  );

  const loading = repassesQuery.isLoading || contasQuery.isLoading || loadingResumo;
  const queryError = repassesQuery.error ?? contasQuery.error ?? errorResumo;
  const totalUnidades = overview.totalEscolas > 0
    ? overview.totalEscolas
    : (resumoUnidades?.total ?? null);
  const cadastroIncompletoCount = resumoUnidades?.cadastroIncompletoCount ?? 0;

  const totalComposicao =
    overview.primeiraParcela.custeioPago !== null &&
    overview.primeiraParcela.capitalPago !== null
      ? overview.primeiraParcela.custeioPago + overview.primeiraParcela.capitalPago
      : null;
  const custeioPercentual = totalComposicao && totalComposicao > 0
    ? ((overview.primeiraParcela.custeioPago ?? 0) / totalComposicao) * 100
    : 0;
  const capitalPercentual = totalComposicao && totalComposicao > 0
    ? ((overview.primeiraParcela.capitalPago ?? 0) / totalComposicao) * 100
    : 0;

  if (queryError && !loading) {
    return (
      <AppLayout>
        <Card>
          <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-lg font-semibold">Erro ao carregar o painel alternativo</h1>
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
      <div className="space-y-7 pb-6">
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="relative overflow-hidden rounded-[1.4rem] border border-slate-200/80 bg-white shadow-[0_20px_60px_-42px_rgba(15,23,42,0.5)] dark:border-border dark:bg-card"
        >
          <div
            className="pointer-events-none absolute inset-y-0 right-0 hidden w-[58%] bg-cover bg-center opacity-95 lg:block"
            style={{ backgroundImage: "url('/rio-financeiro-hero.svg')" }}
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,1)_0%,rgba(255,255,255,0.98)_48%,rgba(255,255,255,0.18)_78%,rgba(255,255,255,0)_100%)] dark:hidden" />
          <div className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(90deg,hsl(var(--card))_0%,hsl(var(--card))_52%,hsl(var(--card)/0.5)_78%,hsl(var(--card)/0.2)_100%)] dark:block" />

          <div className="relative px-6 py-8 sm:px-9 sm:py-10 lg:px-11 lg:py-12">
            <div className="max-w-[760px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-muted-foreground">
                Gestão financeira da educação · 4ª CRE · exercício {exercicio}
              </p>
              <h1 className="mt-3 max-w-[760px] text-balance text-[2.2rem] font-semibold leading-[1.02] tracking-[-0.04em] text-slate-950 sm:text-[2.8rem] lg:text-[3.35rem] dark:text-foreground">
                Painel Financeiro das Unidades Escolares
              </h1>
              <p className="mt-4 max-w-[67ch] text-[15px] leading-6 text-slate-600 sm:text-base dark:text-muted-foreground">
                Repasses da 1ª parcela do PDDE, contas bancárias vinculadas aos programas e detalhes financeiros por unidade escolar em uma única visão operacional.
              </p>
            </div>

            <div className="mt-8 grid max-w-[900px] gap-4 border-t border-slate-200/80 pt-6 sm:grid-cols-3 dark:border-border">
              <div className="flex items-start gap-3 sm:border-r sm:border-slate-200/80 sm:pr-5 dark:sm:border-border">
                <School className="mt-1 h-5 w-5 shrink-0 text-slate-700 dark:text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground">
                    Rede acompanhada
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950 dark:text-foreground">
                    {loading ? "—" : totalUnidades ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">unidades escolares</p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:border-r sm:border-slate-200/80 sm:px-5 dark:sm:border-border">
                <Receipt className="mt-1 h-5 w-5 shrink-0 text-slate-700 dark:text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground">
                    1ª parcela identificada
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950 dark:text-foreground">
                    {loading || overview.primeiraParcela.totalPago === null
                      ? "—"
                      : fmtBRL(overview.primeiraParcela.totalPago)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    {overview.primeiraParcela.escolas || 0} unidades com pagamento
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 sm:pl-5">
                <Landmark className="mt-1 h-5 w-5 shrink-0 text-slate-700 dark:text-muted-foreground" aria-hidden="true" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground">
                    Contas bancárias
                  </p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.03em] text-slate-950 dark:text-foreground">
                    {loading ? "—" : overview.totalContas}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-muted-foreground">
                    vinculadas a {unidadesComConta || 0} unidades
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-2.5">
              <Button onClick={() => navigate("/repasses", { viewTransition: true })}>
                Explorar repasses
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/escolas", { viewTransition: true })}>
                Abrir unidades escolares
              </Button>
            </div>
          </div>
        </motion.section>

        <section aria-label="Principais áreas de informação" className="grid gap-4 lg:grid-cols-3">
          <DestinationCard
            eyebrow="Pagamentos"
            title="Repasses da 1ª parcela"
            description="Consulte valores identificados, datas de pagamento e composição entre custeio e capital, com detalhamento por unidade escolar."
            action="Explorar repasses"
            destination="/repasses"
            icon={Receipt}
            metric={loading || overview.primeiraParcela.totalPago === null ? "—" : fmtBRL(overview.primeiraParcela.totalPago)}
            metricLabel={`Pagamento identificado em ${overview.primeiraParcela.escolas || 0} unidades`}
          />
          <DestinationCard
            eyebrow="Dados bancários"
            title="Contas e repasses das unidades"
            description="Acesse as contas correntes vinculadas aos programas, os repasses associados e o contexto financeiro de cada unidade escolar."
            action="Ver contas e unidades"
            destination="/escolas"
            icon={Landmark}
            metric={loading ? "—" : `${overview.totalContas} contas`}
            metricLabel={`${unidadesComConta || 0} unidades com vínculo bancário em ${exercicio}`}
          />
          <DestinationCard
            eyebrow="Carteira financeira"
            title="Programas e recursos"
            description="Compare valores programados e pagamentos identificados por programa e avance para os recortes financeiros disponíveis."
            action="Abrir programas e recursos"
            destination="/repasses"
            icon={Coins}
            metric={loading ? "—" : `${overview.porPrograma.length} programas`}
            metricLabel="PDDE Básico, Qualidade e Equidade no mesmo painel"
          />
        </section>

        <section className="grid gap-4 xl:grid-cols-[1.05fr_1.25fr_0.9fr]" aria-label="Visão analítica do exercício">
          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
                    Estrutura do pagamento
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-foreground">
                    Composição da 1ª parcela
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/repasses", { viewTransition: true })} className="h-8 px-2 text-xs">
                  Ver detalhes
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>

              {loading ? (
                <Skeleton className="mt-6 h-52 w-full rounded-xl" />
              ) : totalComposicao && totalComposicao > 0 ? (
                <div className="mt-6 grid items-center gap-6 sm:grid-cols-[150px_1fr] xl:grid-cols-1 2xl:grid-cols-[150px_1fr]">
                  <div className="mx-auto flex h-[150px] w-[150px] items-center justify-center rounded-full p-[17px]"
                    style={{
                      background: `conic-gradient(#174A7E 0 ${custeioPercentual}%, #7C93AD ${custeioPercentual}% 100%)`,
                    }}
                    role="img"
                    aria-label={`Composição da 1ª parcela: ${custeioPercentual.toFixed(1)}% custeio e ${capitalPercentual.toFixed(1)}% capital`}
                  >
                    <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(148,163,184,0.16)] dark:bg-card">
                      <span className="text-lg font-semibold tabular-nums text-slate-950 dark:text-foreground">
                        {fmtBRL(totalComposicao)}
                      </span>
                      <span className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-slate-500 dark:text-muted-foreground">
                        total
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="border-b border-slate-200/80 pb-4 dark:border-border">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#174A7E]" aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-700 dark:text-foreground">Custeio</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-foreground">
                          {formatMoneyOrDash(overview.primeiraParcela.custeioPago)}
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-xs text-slate-500 dark:text-muted-foreground">
                        {custeioPercentual.toFixed(1)}% da composição conhecida
                      </p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2.5">
                          <span className="h-2.5 w-2.5 rounded-full bg-[#7C93AD]" aria-hidden="true" />
                          <span className="text-sm font-medium text-slate-700 dark:text-foreground">Capital</span>
                        </div>
                        <span className="text-sm font-semibold tabular-nums text-slate-950 dark:text-foreground">
                          {formatMoneyOrDash(overview.primeiraParcela.capitalPago)}
                        </span>
                      </div>
                      <p className="mt-1 pl-5 text-xs text-slate-500 dark:text-muted-foreground">
                        {capitalPercentual.toFixed(1)}% da composição conhecida
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-5 text-sm text-slate-600 dark:border-border dark:text-muted-foreground">
                  A composição completa ainda não está disponível para o recorte exibido.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
                    Carteira financeira
                  </p>
                  <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-foreground">
                    Programas e recursos
                  </h2>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate("/repasses", { viewTransition: true })} className="h-8 px-2 text-xs">
                  Ver todos
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>

              <div className="mt-5 divide-y divide-slate-200/80 dark:divide-border">
                {loading
                  ? Array.from({ length: 3 }).map((_, index) => (
                      <div key={index} className="py-4">
                        <Skeleton className="h-11 w-full" />
                      </div>
                    ))
                  : overview.porPrograma.map((program) => (
                      <button
                        type="button"
                        key={program.programa}
                        onClick={() => navigate("/repasses", { viewTransition: true })}
                        className="group grid w-full grid-cols-[1fr_auto] items-center gap-4 py-4 text-left first:pt-1 last:pb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-slate-500" aria-hidden="true" />
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-foreground">
                              {program.programa}
                            </p>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-4 pl-4.5">
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-muted-foreground">
                                Programado
                              </p>
                              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-700 dark:text-foreground">
                                {formatMoneyOrDash(program.totalProgramado)}
                              </p>
                            </div>
                            <div>
                              <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-slate-400 dark:text-muted-foreground">
                                Identificado
                              </p>
                              <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-700 dark:text-foreground">
                                {formatMoneyOrDash(program.totalPago)}
                              </p>
                            </div>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-primary" aria-hidden="true" />
                      </button>
                    ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200/80 bg-white shadow-sm dark:border-border dark:bg-card">
            <CardContent className="p-6">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-muted-foreground">
                Controle
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-[-0.02em] text-slate-950 dark:text-foreground">
                Situação operacional
              </h2>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-muted-foreground">
                Cobertura do recorte e consistência dos dados utilizados pelo painel.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-border dark:bg-muted/25">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                        1ª parcela identificada
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                        {overview.primeiraParcela.escolas} de {totalUnidades ?? "—"} unidades com pagamento no recorte.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-border dark:bg-muted/25">
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-0.5 h-4 w-4 shrink-0 text-slate-700 dark:text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                        Cadastro bancário disponível
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                        {contasComCadastroCompleto} de {overview.totalContas} contas têm banco, agência e conta informados.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-4 dark:border-border dark:bg-muted/25">
                  <div className="flex items-start gap-3">
                    <School className="mt-0.5 h-4 w-4 shrink-0 text-slate-700 dark:text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-foreground">
                        Cadastros essenciais
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-muted-foreground">
                        {cadastroIncompletoCount === 0
                          ? "Todas as unidades estão completas nos campos essenciais do demonstrativo."
                          : `${cadastroIncompletoCount} unidade${cadastroIncompletoCount === 1 ? "" : "s"} ainda exige${cadastroIncompletoCount === 1 ? "" : "m"} revisão.`}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 border-t border-slate-200/80 pt-4 dark:border-border">
                <p className="text-[10px] uppercase tracking-[0.13em] text-slate-400 dark:text-muted-foreground">Último pagamento deste recorte</p>
                <p className="mt-1 text-sm font-semibold text-slate-800 dark:text-foreground">
                  {fmtDate(overview.primeiraParcela.ultimaDataPagamento)}
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-slate-50/65 px-5 py-4 dark:border-border dark:bg-muted/20" aria-label="Acessos complementares">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-muted-foreground">Acessos complementares</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-muted-foreground">Dados, histórico e rotinas administrativas permanecem disponíveis sem disputar atenção com a visão financeira principal.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate("/escolas", { viewTransition: true })}>Unidades escolares</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/painel/historico", { viewTransition: true })}>Histórico</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/base", { viewTransition: true })}>Importar/Exportar</Button>
              <Button variant="outline" size="sm" onClick={() => navigate("/configuracoes", { viewTransition: true })}>Configurações</Button>
            </div>
          </div>
        </section>

        <section className="pt-1" aria-label="Geração documental">
          <CentralDocumental />
        </section>
      </div>
    </AppLayout>
  );
}