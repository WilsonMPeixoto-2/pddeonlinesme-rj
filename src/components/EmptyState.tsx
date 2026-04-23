import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** "card" = padding generoso para placeholders de página; "inline" = compacto (linhas de tabela). */
  variant?: "card" | "inline";
};

/**
 * Estado vazio institucional reutilizável.
 * Use em tabelas, listas e seções sem dados.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "card",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        variant === "card" ? "rounded-md border border-dashed border-border/70 bg-muted/20 px-6 py-12" : "py-10",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/30 border border-border/50 shadow-sm">
        <Icon className="h-6 w-6 text-foreground/70" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
