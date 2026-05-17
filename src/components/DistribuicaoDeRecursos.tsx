import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Coins, ArrowUpRight, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadesDetalheLista } from "@/hooks/useUnidadesDetalheLista";

const PROGRAMA = "basico";

const fmtPct = (num: number, den: number) =>
  den === 0 ? 0 : Math.round((num / den) * 100);

export function DistribuicaoDeRecursos() {
  const { exercicio } = useExercicio();
  const navigate = useNavigate();
  const { stats, isLoading } = useUnidadesDetalheLista({
    exercicio,
    programa: PROGRAMA,
  });

  const total = stats?.total ?? 0;
  const comDados = stats?.comDadosFinanceiros ?? 0;
  const semDados = stats?.semDadosFinanceiros ?? 0;
  const pctSemDados = fmtPct(semDados, total);
  const pctComDados = fmtPct(comDados, total);

  const chartData = [
    { name: "Com repasse", value: comDados, color: "hsl(var(--primary))" },
    { name: "Sem repasse", value: semDados, color: "hsl(var(--muted-foreground) / 0.35)" },
  ].filter((d) => d.value > 0);

  const concentracaoCritica = pctSemDados >= 50;

  return (
    <Card className="ds-card">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                <Coins className="h-3.5 w-3.5" />
              </span>
              <h2 className="ds-h3">Distribuicao de recursos</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Penetracao do PDDE Basico nas {total} unidades em {exercicio}.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-5">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        ) : total === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma unidade carregada.
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-5"
          >
            <div className="relative h-24 w-24 shrink-0">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={32}
                      outerRadius={48}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`dist-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full rounded-full border-4 border-muted/30" />
              )}
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-semibold tabular-nums text-foreground">
                  {pctComDados}%
                </span>
                <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
                  com repasse
                </span>
              </div>
            </div>

            <div className="flex-1 space-y-2.5">
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  <span className="text-xs text-muted-foreground">Com repasse</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-foreground">
                  {comDados} <span className="font-normal text-muted-foreground">· {pctComDados}%</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">Sem repasse</span>
                </div>
                <span className="text-sm font-semibold tabular-nums text-muted-foreground">
                  {semDados} <span className="font-normal">· {pctSemDados}%</span>
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {concentracaoCritica && !isLoading && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-2.5 text-[11px]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
            <p className="text-muted-foreground">
              <strong className="text-foreground">{pctSemDados}%</strong> das unidades ainda nao tem repasse
              lancado para {exercicio}. Verifique a importacao da BASE e os lancamentos pendentes.
            </p>
          </div>
        )}

        {total > 0 && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 h-8 w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/escolas")}
          >
            <span>Abrir unidades</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
