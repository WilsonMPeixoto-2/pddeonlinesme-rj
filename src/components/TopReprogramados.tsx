import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadesDetalheLista } from "@/hooks/useUnidadesDetalheLista";

const PROGRAMA = "basico";

const fmtBRL = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

export function TopReprogramados() {
  const { exercicio } = useExercicio();
  const navigate = useNavigate();
  const { topReprogramados, isLoading } = useUnidadesDetalheLista({
    exercicio,
    programa: PROGRAMA,
  });

  const max = topReprogramados[0]?.total_reprogramado ?? 0;

  return (
    <Card className="ds-card">
      <CardContent className="p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-primary/10 text-primary ring-1 ring-primary/20">
                <TrendingUp className="h-3.5 w-3.5" />
              </span>
              <h2 className="ds-h3">Top 5 reprogramados</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Unidades com maior saldo reprogramado no exercicio {exercicio}.
            </p>
          </div>
        </div>

        {isLoading ? (
          <ul className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <li key={i} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-1/2" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
                <Skeleton className="h-1.5 w-full" />
              </li>
            ))}
          </ul>
        ) : topReprogramados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 px-3 py-6 text-center text-xs text-muted-foreground">
            Nenhuma unidade com saldo reprogramado lancado no exercicio {exercicio}.
          </div>
        ) : (
          <motion.ul
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: { opacity: 1, transition: { staggerChildren: 0.06 } },
            }}
            className="space-y-2.5"
          >
            {topReprogramados.map((u, i) => {
              const value = u.total_reprogramado ?? 0;
              const widthPct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 0;
              return (
                <motion.li
                  key={u.unidade_id ?? `top-${i}`}
                  variants={{
                    hidden: { opacity: 0, y: 6 },
                    show: { opacity: 1, y: 0 },
                  }}
                  className="group space-y-1"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => u.unidade_id && navigate(`/escolas/${u.unidade_id}`)}
                      className="truncate text-left text-sm font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
                      title={u.designacao ?? ""}
                    >
                      <span className="mr-1.5 inline-block w-4 text-right font-mono text-[10px] tabular-nums text-muted-foreground">
                        {i + 1}.
                      </span>
                      {u.designacao}
                    </button>
                    <span className="shrink-0 font-mono text-xs tabular-nums text-foreground">
                      {fmtBRL(value)}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted/40">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${widthPct}%` }}
                      transition={{ duration: 0.6, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-gradient-to-r from-primary/70 to-primary"
                    />
                  </div>
                </motion.li>
              );
            })}
          </motion.ul>
        )}

        {topReprogramados.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-4 h-8 w-full justify-between text-xs text-muted-foreground hover:text-foreground"
            onClick={() => navigate("/escolas")}
          >
            <span>Ver lista completa</span>
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
