import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CurrencyInputProps = Omit<React.ComponentProps<"input">, "value" | "onChange" | "type"> & {
  value: number | null | undefined;
  onChange: (value: number) => void;
  /** Mensagem de erro exibida abaixo do input. Se presente, ativa estilo de erro. */
  error?: string;
  /** Permite valores negativos. Padrão: false. */
  allowNegative?: boolean;
};

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

/**
 * Input com máscara visual de moeda BRL (R$ 0,00).
 * O valor armazenado é sempre `number` em reais (não centavos).
 */
export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ value, onChange, error, allowNegative = false, className, onBlur, onFocus, ...props }, ref) => {
    const [focused, setFocused] = React.useState(false);
    const [draft, setDraft] = React.useState<string>("");

    const display = React.useMemo(() => {
      if (focused) return draft;
      const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
      return formatBRL(n);
    }, [focused, draft, value]);

    const parse = (raw: string): number => {
      // Aceita "1.234,56" ou "1234.56" ou "1234,56"
      let s = raw.replace(/[^\d,.\-]/g, "");
      if (!allowNegative) s = s.replace(/-/g, "");
      // Se tiver vírgula, assume formato BR: remove pontos (milhar) e troca vírgula por ponto.
      if (s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
      }
      const n = parseFloat(s);
      return Number.isFinite(n) ? n : 0;
    };

    return (
      <div className="space-y-1">
        <div className="relative">
          <span
            className={cn(
              "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium",
              error ? "text-destructive" : "text-muted-foreground",
            )}
            aria-hidden
          >
            R$
          </span>
          <Input
            ref={ref}
            type="text"
            inputMode="decimal"
            value={display}
            onFocus={(e) => {
              setFocused(true);
              const n = typeof value === "number" && !Number.isNaN(value) ? value : 0;
              setDraft(n === 0 ? "" : n.toString().replace(".", ","));
              onFocus?.(e);
            }}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={(e) => {
              setFocused(false);
              const parsed = parse(draft);
              onChange(parsed);
              onBlur?.(e);
            }}
            className={cn(
              "pl-9 text-right tabular-nums",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
CurrencyInput.displayName = "CurrencyInput";
