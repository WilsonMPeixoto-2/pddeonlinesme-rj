import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  FileSpreadsheet,
  School,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { NumberTicker } from "@/components/NumberTicker";
import { MiniSparkline } from "@/components/MiniSparkline";
import { TiltCard } from "@/components/TiltCard";

type Recente = { id: string; designacao: string; updated_at: string };

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const fmtBRLDecimal = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Mock sparkline series — replace with real per-month aggregates later
const SPARK_RECEBIDO = [12, 18, 22, 19, 27, 35, 41, 38, 46, 52, 58, 63];
const SPARK_GASTO = [4, 9, 14, 11, 19, 22, 31, 29, 38, 41, 47, 51];
const SPARK_UNIDADES = [40, 41, 42, 42, 43, 44, 44, 45, 46, 46, 47, 47];
const SPARK_DOCS = [0, 2, 4, 6, 8, 12, 16, 22, 28, 35, 41, 48];

type Tone = "primary" | "success" | "warning" | "muted";
const toneRing: Record<Tone, string> = {
  primary: "bg-primary/10 text-primary ring-1 ring-primary/20",
  success: "bg-success/10 text-success ring-1 ring-success/20",
  warning: "bg-warning/10 text-warning ring-1 ring-warning/20",
  muted: "bg-muted text-muted-foreground ring-1 ring-border/50",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [total, setTotal] = useState<number | null>(null);
  const [totalRecebido, setTotalRecebido] = useState(0);
  const [totalGasto, setTotalGasto] = useState(0);
  const [recentes, setRecentes] = useState<Recente[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, count } = await supabase
        .from("unidades_escolares")
        .select("id, designacao, updated_at, recebido, gasto, saldo_anterior", {
          count: "exact",
        })
        .order("updated_at", { ascending: false });

      const lista = data ?? [];
      setTotal(count ?? lista.length);
      setTotalRecebido(
        lista.reduce((s, r) => s + Number(r.recebido ?? 0) + Number(r.saldo_anterior ?? 0), 0),
      );
      setTotalGasto(lista.reduce((s, r) => s + Number(r.gasto ?? 0), 0));
      setRecentes(lista.slice(0, 5).map((r) => ({ id: r.id, designacao: r.designacao, updated_at: r.updated_at })));
      setLoading(false);
    })();
  }, []);

  const executionRate = totalRecebido > 0 ? Math.min(100, (totalGasto / totalRecebido) * 100) : 0;

  const stats: {
    label: string;
    value: number | null;
    icon: typeof School;
    hint: string;
    tone: Tone;
    spark: number[];
    format?: (n: number) => string;
  }[] = [
    {
      label: "Unidades escolares",
      value: total,
      icon: School,
      hint: "Cadastradas na 4ª CRE",
      tone: "primary",
      spark: SPARK_UNIDADES,
    },
    {
      label: "Recebido + saldo",
      value: totalRecebido,
      icon: TrendingUp,
      hint: "Recursos disponíveis no exercício",
      tone: "success",
      spark: SPARK_RECEBIDO,
      format: fmtBRL,
    },
    {
      label: "Total executado",
      value: totalGasto,
      icon: CheckCircle2,
      hint: `${executionRate.toFixed(1)}% do disponível`,
      tone: "warning",
      spark: SPARK_GASTO,
      format: fmtBRL,
    },
    {
      label: "Demonstrativos gerados",
      value: 0,
      icon: FileSpreadsheet,
      hint: "Disponível em breve",
      tone: "muted",
      spark: SPARK_DOCS,
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
                <span className="inline-flex h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
                <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Painel operacional · Exercício 2026
                </p>
              </div>

              <div>
                <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">
                  {loading ? (
                    <Skeleton className="h-16 w-[80%]" />
                  ) : (
                    <NumberTicker
                      value={totalRecebido}
                      format={fmtBRLDecimal}
                      className="bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent tabular-nums"
                    />
                  )}
                </h1>
                <p className="mt-3 text-sm font-light tracking-wide text-muted-foreground sm:text-base">
                  Recursos disponíveis nas{" "}
                  <span className="font-medium text-foreground">{total ?? "—"}</span>{" "}
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

            {/* Execution gauge */}
            <div className="space-y-3 rounded-xl border border-border/50 bg-background/40 p-5">
              <div className="flex items-baseline justify-between">
                <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                  Execução financeira
                </p>
                <p className="text-2xl font-semibold tabular-nums">
                  {loading ? "—" : `${executionRate.toFixed(1)}%`}
                </p>
              </div>
              <div className="relative h-2 overflow-hidden rounded-full bg-muted/60">
                <motion.div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/70 shadow-[0_0_12px_hsl(var(--primary)/0.6)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${executionRate}%` }}
                  transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Executado: {fmtBRL(totalGasto)}</span>
                <span>Disponível: {fmtBRL(totalRecebido)}</span>
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
                  <Card className="group relative h-full overflow-hidden transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_hsl(var(--primary)/0.08)]">
                  <CardContent className="flex h-full flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                        {s.label}
                      </p>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-md transition-transform duration-300 group-hover:scale-110 ${toneRing[s.tone]}`}
                      >
                        <Icon className="h-4 w-4" aria-hidden />
                      </div>
                    </div>

                    <div>
                      {!isReady || loading ? (
                        <Skeleton className="h-9 w-24" />
                      ) : (
                        <p className="text-3xl font-semibold tracking-tight tabular-nums sm:text-[2rem]">
                          <NumberTicker
                            value={s.value as number}
                            format={s.format ?? ((n) => Math.round(n).toLocaleString("pt-BR"))}
                          />
                        </p>
                      )}
                      <p className="mt-1 text-[11px] text-muted-foreground">{s.hint}</p>
                    </div>

                    <div className="-mx-1 mt-auto">
                      <MiniSparkline
                        data={s.spark}
                        tone={s.tone === "muted" ? "primary" : s.tone}
                        height={32}
                      />
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
          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold">Atualizadas recentemente</h2>
                  <p className="text-[11px] text-muted-foreground">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => navigate(`/escolas/${r.id}`)}
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

          <Card>
            <CardContent className="space-y-4 p-5">
              <div>
                <h2 className="text-base font-semibold">Atenção operacional</h2>
                <p className="text-[11px] text-muted-foreground">Indicadores que exigem revisão.</p>
              </div>

              <ul className="space-y-2">
                <li className="flex items-start gap-3 rounded-lg border border-warning/20 bg-warning/5 p-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Cadastros incompletos</p>
                    <p className="text-[11px] text-muted-foreground">
                      Unidades sem CNPJ, INEP ou diretor(a).
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <FileSpreadsheet className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium">Próxima geração em lote</p>
                    <p className="text-[11px] text-muted-foreground">
                      Disponível após validação completa da BASE.
                    </p>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
