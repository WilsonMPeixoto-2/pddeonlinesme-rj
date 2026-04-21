import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

export default function Base() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Importar / Exportar BASE</h1>
          <p className="text-sm text-muted-foreground">
            Sincronize a base central com o arquivo .xlsx mestre da 4ª CRE.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Upload className="h-4 w-4 text-primary" /> Importar BASE.xlsx
              </CardTitle>
              <CardDescription>
                Substitui os dados das 163 unidades escolares pela versão enviada.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md py-10 cursor-pointer hover:bg-muted/40 transition">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Clique para selecionar</p>
                <p className="text-xs text-muted-foreground">ou arraste o arquivo .xlsx aqui</p>
                <input
                  type="file"
                  accept=".xlsx"
                  className="hidden"
                  onChange={() => toast.info("Protótipo: arquivo seria validado e importado")}
                />
              </label>
            </CardContent>
          </Card>

          <Card>
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
                <div className="flex justify-between mt-1">
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
      </div>
    </AppLayout>
  );
}
