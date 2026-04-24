import { Area, AreaChart, ResponsiveContainer } from "recharts";

type Props = {
  data: number[];
  tone?: "primary" | "success" | "warning" | "destructive";
  height?: number;
};

const toneToVar: Record<NonNullable<Props["tone"]>, string> = {
  primary: "hsl(var(--primary))",
  success: "hsl(var(--success))",
  warning: "hsl(var(--warning))",
  destructive: "hsl(var(--destructive))",
};

/**
 * Minimal area sparkline — no axes, no tooltip. Pure visual signal.
 */
export function MiniSparkline({ data, tone = "primary", height = 36 }: Props) {
  const color = toneToVar[tone];
  const id = `spark-${tone}`;
  const series = data.map((v, i) => ({ i, v }));

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${id})`}
            isAnimationActive
            animationDuration={900}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
