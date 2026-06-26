import { Target } from "lucide-react";
import { getSession, getTrades } from "../lib/storage";

export function Strategies() {
  const strategies = getStrategyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Strategy Analyzer</h1>
        <p className="mt-2 text-slate-500">See which setups deserve more capital and which need rules tightened.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {strategies.map((strategy) => (
          <div className="panel p-5" key={strategy.name}>
            <div className="mb-5 flex items-center justify-between">
              <Target className="text-ai" size={22} />
              <span className={strategy.profit >= 0 ? "text-profit" : "text-loss"}>
                {strategy.profit >= 0 ? "+" : ""}${strategy.profit.toLocaleString()}
              </span>
            </div>
            <h2 className="text-lg font-semibold">{strategy.name}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Box label="Trades" value={String(strategy.trades)} />
              <Box label="Win Rate" value={strategy.trades ? `${strategy.winRate}%` : "0%"} />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">{strategy.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function getStrategyStats() {
  const trades = getTrades(getSession()).filter((trade) => trade.profit !== 0);
  const strategyNames = ["Breakout", "Trend Pullback", "Reversal"];

  return strategyNames.map((name) => {
    const strategyTrades = trades.filter((trade) => trade.strategy.toLowerCase() === name.toLowerCase());
    const wins = strategyTrades.filter((trade) => trade.result === "Win").length;
    const profit = strategyTrades.reduce((sum, trade) => sum + trade.profit, 0);
    return {
      name,
      trades: strategyTrades.length,
      winRate: strategyTrades.length ? Math.round((wins / strategyTrades.length) * 100) : 0,
      profit,
      note: getStrategyNote(name, strategyTrades.length, profit)
    };
  });
}

function getStrategyNote(name: string, trades: number, profit: number) {
  if (trades === 0) return "No completed trades saved for this strategy yet.";
  if (profit > 0) return `${name} is currently profitable in your journal. Keep using strict confirmation.`;
  if (profit < 0) return `${name} is losing in your journal. Tighten entry rules before risking more capital.`;
  return `${name} is neutral so far. Add more completed trades for a reliable read.`;
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
