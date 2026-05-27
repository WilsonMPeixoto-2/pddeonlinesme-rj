import { useMemo, useState, type DragEvent } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Loader2,
  Upload,
  XCircle,
  ArrowRight,
  RefreshCw,
  ListChecks,
} from "lucide-react";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useBulkUpdate } from "@/hooks/useBulkUpdate";
import { cn } from "@/lib/utils";
import type {
  BulkUpdateAllowedKey,
  BulkUpdatePreviewItem,
  BulkUpdateRowStatus,
} from "@/lib/bulk-update/types";
import { useNavigate } from "react-router-dom";

const KEY_LABEL: Record<BulkUpdateAllowedKey, string> = {
  designacao: "Designação",
  inep: "INEP",
  cnpj: "CNPJ",
};

const FIELD_LABEL: Record<string, string> = {
  diretor: "Diretor",
  email: "E-mail",
  endereco: "Endereço",
};

const STATUS_META: Record<
  BulkUpdateRowStatus,
  { label: string; tone: string }
> = {
  ready: {
    label: "Alterar",
    tone: "text-primary border-primary/30 bg-primary/10",
  },
  unchanged: {
    label: "Sem alteração",
    tone: "text-muted-foreground border-border/60 bg-muted/30",
  },
  error_not_found: {
    label: "Não localizada",
    tone: "text-destructive border-destructive/30 bg-destructive/10",
  },
  error_duplicate_key: {
    label: "Chave duplicada",
    tone: "text-destructive border-destructive/30 bg-destructive/10",
  },
  error_ambiguous: {
    label: "Ambígua",
    tone: "text-destructive border-destructive/30 bg-destructive/10",
  },
  error_key_mismatch: {
    label: "Chaves divergentes",
    tone: "text-warning border-warning/30 bg-warning/10",
  },
  error_empty_value: {
    label: "Valor vazio",
    tone: "text-warning border-warning/30 bg-warning/10",
  },
};

function StatusBadge({ status }: { status: BulkUpdateRowStatus }) {
  const meta = STATUS_META[status];
  return (
    <Badge variant="outline" className={cn("h-5 px-1.5 text-[10px]", meta.tone)}>
      {meta.label}
    </Badge>
  );
}

export function BulkUpdatePanel() {
  const { state, acceptFile, chooseKey, apply, reset } = useBulkUpdate();
  const [dragging, setDragging] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const readyCount = state.preview?.summary.readyCount ?? 0;
  const totalRows = state.preview?.summary.totalRows ?? 0;
  const unchangedCount = state.preview?.summary.unchangedCount ?? 0;
  const errorCount = state.preview?.summary.errorCount ?? 0;

  const previewField = state.preview?.items[0]?.field ?? "diretor";
  const fieldLabel = FIELD_LABEL[previewField] ?? "Diretor";

  const recognizedSummary = useMemo(
    () =>
      state.recognizedColumns.map((c) => ({
        rawHeader: c.rawHeader,
        recognizedAs: c.recognizedAs,
      })),
    [state.recognizedColumns],
  );

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await acceptFile(file);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await acceptFile(file);
    e.target.value = "";
  };

  const handleApply = async () => {
    setConfirmOpen(false);
    await apply();
    if (state.phase !== "error") {
      toast.success(
        `Atualizações aplicadas com sucesso.`,
        { description: `${readyCount} unidades alteradas.` },
      );
    }
  };

  return (
    <Card className="border-border/70">
      <CardHeader className="border-b border-border/60 bg-muted/20 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
            <ListChecks className="h-4 w-4" aria-hidden />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              Atualizar dados em lote
            </CardTitle>
            <CardDescription>
              Envie uma planilha parcial para corrigir campos específicos da BASE
              sem substituir a base inteira.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-5">
        <p className="rounded-md border border-dashed border-border/60 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
          Use esta área para atualizações parciais, como troca de diretores. A
          planilha deve conter uma chave da unidade, como INEP ou designação, e
          apenas os campos que serão alterados.{" "}
          <strong className="text-foreground">
            Campos ausentes não serão apagados.
          </strong>{" "}
          Nesta versão, os campos <code>diretor</code>, <code>email</code> e <code>endereco</code> são alteráveis. Limite:
          200 linhas.
        </p>

        {/* PASSO 1 — UPLOAD */}
        {state.phase === "idle" && (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={cn(
              "flex flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border/60 bg-muted/10",
            )}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Upload className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Arraste a planilha aqui</p>
              <p className="text-xs text-muted-foreground">
                Aceita <span className="font-mono">.xlsx</span> ou{" "}
                <span className="font-mono">.csv</span> · até 200 linhas
              </p>
            </div>
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.csv"
                className="sr-only"
                onChange={handleFileInput}
              />
              <span className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                Selecionar arquivo
              </span>
            </label>
          </div>
        )}

        {/* PARSING */}
        {state.phase === "parsing" && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Lendo planilha…
          </div>
        )}

        {/* PASSO 2 — MAPPING (quando há múltiplas chaves) */}
        {state.phase === "mapping_required" && state.parsed && (
          <div className="space-y-4 rounded-md border border-border/60 bg-muted/10 p-4">
            <p className="text-sm font-medium">
              <FileSpreadsheet className="mr-1.5 inline h-4 w-4 text-primary" />
              {state.parsed.totalRows} linhas lidas · escolha a chave de identificação
            </p>

            <div className="rounded-md border border-border/60 bg-background/60 p-3">
              <p className="mb-2 text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Colunas reconhecidas
              </p>
              <ul className="space-y-1 text-xs">
                {recognizedSummary.map((c) => (
                  <li key={c.rawHeader} className="flex items-center justify-between">
                    <span className="font-mono">{c.rawHeader}</span>
                    <span
                      className={cn(
                        "rounded px-1.5 py-0.5 text-[10px]",
                        c.recognizedAs === "ignored"
                          ? "bg-muted/40 text-muted-foreground"
                          : "bg-primary/10 text-primary",
                      )}
                    >
                      {c.recognizedAs === "ignored"
                        ? "Ignorar"
                        : c.recognizedAs === "diretor" || c.recognizedAs === "email" || c.recognizedAs === "endereco"
                          ? `Campo: ${FIELD_LABEL[c.recognizedAs].toLowerCase()}`
                          : `Chave: ${KEY_LABEL[c.recognizedAs]}`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <label className="text-xs font-medium">
                  Chave de identificação da unidade
                </label>
                <Select
                  value={state.chosenKey ?? ""}
                  onValueChange={(v) => chooseKey(v as BulkUpdateAllowedKey)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Escolha a chave…" />
                  </SelectTrigger>
                  <SelectContent>
                    {state.availableKeys.map((k) => (
                      <SelectItem key={k} value={k}>
                        {KEY_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="ghost" size="sm" onClick={reset} className="h-10">
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {/* PREVIEW LOADING */}
        {state.phase === "preview_loading" && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-border/60 bg-muted/20 p-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Comparando com a BASE…
          </div>
        )}

        {/* PASSO 3 — PREVIEW */}
        {state.phase === "preview_ready" && state.preview && (
          <div className="space-y-4">
            {state.preview.blockingErrors.length > 0 && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="mb-1 flex items-center gap-2 text-sm font-medium text-destructive">
                  <XCircle className="h-4 w-4" />
                  Não foi possível gerar a prévia
                </p>
                <ul className="ml-6 list-disc space-y-1 text-xs text-muted-foreground">
                  {state.preview.blockingErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-3"
                  onClick={reset}
                >
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                  Tentar outro arquivo
                </Button>
              </div>
            )}

            {state.preview.items.length > 0 && (
              <>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
                    {readyCount} para alterar
                  </Badge>
                  <Badge variant="outline" className="border-border/60 bg-muted/30 text-muted-foreground">
                    {unchangedCount} sem alteração
                  </Badge>
                  {errorCount > 0 && (
                    <Badge variant="outline" className="border-warning/40 bg-warning/10 text-warning">
                      {errorCount} com erro
                    </Badge>
                  )}
                  <Badge variant="outline" className="border-border/60 bg-background/60 text-muted-foreground">
                    Chave: {state.chosenKey ? KEY_LABEL[state.chosenKey] : "—"}
                  </Badge>
                  <span className="ml-auto text-[10px] text-muted-foreground/80 font-mono">
                    {state.fileName}
                  </span>
                </div>

                <div className="max-h-[420px] overflow-auto rounded-md border border-border/70">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/60 backdrop-blur">
                      <TableRow>
                        <TableHead className="h-9 w-10 text-[10px] uppercase tracking-wide">#</TableHead>
                        <TableHead className="h-9 text-[10px] uppercase tracking-wide">
                          Unidade
                        </TableHead>
                        <TableHead className="h-9 text-[10px] uppercase tracking-wide">
                          {fieldLabel} atual
                        </TableHead>
                        <TableHead className="h-9 text-[10px] uppercase tracking-wide">
                          Novo {fieldLabel.toLowerCase()}
                        </TableHead>
                        <TableHead className="h-9 text-right text-[10px] uppercase tracking-wide">
                          Status
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.preview.items.map((item) => (
                        <PreviewRow key={item.rowNumber} item={item} />
                      ))}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                    Trocar arquivo
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    disabled={readyCount === 0}
                  >
                    Aplicar {readyCount} alteraç{readyCount === 1 ? "ão" : "ões"}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* APPLYING */}
        {state.phase === "applying" && (
          <div className="flex items-center justify-center gap-2 rounded-md border border-primary/30 bg-primary/5 p-6 text-sm text-primary">
            <Loader2 className="h-4 w-4 animate-spin" />
            Aplicando alterações…
          </div>
        )}

        {/* PASSO 5 — RESULT */}
        {state.phase === "done" && state.applyResult && (
          <div className="space-y-4 rounded-md border border-success/30 bg-success/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-success" />
              <div className="space-y-1">
                <p className="text-sm font-semibold">
                  Atualização concluída
                </p>
                <p className="text-xs text-muted-foreground">
                  {state.applyResult.applied} unidades alteradas
                  {state.applyResult.skipped > 0 &&
                    ` · ${state.applyResult.skipped} sem alteração`}
                  {state.applyResult.errors > 0 &&
                    ` · ${state.applyResult.errors} com erro`}
                </p>
              </div>
            </div>

            {state.affectedUnitIds.length > 0 && (
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="mb-2 text-sm font-medium">
                  Demonstrativos afetados
                </p>
                <p className="mb-3 text-xs text-muted-foreground">
                  Os Demonstrativos Básicos de{" "}
                  <strong>{state.affectedUnitIds.length}</strong> unidades podem
                  estar desatualizados após a alteração de diretor(a).
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="h-8"
                >
                  Abrir Painel para regenerar
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
                <p className="mt-2 text-[10px] text-muted-foreground/80">
                  A regeneração não é automática. Use o card "Central
                  Documental" no Painel para gerar novamente.
                </p>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="ghost" size="sm" onClick={reset}>
                Fazer nova atualização
              </Button>
            </div>
          </div>
        )}

        {/* ERROR */}
        {state.phase === "error" && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-semibold text-destructive">
                Não foi possível concluir
              </p>
              <p className="text-xs text-muted-foreground">
                {state.errorMessage ?? "Erro desconhecido."}
              </p>
              <Button variant="ghost" size="sm" className="mt-2 h-8" onClick={reset}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                Tentar novamente
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        tone="primary"
        title="Confirmar atualização em lote?"
        description={
          <>
            Esta ação alterará o cadastro de <strong>{readyCount}</strong>{" "}
            unidades escolares. A operação será registrada com usuário, data,
            arquivo, valores anteriores e novos valores.
          </>
        }
        highlight={`${readyCount} de ${totalRows} linhas serão aplicadas`}
        confirmLabel="Aplicar agora"
        onConfirm={handleApply}
      />
    </Card>
  );
}

function PreviewRow({ item }: { item: BulkUpdatePreviewItem }) {
  const rowTone =
    item.status === "ready"
      ? ""
      : item.status === "unchanged"
        ? "opacity-60"
        : item.status.startsWith("error")
          ? "bg-destructive/[0.04]"
          : "";

  return (
    <TableRow className={cn("text-xs", rowTone)}>
      <TableCell className="py-2 font-mono text-[10px] text-muted-foreground tabular-nums">
        {item.rowNumber}
      </TableCell>
      <TableCell className="py-2">
        <div className="space-y-0.5">
          <p className="truncate text-xs font-medium">
            {item.designacao ?? (
              <span className="text-muted-foreground italic">
                {item.keyValue || "—"}
              </span>
            )}
          </p>
          {item.message && (
            <p className="text-[10px] text-muted-foreground">{item.message}</p>
          )}
        </div>
      </TableCell>
      <TableCell className="py-2 text-muted-foreground">
        {item.oldValue || <span className="italic opacity-60">—</span>}
      </TableCell>
      <TableCell className="py-2 font-medium">
        {item.newValue || <span className="italic text-muted-foreground">—</span>}
      </TableCell>
      <TableCell className="py-2 text-right">
        <StatusBadge status={item.status} />
      </TableCell>
    </TableRow>
  );
}
