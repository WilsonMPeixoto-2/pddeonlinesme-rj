import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, FileSearch, RefreshCw, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useExercicio } from "@/hooks/useExercicio";
import {
  compareExternalFinancialEvidence,
  externalEvidenceReasonLabel,
  parseExternalFinancialEvidence,
  type ExternalEvidenceComparison,
} from "@/lib/financialExternalEvidence";
import { repassesFinanceirosOptions } from "@/lib/queryKeys";

const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function FinancialExternalEvidenceComparator() {
  const { exercicio } = useExercicio();
  const exercise = Number(exercicio);
  const repassesQuery = useQuery(repassesFinanceirosOptions(exercise));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [comparison, setComparison] = useState<ExternalEvidenceComparison | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async (file: File) => {
    setProcessing(true);
    setError(null);
    setFileName(file.name);
    setComparison(null);
    try {
      const evidence = await parseExternalFinancialEvidence(file);
      const refreshed = await repassesQuery.refetch();
      if (refreshed.error) throw refreshed.error;
      setComparison(compareExternalFinancialEvidence(evidence, refreshed.data ?? []));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível comparar a evidência financeira.");
    } finally {
      setProcessing(false);
    }
  };

  const hasDivergence = (comparison?.divergences.length ?? 0) > 0;

  return (
    <Card className="border-border/70">
      <CardHeader className="border-b border-border/60 bg-muted/15">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <FileSearch className="h-4 w-4" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-base">Conferir evidência financeira externa</CardTitle>
            <CardDescription className="mt-1">
              Compara uma planilha .xlsx com o 2º ciclo corrente por INEP, ação, parcela e valor.
              O arquivo não sobrescreve a base.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-5">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void analyze(file);
            event.currentTarget.value = "";
          }}
        />

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            variant="outline"
            disabled={processing || repassesQuery.isFetching}
            onClick={() => inputRef.current?.click()}
          >
            {processing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Upload className="mr-2 h-4 w-4" aria-hidden="true" />}
            Selecionar evidência .xlsx
          </Button>
          {fileName ? <span className="text-xs text-muted-foreground">{fileName}</span> : null}
        </div>

        {error ? (
          <div className="rounded-lg border border-destructive/30 bg-destructive/7 p-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {comparison ? (
          <div className={hasDivergence
            ? "rounded-lg border border-destructive/30 bg-destructive/[0.045] p-4"
            : "rounded-lg border border-success/30 bg-success/[0.045] p-4"}
          >
            <div className="flex items-start gap-3">
              {hasDivergence
                ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
                : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden="true" />}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {hasDivergence
                    ? "EVIDÊNCIA EXTERNA DIVERGE DA BASE"
                    : "Evidência externa compatível com a base corrente"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {comparison.evidenceRows} evidências lidas · {comparison.matchedRows} compatíveis · {comparison.divergences.length} divergências.
                  A comparação força antes uma nova leitura do snapshot corrente para não usar cache antigo do navegador.
                </p>
              </div>
            </div>

            {hasDivergence ? (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-xs">
                  <thead>
                    <tr className="border-b border-border/60 text-muted-foreground">
                      <th className="py-2 pr-3">Linha</th>
                      <th className="px-3 py-2">INEP</th>
                      <th className="px-3 py-2">Parcela</th>
                      <th className="px-3 py-2 text-right">Planilha</th>
                      <th className="px-3 py-2 text-right">Base corrente</th>
                      <th className="pl-3 py-2">Divergência</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.divergences.slice(0, 30).map((item) => (
                      <tr key={`${item.rowNumber}-${item.inep}-${item.track}`} className="border-b border-border/35 last:border-0">
                        <td className="py-2 pr-3 tabular-nums">{item.rowNumber}</td>
                        <td className="px-3 py-2 font-mono">{item.inep}</td>
                        <td className="px-3 py-2">{item.track === "REGULAR" ? "2ª Parcela" : "Primeira Infância · P2"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{money.format(item.externalAmount)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{item.currentAmount === null ? "—" : money.format(item.currentAmount)}</td>
                        <td className="pl-3 py-2">{externalEvidenceReasonLabel(item.reason)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {comparison.divergences.length > 30 ? (
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Exibindo as primeiras 30 divergências de {comparison.divergences.length}.
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
