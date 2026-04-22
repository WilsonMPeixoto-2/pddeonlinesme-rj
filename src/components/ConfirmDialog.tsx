import { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  /** Detalhe destacado opcional (ex: nome do item afetado). */
  highlight?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** "destructive" (padrão) usa cores de alerta. "primary" para confirmações neutras. */
  tone?: "destructive" | "primary";
  loading?: boolean;
  onConfirm: () => void | Promise<void>;
};

/**
 * Modal de confirmação padronizado para ações destrutivas
 * (excluir usuário, sobrescrever BASE, gerar lote, etc.).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  highlight,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  tone = "destructive",
  loading = false,
  onConfirm,
}: ConfirmDialogProps) {
  const isDestructive = tone === "destructive";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                isDestructive ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
              )}
              aria-hidden
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1.5">
              <AlertDialogTitle className="text-base">{title}</AlertDialogTitle>
              <AlertDialogDescription className="text-sm leading-relaxed">
                {description}
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        {highlight && (
          <div
            className={cn(
              "rounded-md border px-3 py-2 text-sm font-medium",
              isDestructive
                ? "border-destructive/30 bg-destructive/5 text-destructive"
                : "border-primary/30 bg-primary/5 text-primary",
            )}
          >
            {highlight}
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              void onConfirm();
            }}
            className={cn(
              isDestructive &&
                buttonVariants({ variant: "destructive" }),
            )}
          >
            {loading ? "Processando…" : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
