import logo from "@/assets/logo-4cre.png";
import { cn } from "@/lib/utils";

interface BrandMarkProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export default function BrandMark({ size = 28, className, glow = false }: BrandMarkProps) {
  return (
    <img
      src={logo}
      alt="4ª CRE · SME-RJ"
      width={size}
      height={size}
      className={cn(
        "rounded-full object-cover ring-1 ring-primary/30",
        glow && "drop-shadow-[0_0_12px_hsl(var(--primary)/0.35)] animate-[glow-pulse_3s_ease-in-out_infinite]",
        className
      )}
    />
  );
}
