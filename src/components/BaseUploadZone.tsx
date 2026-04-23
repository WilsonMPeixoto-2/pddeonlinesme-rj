import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  XCircle,
  FileWarning,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type UploadState =
  | "idle"
  | "dragOver"
  | "supportedHover"
  | "unsupportedHover"
  | "selected"
  | "validating"
  | "success"
  | "error";

export interface BaseUploadZoneProps {
  onFileAccepted: (file: File) => void;
  state?: UploadState;
  selectedFile?: File | null;
  errorMessage?: string;
  onClear?: () => void;
  className?: string;
}

const ACCEPTED_EXT = ".xlsx";
const ACCEPTED_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

function isSupported(file: File | DataTransferItem) {
  if ("type" in file && file.type) {
    if (file.type === ACCEPTED_MIME) return true;
  }
  if ("name" in file && typeof (file as File).name === "string") {
    return (file as File).name.toLowerCase().endsWith(ACCEPTED_EXT);
  }
  return false;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function BaseUploadZone({
  onFileAccepted,
  state: controlledState,
  selectedFile,
  errorMessage,
  onClear,
  className,
}: BaseUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalState, setInternalState] = useState<UploadState>("idle");
  const [dragSupported, setDragSupported] = useState<boolean | null>(null);
  const dragCounter = useRef(0);

  const state: UploadState = controlledState ?? internalState;

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const f = files[0];
      if (!isSupported(f)) {
        setInternalState("error");
        return;
      }
      setInternalState("selected");
      onFileAccepted(f);
    },
    [onFileAccepted],
  );

  const onDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    const items = Array.from(e.dataTransfer.items ?? []);
    const supported =
      items.length > 0 &&
      items.every((it) => {
        // Best-effort: check by type or by filename via getAsFile (not always available on dragenter)
        if (it.kind !== "file") return false;
        if (it.type === ACCEPTED_MIME) return true;
        // Some browsers don't expose name on dragenter, fallback to true and re-check on drop
        return true;
      });
    setDragSupported(supported);
    setInternalState(supported ? "supportedHover" : "unsupportedHover");
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDragSupported(null);
      setInternalState("idle");
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setDragSupported(null);
    handleFiles(e.dataTransfer.files);
  };

  const reset = () => {
    setInternalState("idle");
    if (inputRef.current) inputRef.current.value = "";
    onClear?.();
  };

  // ----- State-driven visuals -----
  const isInteractive =
    state === "idle" ||
    state === "dragOver" ||
    state === "supportedHover" ||
    state === "unsupportedHover";

  const toneClasses = (() => {
    switch (state) {
      case "supportedHover":
      case "dragOver":
        return "border-primary bg-primary/5 ring-2 ring-primary/30 ring-offset-2 ring-offset-background";
      case "unsupportedHover":
      case "error":
        return "border-destructive/70 bg-destructive/5 ring-2 ring-destructive/25 ring-offset-2 ring-offset-background";
      case "success":
        return "border-success/70 bg-success/5";
      case "selected":
      case "validating":
        return "border-primary/60 bg-primary/[0.03]";
      default:
        return "border-border/70 hover:border-primary/50 hover:bg-muted/30";
    }
  })();

  return (
    <div className={cn("space-y-3", className)}>
      <div
        role="button"
        tabIndex={isInteractive ? 0 : -1}
        aria-label="Selecionar arquivo BASE.xlsx"
        aria-disabled={!isInteractive}
        onClick={() => isInteractive && openPicker()}
        onKeyDown={(e) => {
          if (!isInteractive) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={isInteractive ? onDragEnter : undefined}
        onDragOver={isInteractive ? onDragOver : undefined}
        onDragLeave={isInteractive ? onDragLeave : undefined}
        onDrop={isInteractive ? onDrop : undefined}
        className={cn(
          "group relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-6 py-10 text-center transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          isInteractive ? "cursor-pointer" : "cursor-default",
          toneClasses,
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXT}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <UploadIcon state={state} />

        <UploadCopy state={state} file={selectedFile} errorMessage={errorMessage} />

        {/* Action row for terminal/active states */}
        {(state === "selected" ||
          state === "success" ||
          state === "error") && (
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {state !== "validating" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  reset();
                }}
              >
                {state === "success" ? "Enviar outro arquivo" : "Cancelar"}
              </Button>
            )}
            {state === "error" && (
              <Button
                type="button"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setInternalState("idle");
                  setTimeout(openPicker, 0);
                }}
              >
                Tentar novamente
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Footer requisitos / segurança */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] font-light tracking-wide text-muted-foreground">
        <div className="inline-flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-primary/70" aria-hidden />
          <span>
            Apenas planilhas <span className="font-medium text-foreground/80">.xlsx</span> oficiais da 4ª CRE
          </span>
        </div>
        <div className="inline-flex items-center gap-1.5">
          <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden />
          <span>Tamanho máximo recomendado: 10 MB</span>
        </div>
      </div>
    </div>
  );
}

// -------- Subcomponents --------

function UploadIcon({ state }: { state: UploadState }) {
  const wrap = "relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-200";
  switch (state) {
    case "supportedHover":
    case "dragOver":
      return (
        <div className={cn(wrap, "bg-primary/15 text-primary shadow-[0_0_24px_hsl(var(--primary)/0.35)]")}>
          <UploadCloud className="h-7 w-7" aria-hidden />
        </div>
      );
    case "unsupportedHover":
      return (
        <div className={cn(wrap, "bg-destructive/15 text-destructive")}>
          <FileWarning className="h-7 w-7" aria-hidden />
        </div>
      );
    case "selected":
      return (
        <div className={cn(wrap, "bg-primary/10 text-primary")}>
          <FileSpreadsheet className="h-7 w-7" aria-hidden />
        </div>
      );
    case "validating":
      return (
        <div className={cn(wrap, "bg-primary/10 text-primary")}>
          <Loader2 className="h-7 w-7 animate-spin" aria-hidden />
        </div>
      );
    case "success":
      return (
        <div className={cn(wrap, "bg-success/15 text-success")}>
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
      );
    case "error":
      return (
        <div className={cn(wrap, "bg-destructive/15 text-destructive")}>
          <XCircle className="h-7 w-7" aria-hidden />
        </div>
      );
    default:
      return (
        <div className={cn(wrap, "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary")}>
          <UploadCloud className="h-7 w-7" aria-hidden />
        </div>
      );
  }
}

function UploadCopy({
  state,
  file,
  errorMessage,
}: {
  state: UploadState;
  file?: File | null;
  errorMessage?: string;
}) {
  switch (state) {
    case "supportedHover":
    case "dragOver":
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-primary">Solte o arquivo para enviar</p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            Detectamos um arquivo compatível com a BASE
          </p>
        </div>
      );
    case "unsupportedHover":
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-destructive">Formato não suportado</p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            Apenas arquivos <span className="font-medium text-foreground">.xlsx</span> são aceitos
          </p>
        </div>
      );
    case "selected":
      return (
        <div className="mt-4 space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Arquivo pronto para envio</p>
          {file && (
            <p className="text-xs font-mono text-muted-foreground">
              <span className="font-medium text-foreground/90">{file.name}</span>
              <span className="mx-1.5 text-border">·</span>
              <span>{formatBytes(file.size)}</span>
            </p>
          )}
        </div>
      );
    case "validating":
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">Validando estrutura da planilha…</p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            Conferindo abas BASE, MEMORIA, Demonstrativo e Conciliação Bancária
          </p>
        </div>
      );
    case "success":
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-success">BASE importada com sucesso</p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            As 163 unidades escolares foram atualizadas
          </p>
        </div>
      );
    case "error":
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-destructive inline-flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
            Não foi possível importar
          </p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            {errorMessage ?? "Verifique se o arquivo é uma BASE.xlsx oficial e tente novamente."}
          </p>
        </div>
      );
    default:
      return (
        <div className="mt-4 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Arraste a <span className="text-primary">BASE.xlsx</span> aqui
          </p>
          <p className="text-xs font-light tracking-wide text-muted-foreground">
            ou <span className="font-medium text-foreground underline decoration-dotted underline-offset-4">clique para selecionar</span> no seu computador
          </p>
        </div>
      );
  }
}
