import * as React from "react";
import { IMaskInput } from "react-imask";

import { cn } from "@/lib/utils";

export const masks = {
  cnpj: "00.000.000/0000-00",
  cpf: "000.000.000-00",
  cep: "00000-000",
  phoneBR: "(00) 00000-0000",
  agencia: "0000",
  conta: "0000000-0",
} as const;

export type MaskPreset = keyof typeof masks;

interface MaskedInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  mask: string | MaskPreset;
  onAccept?: (value: string) => void;
}

const MaskedInput = React.forwardRef<HTMLInputElement, MaskedInputProps>(
  ({ className, mask, onAccept, ...props }, ref) => {
    const resolved =
      (masks as Record<string, string>)[mask as string] ?? (mask as string);

    return (
      <IMaskInput
        mask={resolved as never}
        inputRef={ref as never}
        onAccept={onAccept as never}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        {...(props as never)}
      />
    );
  },
);
MaskedInput.displayName = "MaskedInput";

export { MaskedInput };
