import type { LucideIcon } from "lucide-react";
import { ArrowUpRight } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "violet" | "muted";

const toneStyles: Record<Tone, { icon: string; accent: string; progress: string }> = {
  primary: {
    icon: "bg-primary/10 text-primary ring-primary/20",
    accent: "from-primary/18 via-primary/5 to-transparent",
    progress: "bg-primary",
  },
  success: {
    icon: "bg-success/10 text-success ring-success/20",
    accent: "from-success/16 via-success/5 to-transparent",
    progress: "bg-success",
  },
  warning: {
    icon: "bg-warning/10 text-warning ring-warning/20",
    accent: "from-warning/16 via-warning/5 to-transparent",
    progress: "bg-warning",
  },
  violet: {
    icon: "bg-violet-500/10 text-violet-700 ring-violet-500/20 dark:text-violet-300",
    accent: "from-violet-500/16 via-violet-500/5 to-transparent",
    progress: "bg-violet-500",
  },
  muted: {
    icon: "bg-muted text-muted-foreground ring-border/60",
    accent: "from-muted/60 via-muted/15 to-transparent",
    progress: "bg-muted-foreground/60",
  },
};

export interface ExecutiveKpiProps {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
  progress?: number | null;
  onClick?: () => void;
  loading?: boolean;
}

export function ExecutiveKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = "primary",
  progress = null,
  onClick,
  loading = false,
}: ExecutiveKpiProps) {
  const styles = toneStyles[tone];
  const content = (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border-border/60 bg-card/80 shadow-ds-sm transition-all duration-200",
        onClick && "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-ds-md",
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b opacity-70",
          styles.accent,
        )}
      />
      <CardContent className="relative flex h-full min-h-[148px] flex-col p-4.5 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {label}
          </p>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1",
              styles.icon,
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>

        <div className="mt-auto pt-4">
          <div className="flex items-end justify-between gap-3">
            <p
              className={cn(
                "text-[1.7rem] font-semibold leading-none tracking-[-0.035em] text-foreground tabular-nums sm:text-[1.9rem]",
                loading && "animate-pulse text-muted-foreground/30",
              )}
            >
              {loading ? "•••" : value}
            </p>
            {onClick ? (
              <ArrowUpRight
                className="mb-0.5 h-4 w-4 shrink-0 text-muted-foreground/45 transition-colors group-hover:text-primary"
                aria-hidden="true"
              />
            ) : null}
          </div>

          <p className="mt-2 min-h-8 text-[11px] leading-4 text-muted-foreground">{detail}</p>

          {progress !== null ? (
            <div className="mt-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-muted/70">
                <div
                  className={cn("h-full rounded-full transition-[width] duration-500", styles.progress)}
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
              <p className="mt-1.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {progress.toFixed(progress >= 99.95 ? 0 : 1)}%
              </p>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );

  if (!onClick) return content;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block h-full w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      {content}
    </button>
  );
}
