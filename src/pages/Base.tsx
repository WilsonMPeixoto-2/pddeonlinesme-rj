import { useEffect, useState } from "react";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, History } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/EmptyState";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { BaseUploadZone, type UploadState } from "@/components/BaseUploadZone";

export default function Base() {
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>("idle");

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
        <div className="border-b border-border/60 pb-5">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Sincronização
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Importar / Exportar BASE</h1>
          <p className="text-sm text-muted-foreground">
            Sincronize a base central com o arquivo .xlsx mestre da 4ª CRE.
          </p>
        </div>

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
              <label className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-border/70 py-10 transition hover:bg-muted/40">
                <FileSpreadsheet className="mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm font-medium">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground">ou arraste o arquivo .xlsx aqui</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={handleFileSelected}
                />
              </label>
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
              </div>
              <Button className="w-full" onClick={() => toast.success("Protótipo: BASE.xlsx baixado")}>
                <Download className="mr-2 h-4 w-4" /> Baixar BASE.xlsx
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Histórico de gerações em lote */}
        <Card className="border-border/70">
          <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                <History className="h-4 w-4" aria-hidden />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Histórico de lotes</CardTitle>
                <CardDescription>
                  Registros das últimas gerações em lote (.zip) e importações da BASE.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-5">
            <EmptyState
              icon={History}
              title="Nenhuma geração em lote registrada"
              description="Quando você gerar demonstrativos em lote ou importar uma nova BASE, o histórico aparecerá aqui."
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(pendingFile)}
        onOpenChange={(o) => !o && setPendingFile(null)}
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
          toast.success("Protótipo: arquivo seria validado e importado");
          setPendingFile(null);
        }}
      />
    </AppLayout>
  );
}
