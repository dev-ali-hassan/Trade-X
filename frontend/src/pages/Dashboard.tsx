import { useNavigate } from "react-router-dom";
import {
  Activity,
  BadgeDollarSign,
  CalendarDays,
  CheckCircle2,
  Info,
  LineChart,
  PieChart,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud
} from "lucide-react";
import type { Trade } from "../data/sampleData";
import { formatMoney, pluralize } from "../lib/format";
import { getSession, getTrades } from "../lib/storage";

export function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const trades = getTrades(session);

  return (
    <div className="space-y-5">
      <WelcomeHero onAddTrade={() => navigate("/add-trade")} onAnalyze={() => navigate("/ai-analysis")} />
      <Overview trades={trades} />
      <section className="grid gap-4 xl:grid-cols-2">
        <WinLossChart trades={trades} />
        <MonthlyPerformance trades={trades} />
      </section>
      <LearningCoach tradeCount={trades.length} trades={trades} />
    </div>
  );
}

function WelcomeHero({ onAddTrade, onAnalyze }: { onAddTrade: () => void; onAnalyze: () => void }) {
  return (
    <section className="panel overflow-hidden p-5 md:p-6">
      <div className="grid gap-5 xl:items-center">
        <div>
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-4 py-1.5 text-sm font-semibold text-ai">
            <Sparkles size={16} />
            Start here
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Welcome to Trade-X</h1>
          <p className="mt-3 max-w-3xl text-base text-slate-400">Build your trading history and let AI analyze your decisions.</p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button className="primary-button" onClick={onAddTrade}>
              <PlusCircle size={18} />
              Add First Trade
            </button>
            <button className="secondary-button" onClick={onAnalyze}>
              <UploadCloud size={18} />
              Analyze Chart With AI
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

function Overview({ trades }: { trades: Trade[] }) {
  const stats = getStats(trades);
  return (
    <section className="panel p-5 md:p-6">
      <SectionHeader title="Trading Overview" text="Based only on your saved trades." />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={Activity} label="Total Trades" value={String(trades.length)} helper={trades.length ? "Saved journal entries" : "Start your first trade journal"} />
        <Card
          icon={LineChart}
          label="Win Rate"
          value={stats.completedTrades ? `${stats.winRate}%` : "--"}
          helper={stats.completedTrades ? "Based on completed trades" : "Need completed trade history"}
          tone="profit"
        />
        <Card
          icon={BadgeDollarSign}
          label="Net Profit / Loss"
          value={trades.length ? formatMoney(stats.netProfit) : "$0.00"}
          helper={getProfitHelper(stats.netProfit, stats.completedTrades)}
          tone={stats.netProfit >= 0 ? "profit" : "loss"}
        />
        <Card
          icon={trades.length > 10 ? Target : ShieldCheck}
          label={trades.length > 10 ? "Average Risk Reward" : "Discipline Score"}
          value={trades.length ? (trades.length > 10 ? `1:${stats.avgRiskReward.toFixed(2)}` : `${stats.disciplineScore}%`) : "--"}
          helper={stats.completedTrades ? "Based on completed trades" : "Complete trades to calculate"}
          tone="ai"
        />
      </div>
    </section>
  );
}

function getProfitHelper(profit: number, completedTrades: number) {
  if (!completedTrades) return "No completed trades";
  const direction = profit < 0 ? "Loss" : profit > 0 ? "Profit" : "Break-even";
  return `${direction} from ${completedTrades} completed ${pluralize(completedTrades, "trade")}`;
}

function WinLossChart({ trades }: { trades: Trade[] }) {
  const completedTrades = trades.filter((trade) => trade.result !== "Open");
  const wins = completedTrades.filter((trade) => trade.result === "Win").length;
  const losses = completedTrades.filter((trade) => trade.result === "Loss").length;
  const total = wins + losses;
  const minimumTrades = 5;
  const hasEnoughData = total >= minimumTrades;
  const safeTotal = Math.max(1, total);
  const circumference = 2 * Math.PI * 44;
  const winDash = (wins / safeTotal) * circumference;
  const winRate = total ? Math.round((wins / total) * 100) : 0;
  const lossRate = total ? 100 - winRate : 0;

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex items-center gap-2">
        <PieChart size={16} className="text-ai" />
        <h2 className="text-lg font-semibold">Win/Loss Analysis</h2>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[220px_1fr] md:items-center">
        <div className="text-center">
          <div className="relative mx-auto h-40 w-40">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label="Win loss chart">
              <circle cx="60" cy="60" r="44" fill="none" stroke={hasEnoughData ? "#ef4444" : "#302816"} strokeWidth="18" />
              {hasEnoughData && (
                <circle
                  cx="60"
                  cy="60"
                  r="44"
                  fill="none"
                  stroke="#22c55e"
                  strokeDasharray={`${winDash} ${circumference - winDash}`}
                  strokeLinecap="round"
                  strokeWidth="18"
                />
              )}
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div>
                <p className="text-3xl font-bold">{hasEnoughData ? `${winRate}%` : "?"}</p>
                <p className="text-xs text-slate-500">{hasEnoughData ? "Win rate" : "Need 5 trades"}</p>
              </div>
            </div>
          </div>
          {!hasEnoughData && (
            <p className="mx-auto mt-3 max-w-56 text-xs leading-5 text-slate-500">
              Complete 5 trades to analyze your data. Progress: {Math.min(total, minimumTrades)}/{minimumTrades}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <LegendRow label="Wins" value={`${wins} (${winRate}%)`} color="bg-profit" />
          <LegendRow label="Losses" value={`${losses} (${lossRate}%)`} color="bg-loss" />
          <div className="border-t border-line/80 pt-4">
            <p className="text-sm text-slate-400">
              {total
                ? `Based on ${total} completed ${pluralize(total, "trade")}`
                : "No completed trades yet"}
            </p>
            {!hasEnoughData && (
              <div className="mt-3 h-2 rounded-full bg-[#0b0b0c]">
                <div className="h-full rounded-full bg-ai transition-all" style={{ width: `${Math.min(100, (total / minimumTrades) * 100)}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function MonthlyPerformance({ trades }: { trades: Trade[] }) {
  const completedTrades = trades.filter((trade) => trade.result !== "Open");
  const totalProfit = completedTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => ({
    month,
    profit: 0
  }));

  completedTrades.forEach((trade) => {
    const month = months[new Date(trade.date).getMonth()];
    if (month) month.profit += trade.profit;
  });

  const max = Math.max(1, ...months.map((item) => Math.abs(item.profit)));

  return (
    <section className="panel p-4 md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <CalendarDays size={16} className="text-ai" />
          <h2 className="text-lg font-semibold">Monthly Performance</h2>
        </div>
        <button className="rounded-md border border-line px-3 py-1.5 text-xs text-slate-300">This Year</button>
      </div>
      <div className="mt-5 grid gap-5 md:grid-cols-[150px_1fr] md:items-end">
        <div>
          <p className="text-xs text-slate-500">Total P/L</p>
          <p className={`mt-1 text-2xl font-bold ${totalProfit < 0 ? "text-loss" : totalProfit > 0 ? "text-profit" : ""}`}>
            {formatMoney(totalProfit)}
          </p>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            {completedTrades.length ? `Based on ${completedTrades.length} completed ${pluralize(completedTrades.length, "trade")}` : "Based on your completed trades"}
          </p>
        </div>
        <div className="relative min-h-48 overflow-hidden">
          <div className="absolute left-0 right-0 top-8 border-t border-dashed border-slate-500/60" />
          <div className="flex h-44 items-end gap-3 px-1 pb-6 pt-6">
            {months.map((item) => {
              const height = item.profit === 0 ? 4 : Math.max(18, (Math.abs(item.profit) / max) * 112);
              return (
                <div key={item.month} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 items-end">
                    <div
                      className={`w-6 rounded-t-sm transition hover:opacity-80 ${
                        item.profit === 0 ? "bg-line/70" : item.profit >= 0 ? "bg-ai" : "bg-loss"
                      }`}
                      style={{ height }}
                      title={`${item.month}: ${formatMoney(item.profit)}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{item.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 border-t border-line/80 pt-3 text-xs text-slate-500">
        <Info size={14} />
        <span>Keep trading to see your monthly performance trend.</span>
      </div>
    </section>
  );
}

function LegendRow({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <div className="flex items-center gap-2">
        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
        <span>{label}</span>
      </div>
      <span className="font-semibold text-slate-200">{value}</span>
    </div>
  );
}

function LearningCoach({ tradeCount, trades }: { tradeCount: number; trades: Trade[] }) {
  const isExperienced = tradeCount > 10;
  const strongest = isExperienced ? getStrongestSetup(trades) : null;
  const mistake = isExperienced ? getCommonMistake(trades) : null;

  return (
    <section className="panel p-5 md:p-6">
      <SectionHeader title="AI Trading Coach" text="Your AI assistant learns from your trades." />
      <div className="mt-5 grid gap-5 xl:grid-cols-[1fr_320px]">
        <div className="rounded-lg border-2 border-ai/20 bg-panelSoft p-5">
          <p className="text-base text-slate-500">Currently:</p>
          <p className="mt-2 text-2xl font-semibold">{tradeCount ? "Learning from your journal." : "No trading data available."}</p>
          {isExperienced && strongest && mistake ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Metric title="Strongest setup" value={strongest.name} />
              <Metric title="Setup win rate" value={`${strongest.winRate}%`} tone="profit" />
              <Metric title="Common mistake" value={mistake} tone={mistake === "No clear mistake yet" ? undefined : "loss"} />
              <Metric title="Recommendation" value="Wait for candle confirmation before entry." />
            </div>
          ) : (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {["Best strategies", "Winning patterns", "Common mistakes", "Risk management", "Trading psychology"].map((item) => (
                <div key={item} className="flex items-center gap-3 text-base text-slate-300">
                  <CheckCircle2 size={18} className="text-profit" />
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border-2 border-ai/35 bg-ai/10 p-5">
          {!isExperienced && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm font-semibold">
                <span className="text-slate-400">Trade count</span>
                <span className="text-ai">{Math.min(tradeCount, 10)}/10</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-[#0b0b0c]">
                <div className="h-full rounded-full bg-ai transition-all" style={{ width: `${Math.min(100, tradeCount * 10)}%` }} />
              </div>
            </div>
          )}
          <p className="text-lg font-semibold">
            {isExperienced
              ? "Personal coaching is active from your saved journal."
              : tradeCount
                ? "Complete 10 trades to unlock personal coaching."
                : "After adding trades AI will analyze your decisions."}
          </p>
          {!isExperienced && (
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Trade-X needs more data to understand your trading style. Complete 10 trades to unlock stronger personal coaching.
            </p>
          )}
          <button className="primary-button mt-5 w-full" onClick={() => (window.location.href = "/ai-analysis")}>
            Start First Analysis
          </button>
        </div>
      </div>
    </section>
  );
}

function Card({
  icon: Icon,
  label,
  value,
  helper,
  tone = "neutral"
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  helper: string;
  tone?: "profit" | "loss" | "ai" | "neutral";
}) {
  const colors = {
    profit: {
      text: "text-profit",
      bg: "bg-profit/10",
      border: "border-profit/25",
      glow: "shadow-[0_0_22px_rgba(34,197,94,0.08)]"
    },
    loss: {
      text: "text-loss",
      bg: "bg-loss/10",
      border: "border-loss/25",
      glow: "shadow-[0_0_22px_rgba(239,68,68,0.08)]"
    },
    ai: {
      text: "text-ai",
      bg: "bg-ai/10",
      border: "border-ai/25",
      glow: "shadow-[0_0_22px_rgba(224,178,51,0.08)]"
    },
    neutral: {
      text: "text-ai",
      bg: "bg-ai/10",
      border: "border-ai/20",
      glow: "shadow-[0_0_22px_rgba(224,178,51,0.06)]"
    }
  };
  const color = colors[tone];

  return (
    <div className={`rounded-lg border-2 ${color.border} bg-panelSoft p-4 transition hover:-translate-y-0.5 hover:border-ai/45 ${color.glow}`}>
      <div className="flex items-center gap-2">
        <div className={`grid h-8 w-8 place-items-center rounded-full border ${color.border} ${color.bg} ${color.text}`}>
          <Icon size={17} />
        </div>
        <p className={`text-sm font-semibold ${color.text}`}>{label}</p>
      </div>

      <p className="mt-5 text-3xl font-bold tracking-tight">{value}</p>
      <p className={`mt-2 text-sm font-semibold ${color.text}`}>{helper}</p>

      <div className="my-4 h-px bg-line/80" />

      <div className="flex items-start gap-3 text-sm leading-6 text-slate-400">
        <CheckCircle2 className={`mt-0.5 shrink-0 ${color.text}`} size={16} />
        <p>{getCardInsight(label, value)}</p>
      </div>
    </div>
  );
}

function getCardInsight(label: string, value: string) {
  if (label === "Total Trades") return value === "0" ? "Add trades to start building your journal." : "Your journal is tracking real trade data.";
  if (label === "Win Rate") return value === "--" ? "Complete more trades to see your true performance." : "Based on your saved completed trades.";
  if (label === "Net Profit / Loss") return "Shows your current account result from completed trades.";
  return value === "--" ? "Complete trades to calculate your discipline score." : "Keep following your trading rules consistently.";
}

function Metric({ title, value, tone }: { title: string; value: string | number; tone?: "profit" | "loss" }) {
  return (
    <div className="rounded-lg border-2 border-ai/20 bg-panelSoft p-4">
      <p className="text-sm uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className={`mt-2 text-lg font-semibold ${tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-1.5 text-base text-slate-500">{text}</p>
    </div>
  );
}

function getStats(trades: Trade[]) {
  const completedTrades = trades.filter((trade) => trade.result !== "Open");
  const wins = completedTrades.filter((trade) => trade.result === "Win").length;
  const netProfit = completedTrades.reduce((sum, trade) => sum + trade.profit, 0);
  const avgRiskReward = trades.length
    ? trades.reduce((sum, trade) => sum + Number(trade.riskReward.split(":")[1] ?? 0), 0) / trades.length
    : 0;
  const disciplineScore = completedTrades.length
    ? Math.round((completedTrades.reduce((sum, trade) => sum + trade.aiScore, 0) / completedTrades.length) * 10)
    : 0;
  return {
    completedTrades: completedTrades.length,
    netProfit,
    avgRiskReward,
    disciplineScore,
    winRate: completedTrades.length ? Math.round((wins / completedTrades.length) * 100) : 0
  };
}

function getStrongestSetup(trades: Trade[]) {
  const groups = new Map<string, { wins: number; total: number }>();
  trades.forEach((trade) => {
    const current = groups.get(trade.strategy) ?? { wins: 0, total: 0 };
    groups.set(trade.strategy, {
      wins: current.wins + (trade.result === "Win" ? 1 : 0),
      total: current.total + 1
    });
  });
  const sorted = Array.from(groups.entries()).sort((a, b) => b[1].wins / b[1].total - a[1].wins / a[1].total);
  const [name, result] = sorted[0] ?? ["Not enough data", { wins: 0, total: 1 }];
  return { name, winRate: Math.round((result.wins / result.total) * 100) };
}

function getCommonMistake(trades: Trade[]) {
  const losses = trades.filter((trade) => trade.result === "Loss");
  if (losses.some((trade) => trade.notes.toLowerCase().includes("early"))) return "Entering before confirmation";
  if (losses.some((trade) => trade.emotion === "Revenge")) return "Revenge trading";
  if (losses.some((trade) => trade.emotion === "FOMO")) return "FOMO entries";
  return losses.length ? "Risk management needs review" : "No clear mistake yet";
}
