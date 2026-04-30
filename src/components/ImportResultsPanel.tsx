import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  FileSearch,
} from "lucide-react";

/* ─── Tipos ─── */

export type ImportResultState = "idle" | "success" | "error";

interface ImportError {
  linha: number;
  coluna: string;
  mensagem: string;
}

interface ImportResultsProps {
  state: ImportResultState;
  /** Dados de resumo (para success/error) */
  summary?: {
    totalLidas: number;
    importadas: number;
    erros: number;
    duplicatas: number;
    arquivo?: string;
  };
  /** Erros por linha (para estado error) */
  errors?: ImportError[];
}

/* ─── Componente ─── */

export function ImportResultsPanel({
  state = "idle",
  summary,
  errors,
}: ImportResultsProps) {
  if (state === "idle" || !summary) {
    return (
      <Card className="border-dashed border-border/50 bg-muted/5">
        <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/30 border border-border/40">
            <FileSearch className="h-5 w-5 text-muted-foreground/70" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground/80">
              Nenhuma importação para exibir
            </p>
            <p className="max-w-sm text-xs text-muted-foreground">
              Use o script oficial para importar a BASE.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const errs = errors ?? [];
  const isError = state === "error" || summary.erros > 0;

  return (
    <Card className="border-border/70 overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-md ${
                isError
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success"
              }`}
            >
              {isError ? (
                <AlertTriangle className="h-4 w-4" aria-hidden />
              ) : (
                <CheckCircle2 className="h-4 w-4" aria-hidden />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                {isError ? "Importação com advertências" : "Importação concluída"}
              </CardTitle>
              {summary.arquivo && (
                <p className="mt-0.5 text-xs text-muted-foreground font-mono">
                  {summary.arquivo}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-5 space-y-5">
        {/* Summary grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCell label="Total lidas" value={summary.totalLidas} />
          <SummaryCell
            label="Importadas"
            value={summary.importadas}
            tone="success"
          />
          <SummaryCell
            label="Com erro"
            value={summary.erros}
            tone={summary.erros > 0 ? "warning" : undefined}
          />
          <SummaryCell label="Duplicatas" value={summary.duplicatas} />
        </div>

        {/* Error table */}
        {errs.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Detalhamento de erros
            </p>
            <div className="overflow-hidden rounded-md border border-border/70">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-9 w-20 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Linha
                    </TableHead>
                    <TableHead className="h-9 w-28 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Coluna
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Descrição do erro
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errs.map((err, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs tabular-nums text-warning">
                        {err.linha}
                      </TableCell>
                      <TableCell className="text-xs font-medium">
                        {err.coluna}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {err.mensagem}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Componente auxiliar ─── */

function SummaryCell({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "success" | "warning";
}) {
  const colorClass =
    tone === "success"
      ? "text-success"
      : tone === "warning"
        ? "text-warning"
        : "text-foreground";

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center">
      <p className={`text-2xl font-semibold tabular-nums tracking-tight ${colorClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
