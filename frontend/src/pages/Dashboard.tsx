import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Activity, BadgeDollarSign, Brain, CandlestickChart, Percent, Scale, ShieldAlert, Zap } from "lucide-react";
import { StatCard } from "../components/StatCard";
import { monthlyPerformance } from "../data/sampleData";
import { getLatestAnalysis, getSession, getTrades, type StoredAnalysis } from "../lib/storage";

const aiTabs = ["Summary", "Levels", "Advice"] as const;
const tradeFilters = ["All", "Wins", "Losses"] as const;

export function Dashboard() {
  const navigate = useNavigate();
  const session = getSession();
  const [loading, setLoading] = useState(true);
  const [aiTab, setAiTab] = useState<(typeof aiTabs)[number]>("Summary");
  const [tradeFilter, setTradeFilter] = useState<(typeof tradeFilters)[number]>("All");
  const [expandedTrade, setExpandedTrade] = useState<number | null>(null);
  const trades = getTrades(session);
  const latestAnalysis = getLatestAnalysis(session);
  const wins = trades.filter((trade) => trade.result === "Win").length;
  const losses = trades.filter((trade) => trade.result === "Loss").length;
  const netProfit = trades.reduce((sum, trade) => sum + trade.profit, 0);
  const profitSeries = trades
    .slice()
    .reverse()
    .reduce<number[]>((series, trade) => {
      const previous = series.at(-1) ?? 0;
      series.push(previous + trade.profit);
      return series;
    }, []);
  const countSeries = trades.length ? trades.map((_, index) => index + 1) : [];
  const winRateSeries = trades.length
    ? trades
        .slice()
        .reverse()
        .reduce<number[]>((series, trade, index, allTrades) => {
          const winsSoFar = allTrades.slice(0, index + 1).filter((item) => item.result === "Win").length;
          series.push(Math.round((winsSoFar / (index + 1)) * 100));
          return series;
        }, [])
    : [];
  const rrSeries = trades.length
    ? trades
        .slice()
        .reverse()
        .map((trade) => Number(trade.riskReward.split(":")[1] ?? 0))
    : [];
  const avgRiskReward =
    trades.length === 0
      ? 0
      : trades.reduce((sum, trade) => sum + Number(trade.riskReward.split(":")[1] ?? 0), 0) / trades.length;
  const kpis = [
    {
      label: "Total Trades",
      value: String(trades.length),
      helper: trades.length === 0 ? "Start by adding your first trade" : `${trades.length} saved trades`,
      icon: Activity,
      tone: "ai" as const,
      trend: trades.length > 0 ? "+active" : "0%",
      trendDirection: "up" as const,
      sparkline: countSeries
    },
    {
      label: "Win Rate",
      value: trades.length ? `${Math.round((wins / trades.length) * 100)}%` : "0%",
      helper: losses > wins ? "Review losing setups" : "Best on clean setups",
      icon: Percent,
      tone: "profit" as const,
      trend: wins >= losses ? "+stable" : "-review",
      trendDirection: wins >= losses ? "up" as const : "down" as const,
      sparkline: winRateSeries
    },
    {
      label: "Net Profit",
      value: `${netProfit >= 0 ? "+" : ""}$${Math.round(netProfit).toLocaleString()}`,
      helper: "Based on saved trades",
      icon: BadgeDollarSign,
      tone: netProfit >= 0 ? "profit" as const : "loss" as const,
      trend: netProfit >= 0 ? "+profit" : "-loss",
      trendDirection: netProfit >= 0 ? "up" as const : "down" as const,
      sparkline: profitSeries
    },
    {
      label: "Avg Risk Reward",
      value: `1:${avgRiskReward.toFixed(2)}`,
      helper: avgRiskReward >= 2 ? "Healthy setup quality" : "Needs stronger setups",
      icon: Scale,
      tone: "neutral" as const,
      trend: avgRiskReward >= 2 ? "+quality" : "-low",
      trendDirection: avgRiskReward >= 2 ? "up" as const : "down" as const,
      sparkline: rrSeries
    }
  ];

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 650);
    return () => window.clearTimeout(timer);
  }, []);

  const filteredTrades = useMemo(() => {
    if (tradeFilter === "Wins") return trades.filter((trade) => trade.result === "Win");
    if (tradeFilter === "Losses") return trades.filter((trade) => trade.result === "Loss");
    return trades;
  }, [tradeFilter, trades]);

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <StatCard key={kpi.label} {...kpi} loading={loading} />
        ))}
      </section>

      <section>
        <div className="panel p-5 hover:border-ai/30">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">AI Trade Insight</h2>
              <p className="text-sm text-slate-500">Actionable setup read, not raw noise.</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ai/10 text-ai">
              <Brain size={20} />
            </div>
          </div>
          {latestAnalysis ? (
            <>
              <div className="mb-5 grid grid-cols-3 gap-2 rounded-lg border border-line bg-[#0b111a] p-1">
                {aiTabs.map((tab) => (
                  <button
                    key={tab}
                    className={`rounded-md px-2 py-2 text-sm font-semibold transition ${
                      aiTab === tab ? "bg-ai text-white" : "text-slate-500 hover:text-slate-200"
                    }`}
                    onClick={() => setAiTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <AiPanel tab={aiTab} analysis={latestAnalysis} onAnalyze={() => navigate("/analysis")} />
            </>
          ) : (
            <NoAnalysis onAnalyze={() => navigate("/analysis")} />
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="panel p-5 hover:border-ai/30">
          <InsightHeader title="Win/Loss Ratio" text="Losses increase on Fridays. Reduce late-week revenge trades." />
          {loading ? (
            <div className="skeleton h-60 w-full" />
          ) : (
            <>
              <DonutChart wins={wins} losses={losses} />
              <div className="flex justify-center gap-5 text-sm">
                <span className="text-profit">Wins: {wins}</span>
                <span className="text-loss">Losses: {losses}</span>
              </div>
            </>
          )}
        </div>

        <div className="panel p-5 hover:border-ai/30">
          <InsightHeader title="Monthly Performance" text="Most profitable month: March. Best quality came from confirmed breakouts." />
          {loading ? <div className="skeleton mt-4 h-60 w-full" /> : <MonthlyBars trades={trades} />}
        </div>
      </section>

      <section className="panel overflow-hidden">
        <div className="flex flex-col justify-between gap-4 border-b border-line p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-semibold">Recent Trades</h2>
            <p className="text-sm text-slate-500">Hover a row to preview strategy, AI score, and chart context.</p>
          </div>
          <div className="flex rounded-lg border border-line bg-[#0b111a] p-1">
            {tradeFilters.map((filter) => (
              <button
                key={filter}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tradeFilter === filter ? "bg-ai text-white" : "text-slate-500 hover:text-slate-200"
                }`}
                onClick={() => setTradeFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-panelSoft text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Pair</th>
                <th className="px-5 py-3">Direction</th>
                <th className="px-5 py-3">Profit</th>
                <th className="px-5 py-3">Result</th>
                <th className="px-5 py-3">AI Score</th>
                <th className="px-5 py-3">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredTrades.map((trade) => (
                <Fragment key={trade.id}>
                  <tr
                    className="cursor-pointer transition hover:bg-white/[0.03]"
                    onMouseEnter={() => setExpandedTrade(trade.id)}
                    onMouseLeave={() => setExpandedTrade(null)}
                  >
                    <td className="px-5 py-4 text-slate-400">{trade.date}</td>
                    <td className="px-5 py-4 font-semibold">{trade.pair}</td>
                    <td className={trade.type === "BUY" ? "px-5 py-4 text-profit" : "px-5 py-4 text-loss"}>{trade.type}</td>
                    <td className={`px-5 py-4 font-semibold ${trade.profit >= 0 ? "text-profit" : "text-loss"}`}>
                      {trade.profit >= 0 ? "+" : ""}${trade.profit.toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-bold ${trade.result === "Win" ? "bg-profit/10 text-profit" : "bg-loss/10 text-loss"}`}>
                        {trade.result.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-ai">{trade.aiScore}/10</td>
                    <td className="px-5 py-4 text-slate-400">{trade.strategy}</td>
                  </tr>
                  {expandedTrade === trade.id && (
                    <tr onMouseEnter={() => setExpandedTrade(trade.id)} onMouseLeave={() => setExpandedTrade(null)}>
                      <td colSpan={7} className="bg-[#0b111a] px-5 py-4">
                        <div className="grid gap-4 md:grid-cols-[160px_1fr_180px] md:items-center">
                          <MiniChart positive={trade.profit >= 0} />
                          <div>
                            <p className="font-semibold">{trade.strategy} setup</p>
                            <p className="mt-1 text-sm text-slate-500">{trade.notes}</p>
                          </div>
                          <div className="rounded-lg border border-line bg-panel p-3 text-sm">
                            <p className="text-slate-500">AI score</p>
                            <p className="mt-1 text-2xl font-bold text-ai">{trade.aiScore}/10</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {filteredTrades.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-slate-500">
                    No trades yet. Add a trade to see history here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function NoAnalysis({ onAnalyze }: { onAnalyze: () => void }) {
  return (
    <div className="rounded-lg border border-dashed border-ai/40 bg-ai/10 p-5">
      <p className="text-sm font-semibold text-ai">No AI analysis yet</p>
      <h3 className="mt-2 text-xl font-semibold">Analyze your chart and trade levels first.</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
        Add a chart screenshot with entry, stop loss, take profit, lot size, and direction. The result will appear here and on the AI Analysis screen.
      </p>
      <button className="primary-button mt-5" onClick={onAnalyze}>
        Analyze Trade
      </button>
    </div>
  );
}

function AiPanel({
  tab,
  analysis,
  onAnalyze
}: {
  tab: (typeof aiTabs)[number];
  analysis: StoredAnalysis;
  onAnalyze: () => void;
}) {
  const confidence = Math.min(100, Math.max(0, analysis.confidence ?? analysis.score * 10));

  if (tab === "Levels") {
    return (
      <>
        <div className="mb-3 flex justify-end">
          <button className="rounded-md border border-ai/30 px-3 py-2 text-xs font-semibold text-ai transition hover:bg-ai/10" onClick={onAnalyze}>
            New Analysis
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric title="Entry" value={analysis.entry} />
          <Metric title="Stop Loss" value={analysis.stopLoss} tone="loss" />
          <Metric title="Take Profit" value={analysis.target} tone="profit" />
          <Metric title="Risk" value={analysis.risk} />
          <Metric title="Support" value={analysis.support || "Not detected"} />
          <Metric title="Resistance" value={analysis.resistance || "Not detected"} />
        </div>
      </>
    );
  }

  if (tab === "Advice") {
    const suggestions = analysis.suggestions?.length ? analysis.suggestions : [analysis.advice];
    const warnings = analysis.warnings?.length ? analysis.warnings : [];
    const mistakes = analysis.mistakes?.length ? analysis.mistakes : [];

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <button className="rounded-md border border-ai/30 px-3 py-2 text-xs font-semibold text-ai transition hover:bg-ai/10" onClick={onAnalyze}>
            New Analysis
          </button>
        </div>
        {analysis.validationSummary && <Advice icon={CandlestickChart} title="Backend Review" text={analysis.validationSummary} />}
        {suggestions.map((item) => (
          <Advice key={`suggestion-${item}`} icon={Zap} title="Suggestion" text={item} />
        ))}
        {mistakes.map((item) => (
          <Advice key={`mistake-${item}`} icon={CandlestickChart} title="Mistake" text={item} />
        ))}
        {warnings.map((item) => (
          <Advice key={`warning-${item}`} icon={ShieldAlert} title="Warning" text={item} tone="loss" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Metric title="Pair" value={analysis.pair ?? "Chart"} />
        <Metric title="Direction" value={analysis.direction ?? "Trade"} tone={analysis.direction === "BUY" ? "profit" : "loss"} />
        <Metric title="Trend" value={analysis.trend || "Not detected"} tone={analysis.trend.toLowerCase().includes("bull") ? "profit" : undefined} />
        <Metric title="Pattern" value={analysis.pattern || "Not detected"} />
      </div>
      <div className="rounded-lg border border-ai/30 bg-ai/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Confidence score</span>
          <span className="text-3xl font-bold text-ai">{confidence}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#0b111a]">
          <div className="h-full rounded-full bg-ai" style={{ width: `${confidence}%` }} />
        </div>
      </div>
      <div className="flex justify-end">
        <button className="rounded-md border border-ai/30 px-3 py-2 text-xs font-semibold text-ai transition hover:bg-ai/10" onClick={onAnalyze}>
          New Analysis
        </button>
      </div>
    </div>
  );
}

function DonutChart({ wins, losses }: { wins: number; losses: number }) {
  const realTotal = wins + losses;
  const total = Math.max(1, realTotal);
  const circumference = 2 * Math.PI * 44;
  const winDash = (wins / total) * circumference;

  return (
    <div className="grid h-56 place-items-center">
      <div className="relative h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-label="Win loss chart">
          <circle cx="60" cy="60" r="44" fill="none" stroke={realTotal === 0 ? "#2b2618" : "#ef4444"} strokeWidth="18" />
          {realTotal > 0 && (
            <circle cx="60" cy="60" r="44" fill="none" stroke="#22c55e" strokeDasharray={`${winDash} ${circumference - winDash}`} strokeLinecap="round" strokeWidth="18" />
          )}
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-2xl font-bold">{realTotal === 0 ? "0%" : `${Math.round((wins / total) * 100)}%`}</p>
            <p className="text-xs text-slate-500">Win rate</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function MonthlyBars({ trades }: { trades: Array<{ date: string; profit: number }> }) {
  const monthlyData = monthlyPerformance.map((item) => ({ ...item, profit: 0 }));
  trades.forEach((trade) => {
    const monthIndex = new Date(trade.date).getMonth();
    const month = monthlyData[monthIndex];
    if (month) {
      month.profit += trade.profit;
    }
  });
  const max = Math.max(1, ...monthlyData.map((item) => Math.abs(item.profit)));

  return (
    <div className="flex h-60 items-end gap-4 overflow-x-auto px-2 pb-8 pt-6">
      {monthlyData.map((item) => {
        const height = item.profit === 0 ? 4 : Math.max(18, (Math.abs(item.profit) / max) * 170);
        return (
          <div key={item.month} className="flex min-w-12 flex-1 flex-col items-center gap-2">
            <div className="flex h-44 items-end">
              <div
                className={`w-9 rounded-t-md transition hover:opacity-80 ${
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
  );
}

function InsightHeader({ title, text }: { title: string; text: string }) {
  return (
    <div>
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-ai">{text}</p>
    </div>
  );
}

function Metric({ title, value, tone }: { title: string; value: string | number; tone?: "profit" | "loss" }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{title}</p>
      <p className={`mt-2 font-semibold ${tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""}`}>{value}</p>
    </div>
  );
}

function Advice({ icon: Icon, title, text, tone }: { icon: typeof Zap; title: string; text: string; tone?: "loss" }) {
  return (
    <div className={`rounded-lg border p-4 ${tone === "loss" ? "border-loss/30 bg-loss/10" : "border-line bg-panelSoft"}`}>
      <div className="flex gap-3">
        <Icon className={tone === "loss" ? "mt-0.5 text-loss" : "mt-0.5 text-ai"} size={18} />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ positive }: { positive: boolean }) {
  const points = positive ? "5,44 36,34 66,38 96,20 126,26 155,9" : "5,16 36,22 66,18 96,34 126,29 155,44";
  return (
    <div className="rounded-lg border border-line bg-panel p-3">
      <svg viewBox="0 0 160 52" className="h-14 w-full" aria-label="Mini chart thumbnail">
        <polyline points={points} fill="none" stroke={positive ? "#22c55e" : "#ef4444"} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
