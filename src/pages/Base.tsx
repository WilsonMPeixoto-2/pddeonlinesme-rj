import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Upload, History, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useExercicio } from "@/hooks/useExercicio";
import { BaseUploadZone, type UploadState } from "@/components/BaseUploadZone";
import { ImportResultsPanel, type ImportResultState } from "@/components/ImportResultsPanel";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  parseBaseXlsx,
  importParsedRows,
  type ParseResult,
  type ImportResult,
} from "@/lib/baseImporter";

/* ─── Tipos ─── */

type LogRow = {
  id: string;
  filename: string | null;
  total_rows: number;
  inserted_rows: number;
  updated_rows: number;
  skipped_rows: number;
  status: string;
  created_at: string;
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/* ─── Main component ─── */

export default function Base() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [importResultState, setImportResultState] = useState<ImportResultState>("idle");
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [history, setHistory] = useState<LogRow[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const { exercicio } = useExercicio();
  const { user } = useAuth();

  useEffect(() => {
    if (!pendingFile && uploadState === "selected") setUploadState("idle");
  }, [pendingFile, uploadState]);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from("import_logs")
      .select("id, filename, total_rows, inserted_rows, updated_rows, skipped_rows, status, created_at")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) toast.error(error.message);
    setHistory((data ?? []) as LogRow[]);
    setHistoryLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleFileAccepted = (f: File) => {
    setPendingFile(f);
    setUploadState("selected");
  };

  const runImport = async () => {
    if (!pendingFile || !user) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    setUploadState("validating");
    try {
      const parsed: ParseResult = await parseBaseXlsx(pendingFile);
      if (parsed.rows.length === 0) {
        setUploadState("error");
        setImportResultState("error");
        setImportResult({
          totalRows: 0,
          insertedRows: 0,
          updatedRows: 0,
          skippedRows: 0,
          errors: parsed.errors,
          status: "failed",
        });
        toast.error("Nenhuma linha válida encontrada na BASE.");
        return;
      }
      const result = await importParsedRows(parsed, user.id);
      setImportResult(result);
      setImportResultState(result.status === "failed" ? "error" : "success");
      setUploadState("success");
      if (result.status === "success") {
        toast.success(
          `${result.insertedRows} novas e ${result.updatedRows} atualizadas.`,
        );
      } else if (result.status === "partial") {
        toast.warning(
          `Importado com ${result.errors.length} advertência(s).`,
        );
      } else {
        toast.error("Falha ao importar a BASE.");
      }
      loadHistory();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      setUploadState("error");
      setImportResultState("error");
      toast.error(`Falha ao processar planilha: ${msg}`);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-border/60 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
              Sincronização · Exercício {exercicio}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">Importar / Exportar BASE</h1>
            <p className="text-sm text-muted-foreground">
              Sincronize a base central com o arquivo .xlsx mestre da 4ª CRE.
            </p>
          </div>
        </div>

        {/* Import / Export grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Importar BASE.xlsx
              </CardTitle>
              <CardDescription>
                Lê a aba <span className="font-mono text-xs">BASE</span> e atualiza/insere as 163 unidades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BaseUploadZone
                state={uploadState}
                selectedFile={pendingFile}
                onFileAccepted={handleFileAccepted}
                onClear={() => {
                  setPendingFile(null);
                  setUploadState("idle");
                  setImportResultState("idle");
                  setImportResult(null);
                }}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" /> Exportar BASE atual
              </CardTitle>
              <CardDescription>
                Baixe a versão vigente em .xlsx para revisão offline.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última importação</span>
                  <span className="font-medium">
                    {history[0] ? fmtDate(history[0].created_at) : "—"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Registros atuais</span>
                  <span className="font-medium tabular-nums">
                    {history[0]?.total_rows ?? "—"}
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Exercício</span>
                  <span className="font-medium">{exercicio}</span>
                </div>
              </div>
              <Button
                className="w-full"
                onClick={() => toast.info("Em breve: exportar BASE atual em .xlsx")}
              >
                <Download className="mr-2 h-4 w-4" /> Baixar BASE.xlsx
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Results Panel */}
        {importResult ? (
          <ImportResultsPanel
            state={importResultState}
            summary={{
              totalLidas: importResult.totalRows,
              importadas: importResult.insertedRows + importResult.updatedRows,
              erros: importResult.errors.length,
              duplicatas: 0,
              arquivo: pendingFile?.name,
            }}
            errors={importResult.errors.map((e) => ({
              linha: e.rowIndex,
              coluna: e.field,
              mensagem: e.message,
            }))}
          />
        ) : (
          <ImportResultsPanel state="idle" />
        )}

        {/* Import History */}
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <History className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <CardTitle className="text-base font-semibold">Histórico de importações</CardTitle>
                  <CardDescription>
                    Registros reais salvos no Supabase ({history.length}).
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] border-success/40 bg-success/5 text-success shrink-0"
              >
                <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-success" />
                Conectado
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Data
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Arquivo
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Total
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Inseridas
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Atualizadas
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Status
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-xs text-muted-foreground">
                        Carregando…
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-10 text-center text-xs text-muted-foreground">
                        Nenhuma importação ainda. Envie a BASE.xlsx acima para começar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((h) => (
                      <TableRow key={h.id}>
                        <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                          {fmtDate(h.created_at)}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-foreground">
                          {h.filename ?? "—"}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums">
                          {h.total_rows}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-success">
                          {h.inserted_rows}
                        </TableCell>
                        <TableCell className="text-right text-xs tabular-nums text-primary">
                          {h.updated_rows}
                        </TableCell>
                        <TableCell className="text-xs">
                          {h.status === "success" ? (
                            <span className="inline-flex items-center gap-1 text-success">
                              <CheckCircle2 className="h-3 w-3" />
                              Sucesso
                            </span>
                          ) : h.status === "partial" ? (
                            <span className="inline-flex items-center gap-1 text-warning">
                              <AlertTriangle className="h-3 w-3" />
                              Parcial
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-destructive">
                              <AlertTriangle className="h-3 w-3" />
                              Falha
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingFile) && uploadState === "selected"}
        onOpenChange={(o) => {
          if (!o) {
            setPendingFile(null);
            setUploadState("idle");
          }
        }}
        tone="destructive"
        title="Importar e atualizar a BASE?"
        description={
          <>
            Esta ação irá <strong>inserir as escolas novas e atualizar as existentes</strong> com base
            no conteúdo da aba <span className="font-mono">BASE</span> da planilha enviada.
            O histórico fica registrado para auditoria.
          </>
        }
        highlight={pendingFile?.name}
        confirmLabel="Importar BASE"
        onConfirm={runImport}
      />
    </AppLayout>
  );
}
