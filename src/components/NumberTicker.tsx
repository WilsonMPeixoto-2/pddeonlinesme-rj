import { useEffect, useRef, useState } from "react";

type Props = {
  value: number;
  duration?: number;
  format?: (n: number) => string;
  className?: string;
};

/**
 * Animated number counter — counts from 0 to `value` over `duration` ms.
 * Uses requestAnimationFrame with an ease-out cubic curve for a polished feel.
 */
export function NumberTicker({
  value,
  duration = 1200,
  format = (n) => n.toLocaleString("pt-BR"),
  className,
}: Props) {
  const [display, setDisplay] = useState(0);
  const startRef = useRef<number | null>(null);
  const fromRef = useRef(0);

  useEffect(() => {
    fromRef.current = display;
    startRef.current = null;
    let raf = 0;
    const step = (ts: number) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(fromRef.current + (value - fromRef.current) * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <span className={className}>{format(display)}</span>;
}
