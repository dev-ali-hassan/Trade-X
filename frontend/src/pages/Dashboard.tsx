import { useNavigate } from "react-router-dom";
import {
  Activity,
  BadgeDollarSign,
  CheckCircle2,
  LineChart,
  PlusCircle,
  ShieldCheck,
  Sparkles,
  Target,
  UploadCloud
} from "lucide-react";
import type { Trade } from "../data/sampleData";
import { getSession, getTrades } from "../lib/storage";

export function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const trades = getTrades(session);

  return (
    <div className="space-y-4">
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
    <section className="panel overflow-hidden p-4 md:p-5">
      <div className="grid gap-4 xl:grid-cols-[1fr_320px] xl:items-center">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-ai/30 bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
            <Sparkles size={14} />
            Start here
          </div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Welcome to Trade-X</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Build your trading history and let AI analyze your decisions.</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
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
        <div className="rounded-lg border border-ai/20 bg-[#0b0b0c] p-4">
          <p className="text-sm font-semibold text-ai">Next best step</p>
          <p className="mt-2 text-xl font-bold">Add one real trade or upload one chart.</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">Trade-X becomes useful after it has real decisions to learn from.</p>
        </div>
      </div>
    </section>
  );
}

function Overview({ trades }: { trades: Trade[] }) {
  const stats = getStats(trades);
  return (
    <section className="panel p-4">
      <SectionHeader title="Trading Overview" text="Based only on your saved trades." />
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card icon={Activity} label="Total Trades" value={String(trades.length)} helper={trades.length ? "Saved journal entries" : "Start your first trade journal"} />
        <Card icon={LineChart} label="Win Rate" value={trades.length ? `${stats.winRate}%` : "--"} helper={trades.length ? "Based on saved trades" : "Need trade history"} tone="profit" />
        <Card icon={BadgeDollarSign} label={trades.length > 10 ? "Net Profit" : "Profit"} value={trades.length ? `${stats.netProfit >= 0 ? "+" : ""}$${stats.netProfit.toFixed(0)}` : "$0"} helper={trades.length ? "Closed trade result" : "No completed trades"} tone={stats.netProfit >= 0 ? "profit" : "loss"} />
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

function WinLossChart({ trades }: { trades: Trade[] }) {
  const wins = trades.filter((trade) => trade.result === "Win").length;
  const losses = trades.filter((trade) => trade.result === "Loss").length;
  const total = wins + losses;
  const safeTotal = Math.max(1, total);
  const circumference = 2 * Math.PI * 44;
  const winDash = (wins / safeTotal) * circumference;

  return (
    <section className="panel p-4">
      <SectionHeader title="Win/Loss Analysis" text={total ? "Based on completed journal results." : "No completed trades yet."} />
      <div className="grid h-52 place-items-center">
        <div className="relative h-40 w-40">
          <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label="Win loss chart">
            <circle cx="60" cy="60" r="44" fill="none" stroke={total ? "#ef4444" : "#2b2618"} strokeWidth="18" />
            {total > 0 && (
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
              <p className="text-2xl font-bold">{total ? `${Math.round((wins / safeTotal) * 100)}%` : "0%"}</p>
              <p className="text-xs text-slate-500">Win rate</p>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-5 text-sm">
        <span className="text-profit">Wins: {wins}</span>
        <span className="text-loss">Losses: {losses}</span>
      </div>
    </section>
  );
}

function MonthlyPerformance({ trades }: { trades: Trade[] }) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((month) => ({
    month,
    profit: 0
  }));

  trades.forEach((trade) => {
    const month = months[new Date(trade.date).getMonth()];
    if (month) month.profit += trade.profit;
  });

  const max = Math.max(1, ...months.map((item) => Math.abs(item.profit)));

  return (
    <section className="panel p-4">
      <SectionHeader title="Monthly Performance" text={trades.length ? "Profit by saved trade date." : "No monthly results yet."} />
      <div className="flex h-56 items-end gap-3 overflow-x-auto px-2 pb-6 pt-6">
        {months.map((item) => {
          const height = item.profit === 0 ? 5 : Math.max(16, (Math.abs(item.profit) / max) * 145);
          return (
            <div key={item.month} className="flex min-w-10 flex-1 flex-col items-center gap-2">
              <div className="flex h-36 items-end">
                <div
                  className={`w-7 rounded-t-md transition hover:opacity-80 ${
                    item.profit === 0 ? "bg-line" : item.profit >= 0 ? "bg-ai" : "bg-loss"
                  }`}
                  style={{ height }}
                  title={`${item.month}: ${item.profit}`}
                />
              </div>
              <span className="text-xs text-slate-500">{item.month}</span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function LearningCoach({ tradeCount, trades }: { tradeCount: number; trades: Trade[] }) {
  const isExperienced = tradeCount > 10;
  const strongest = isExperienced ? getStrongestSetup(trades) : null;
  const mistake = isExperienced ? getCommonMistake(trades) : null;

  return (
    <section className="panel p-4">
      <SectionHeader title="AI Trading Coach" text="Your AI assistant learns from your trades." />
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_260px]">
        <div className="rounded-lg border border-line bg-panelSoft p-4">
          <p className="text-sm text-slate-500">Currently:</p>
          <p className="mt-2 text-lg font-semibold">{tradeCount ? "Learning from your journal." : "No trading data available."}</p>
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
                <div key={item} className="flex items-center gap-2 text-sm text-slate-300">
                  <CheckCircle2 size={16} className="text-profit" />
                  {item}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-lg border border-ai/30 bg-ai/10 p-4">
          <p className="font-semibold">
            {isExperienced
              ? "Personal coaching is active from your saved journal."
              : tradeCount
                ? "Complete 10 trades to unlock personal coaching."
                : "After adding trades AI will analyze your decisions."}
          </p>
          <button className="primary-button mt-4 w-full" onClick={() => (window.location.href = "/ai-analysis")}>
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
    profit: "text-profit bg-profit/10",
    loss: "text-loss bg-loss/10",
    ai: "text-ai bg-ai/10",
    neutral: "text-slate-300 bg-white/5"
  };
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3 transition hover:-translate-y-0.5 hover:border-ai/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-1.5 text-xl font-bold">{value}</p>
        </div>
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${colors[tone]}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string | number; tone?: "profit" | "loss" }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className={`mt-2 font-semibold ${tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""}`}>{value}</p>
    </div>
  );
}

function SectionHeader({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-base font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{text}</p>
    </div>
  );
}

function getStats(trades: Trade[]) {
  const completedTrades = trades.filter((trade) => trade.profit !== 0);
  const wins = trades.filter((trade) => trade.result === "Win").length;
  const netProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
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
    winRate: trades.length ? Math.round((wins / trades.length) * 100) : 0
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
