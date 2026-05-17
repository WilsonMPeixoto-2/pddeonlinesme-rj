import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  PackageCheck,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useExercicio } from "@/hooks/useExercicio";
import { useUnidadesDetalheLista } from "@/hooks/useUnidadesDetalheLista";
import { useGerarDemonstrativosLote } from "@/hooks/useGerarDemonstrativosLote";

const PROGRAMA = "basico";

const fmtPct = (num: number, den: number) =>
  den === 0 ? "0%" : `${Math.round((num / den) * 100)}%`;

export function CentralDocumental() {
  const { exercicio } = useExercicio();
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, stats, isLoading } = useUnidadesDetalheLista({
    exercicio,
    programa: PROGRAMA,
  });
  const lote = useGerarDemonstrativosLote();

  const elegiveis = (data ?? []).filter(
    (u) =>
      (u.total_disponivel_inicial ?? 0) > 0 ||
      (u.total_reprogramado ?? 0) > 0 ||
      (u.total_parcelas ?? 0) > 0,
  );

  const elegiveisCount = elegiveis.length;
  const totalUnidades = stats?.total ?? data?.length ?? 0;
  const semDados = stats?.semDadosFinanceiros ?? 0;

  const running = lote.phase === "running";
  const done = lote.phase === "done";
  const errored = lote.phase === "error";
  const progressPct =
    lote.phase === "running" && lote.progress.total > 0
      ? Math.round((lote.progress.done / lote.progress.total) * 100)
      : 0;

  const handleConfirm = () => {
    if (elegiveisCount === 0) {
      toast.warning("Nenhuma unidade com dados financeiros para gerar.");
      setConfirmOpen(false);
      return;
    }
    setConfirmOpen(false);
    lote
      .start({
        unidades: elegiveis,
        exercicio,
        programa: PROGRAMA,
        totalCadastrado: totalUnidades,
      })
      .then(() => {
        // Toast final fica para o efeito do phase done, ja que o handler async
        // pode resolver antes do React aplicar o novo estado.
      })
      .catch(() => {
        // Erros sao capturados dentro do hook; ignorar rejection aqui.
      });
  };

  const handleCancel = () => {
    lote.cancel();
    toast.info("Cancelando geracao em lote...");
  };

  const handleReset = () => {
    lote.reset();
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="relative overflow-hidden border-primary/25 bg-gradient-to-br from-primary/[0.07] via-card to-card shadow-[0_0_30px_hsl(var(--primary)/0.08)]">
        {/* Decorative glow */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />

        <CardContent className="relative grid gap-6 p-6 sm:p-7 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          {/* LEFT — call to action */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-primary/15 text-primary ring-1 ring-primary/30">
                <PackageCheck className="h-3.5 w-3.5" />
              </span>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-primary/80">
                Acao executiva · Geracao em lote
              </p>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Gerar Demonstrativo Basico de todas as unidades
              </h2>
              <p className="max-w-prose text-sm text-muted-foreground">
                Produz, em uma unica acao, os <strong className="text-foreground">{elegiveisCount}</strong>{" "}
                demonstrativos individuais das unidades com dados financeiros lancados, entrega
                um arquivo <span className="font-mono">.zip</span> consolidado pronto para revisao e
                registra a corrida no historico institucional.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="h-11 shadow-[0_0_20px_hsl(var(--primary)/0.25)] hover:shadow-[0_0_28px_hsl(var(--primary)/0.4)]"
                onClick={() => setConfirmOpen(true)}
                disabled={isLoading || running || elegiveisCount === 0}
              >
                {running ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Gerando {lote.progress.done}/{lote.progress.total}
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    {elegiveisCount > 0
                      ? `Gerar ${elegiveisCount} demonstrativos`
                      : "Sem unidades elegiveis"}
                  </>
                )}
              </Button>

              {running && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-muted-foreground hover:text-destructive"
                  onClick={handleCancel}
                >
                  <X className="mr-1.5 h-4 w-4" />
                  Cancelar
                </Button>
              )}

              {(done || errored) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-9 text-muted-foreground hover:text-foreground"
                  onClick={handleReset}
                >
                  Fechar resumo
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {running && (
                <motion.div
                  key="progress"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-2"
                >
                  <Progress value={progressPct} className="h-2" />
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="truncate pr-2">
                      {lote.progress.currentLabel ?? "Preparando..."}
                    </span>
                    <span className="font-mono tabular-nums">{progressPct}%</span>
                  </div>
                </motion.div>
              )}

              {done && lote.result && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex flex-wrap items-center gap-2 rounded-lg border border-success/30 bg-success/5 p-3 text-xs"
                >
                  <CheckCircle2 className="h-4 w-4 text-success" />
                  <span>
                    <strong>{lote.result.totalSucesso}</strong> demonstrativos gerados.
                  </span>
                  {lote.result.totalFalha > 0 && (
                    <Badge
                      variant="outline"
                      className="border-warning/40 bg-warning/10 text-warning"
                    >
                      {lote.result.totalFalha} falhas
                    </Badge>
                  )}
                  <span className="text-muted-foreground">
                    Arquivo: <span className="font-mono">{lote.result.zipFileName}</span>
                  </span>
                </motion.div>
              )}

              {errored && lote.error && (
                <motion.div
                  key="error"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  <div>
                    <p className="font-medium">
                      {lote.error.aborted
                        ? "Geracao cancelada"
                        : "Erro ao gerar demonstrativos"}
                    </p>
                    <p className="text-muted-foreground">{lote.error.message}</p>
                  </div>
                </motion.div>
              )}

              {!running && !done && !errored && lote.meta?.historyError && (
                <motion.div
                  key="history-warning"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[11px] text-muted-foreground"
                >
                  Aviso: corrida nao foi persistida no historico institucional ({lote.meta.historyError}).
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* RIGHT — pre-check meter */}
          <div className="space-y-3 rounded-xl border border-border/60 bg-background/60 p-4 backdrop-blur-sm">
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Pre-checagem
            </p>

            <div className="space-y-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">Unidades cadastradas</span>
                <span className="font-mono text-base font-semibold tabular-nums text-foreground">
                  {totalUnidades}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">Com dados financeiros</span>
                <span className="font-mono text-base font-semibold tabular-nums text-primary">
                  {elegiveisCount}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm">Sem dados financeiros</span>
                <span className="font-mono text-base font-semibold tabular-nums text-muted-foreground">
                  {semDados}
                </span>
              </div>

              <div className="space-y-1.5 pt-1">
                <Progress
                  value={
                    totalUnidades === 0
                      ? 0
                      : Math.round((elegiveisCount / totalUnidades) * 100)
                  }
                  className="h-1.5"
                />
                <p className="text-[10px] text-muted-foreground">
                  {fmtPct(elegiveisCount, totalUnidades)} das unidades aptas a gerar demonstrativos no exercicio {exercicio}.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="primary"
        title={`Gerar ${elegiveisCount} demonstrativos em lote?`}
        description={
          <>
            Sera produzido um arquivo <strong>.zip</strong> contendo um Demonstrativo Basico
            individual para cada unidade com dados financeiros lancados no exercicio{" "}
            <strong>{exercicio}</strong>. A corrida e registrada no historico
            institucional para auditoria.
          </>
        }
        highlight={`${elegiveisCount} de ${totalUnidades} unidades serao processadas`}
        confirmLabel="Iniciar geracao"
        onConfirm={handleConfirm}
      />
    </motion.section>
  );
}
