import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumberInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onChange: (value: number) => void;
  error?: string;
  min?: number;
  max?: number;
};

/**
 * Input numérico inteiro com formatação por milhar (pt-BR) e estado de erro.
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, error, min, max, className, onBlur, onFocus, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [draft, setDraft] = React.useState<string>("");

    const display = React.useMemo(() => {
      if (focused) return draft;
      const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
      return n.toLocaleString("pt-BR");
    }, [focused, draft, value]);

    return (
      <div className="space-y-1">
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          value={display}
          onFocus={(e) => {
            setFocused(true);
            const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
            setDraft(n === 0 ? "" : String(n));
            onFocus?.(e);
          }}
          onChange={(e) => setDraft(e.target.value.replace(/[^\d-]/g, ""))}
          onBlur={(e) => {
            setFocused(false);
            let n = parseInt(draft, 10);
            if (!Number.isFinite(n)) n = 0;
            if (typeof min === "number" && n < min) n = min;
            if (typeof max === "number" && n > max) n = max;
            onChange(n);
            onBlur?.(e);
          }}
          className={cn(
            "text-right tabular-nums",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        />
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
NumberInput.displayName = "NumberInput";
