import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Upload, History, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BaseUploadZone, type UploadState } from "@/components/BaseUploadZone";
import { ImportResultsPanel, type ImportResultState } from "@/components/ImportResultsPanel";

/* ─── Dados mockados de histórico ─── */

const MOCK_HISTORY = [
  {
    data: "21/04/2026 09:14",
    arquivo: "BASE_4CRE_2025.xlsx",
    linhas: 163,
    importadas: 161,
    erros: 2,
    usuario: "4cre@sme.rio",
  },
  {
    data: "15/03/2026 14:30",
    arquivo: "BASE_4CRE_2025_v2.xlsx",
    linhas: 163,
    importadas: 163,
    erros: 0,
    usuario: "ana.coord@sme.rio",
  },
  {
    data: "28/02/2026 11:05",
    arquivo: "BASE_4CRE_2025_inicial.xlsx",
    linhas: 160,
    importadas: 160,
    erros: 0,
    usuario: "4cre@sme.rio",
  },
];

/* ─── Main component ─── */

export default function Base() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [importResultState, setImportResultState] = useState<ImportResultState>("idle");
  const [exercicio, setExercicio] = useState("2026");

  // Reset to idle if user dismisses confirm without confirming
  useEffect(() => {
    if (!pendingFile && uploadState === "selected") {
      setUploadState("idle");
    }
  }, [pendingFile, uploadState]);

  const handleFileAccepted = (f: File) => {
    setPendingFile(f);
    setUploadState("selected");
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
          <Select value={exercicio} onValueChange={setExercicio}>
            <SelectTrigger className="h-9 w-[100px]">
              <CalendarDays className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Import / Export grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Importar BASE.xlsx
              </CardTitle>
              <CardDescription>
                Substitui os dados das 163 unidades escolares pela versão enviada.
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
                  <span className="text-muted-foreground">Última atualização</span>
                  <span className="font-medium">21/04/2026 09:14</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Atualizada por</span>
                  <span className="font-medium">4cre@sme.rio</span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-muted-foreground">Exercício</span>
                  <span className="font-medium">{exercicio}</span>
                </div>
              </div>
              <Button className="w-full" onClick={() => toast.success("Protótipo: BASE.xlsx baixado")}>
                <Download className="mr-2 h-4 w-4" /> Baixar BASE.xlsx
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Import Results Panel */}
        <ImportResultsPanel state={importResultState} />

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
                    Registros das importações anteriores da BASE.
                  </CardDescription>
                </div>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] bg-background/40 backdrop-blur-sm border-border/50 text-muted-foreground shrink-0"
              >
                Dados de demonstração
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
                      Linhas
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Importadas
                    </TableHead>
                    <TableHead className="h-9 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Erros
                    </TableHead>
                    <TableHead className="h-9 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Usuário
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {MOCK_HISTORY.map((h, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs tabular-nums text-muted-foreground whitespace-nowrap">
                        {h.data}
                      </TableCell>
                      <TableCell className="text-xs font-mono text-foreground">
                        {h.arquivo}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {h.linhas}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums text-success">
                        {h.importadas}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">
                        {h.erros > 0 ? (
                          <span className="text-warning">{h.erros}</span>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {h.usuario}
                      </TableCell>
                    </TableRow>
                  ))}
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
        title="Sobrescrever a BASE atual?"
        description={
          <>
            Esta ação <strong>substitui integralmente</strong> os dados das 163 unidades
            escolares pela versão contida no arquivo enviado. Os dados atuais não poderão ser
            recuperados automaticamente.
          </>
        }
        highlight={pendingFile?.name}
        confirmLabel="Sobrescrever BASE"
        onConfirm={() => {
          // Simulação visual do fluxo: validando → sucesso
          setUploadState("validating");
          setTimeout(() => {
            setUploadState("success");
            setImportResultState("error"); // show result panel with mock errors
            toast.success("Protótipo: arquivo validado e importado");
          }, 1400);
        }}
      />
    </AppLayout>
  );
}
