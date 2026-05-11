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
        "group flex flex-col items-center justify-center gap-2 text-center transition-all",
        variant === "card" ? "rounded-md border border-dashed border-border/70 bg-muted/20 px-6 py-12" : "py-10",
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-muted/50 to-muted/20 border border-border/50 shadow-sm ring-4 ring-background/50 transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
        <Icon className="h-6 w-6 text-foreground/60 transition-colors duration-300 group-hover:text-primary/80" aria-hidden />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
