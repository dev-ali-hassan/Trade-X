import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  trend: string;
  trendDirection?: "up" | "down";
  sparkline: number[];
  tone?: "profit" | "loss" | "ai" | "neutral";
  loading?: boolean;
};

const tones = {
  profit: "text-profit bg-profit/10",
  loss: "text-loss bg-loss/10",
  ai: "text-ai bg-ai/10",
  neutral: "text-slate-300 bg-white/5"
};

export function StatCard({
  label,
  value,
  helper,
  icon: Icon,
  trend,
  trendDirection = "up",
  sparkline,
  tone = "neutral",
  loading = false
}: StatCardProps) {
  if (loading) {
    return (
      <div className="panel p-4">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton mt-4 h-8 w-28" />
        <div className="skeleton mt-5 h-10 w-full" />
      </div>
    );
  }

  return (
    <div className="panel group overflow-hidden p-4 hover:-translate-y-0.5 hover:border-ai/40">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={`grid h-10 w-10 place-items-center rounded-lg ${tones[tone]}`}>
          <Icon size={19} />
        </div>
      </div>
      <Sparkline data={sparkline} tone={tone} />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-slate-500">{helper}</span>
        <span className={`shrink-0 ${trendDirection === "up" ? "text-profit" : "text-loss"}`}>
          {trendDirection === "up" ? "▲" : "▼"} {trend}
        </span>
      </div>
    </div>
  );
}

function Sparkline({ data, tone }: { data: number[]; tone: StatCardProps["tone"] }) {
  const width = 180;
  const height = 36;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = Math.max(1, max - min);
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(" ");
  const stroke = tone === "loss" ? "#ef4444" : tone === "ai" ? "#d6a63a" : "#22c55e";

  return (
    <svg className="mt-4 hidden h-9 w-full max-w-[220px] opacity-90 transition group-hover:opacity-100 sm:block" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
