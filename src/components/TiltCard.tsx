import { useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt in degrees (default 4) */
  maxTilt?: number;
  /** Glow intensity 0-1 (default 0.15) */
  glowIntensity?: number;
}

/**
 * Wraps children in a card with subtle 3D tilt + glow on mouse hover.
 * Uses CSS transforms only — no extra dependencies.
 */
export function TiltCard({
  children,
  className,
  maxTilt = 4,
  glowIntensity = 0.15,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const rotateX = (0.5 - y) * maxTilt;
    const rotateY = (x - 0.5) * maxTilt;
    setStyle({
      transform: `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`,
      boxShadow: `${(x - 0.5) * 20}px ${(y - 0.5) * 20}px 40px hsl(var(--primary) / ${glowIntensity})`,
    });
  };

  const handleLeave = () => {
    setStyle({
      transform: "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)",
      boxShadow: "none",
    });
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      style={{
        ...style,
        transition: "transform 0.2s ease-out, box-shadow 0.3s ease-out",
        willChange: "transform",
      }}
      className={cn("rounded-xl", className)}
    >
      {children}
    </div>
  );
}
