import { Target } from "lucide-react";
import { formatMoney, pluralize } from "../lib/format";
import { getSession, getTrades } from "../lib/storage";

export function Strategies() {
  const strategies = getStrategyStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Strategy Analyzer</h1>
        <p className="mt-2 text-slate-500">See which setups deserve more capital and which need rules tightened.</p>
      </div>
      {strategies.length === 0 ? (
        <div className="panel p-6 text-center">
          <Target className="mx-auto text-ai" size={28} />
          <h2 className="mt-4 text-lg font-semibold">No strategies used yet</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
            Save trades with a strategy name and Trade-X will show only those strategies here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {strategies.map((strategy) => (
            <div className="panel p-5" key={strategy.name}>
              <div className="mb-5 flex items-center justify-between">
                <Target className="text-ai" size={22} />
                <div className="text-right">
                  <p className={strategy.profit >= 0 ? "text-profit" : "text-loss"}>
                    {formatMoney(strategy.profit)}
                  </p>
                  <p className={`mt-1 text-xs font-bold uppercase tracking-[0.18em] ${strategy.profit < 0 ? "text-loss" : strategy.profit > 0 ? "text-profit" : "text-slate-500"}`}>
                    {strategy.profit < 0 ? "Loss" : strategy.profit > 0 ? "Profit" : "Even"}
                  </p>
                </div>
              </div>
              <h2 className="text-lg font-semibold">{strategy.name}</h2>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <Box label="Trades" value={String(strategy.trades)} />
                <Box label="Win Rate" value={`${strategy.winRate}%`} />
              </div>
              <p className="mt-5 text-sm leading-6 text-slate-400">{strategy.note}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getStrategyStats() {
  const trades = getTrades(getSession()).filter((trade) => trade.profit !== 0);
  const strategyNames = Array.from(
    new Set(trades.map((trade) => trade.strategy.trim()).filter(Boolean))
  );

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
  }).sort((a, b) => b.trades - a.trades || b.profit - a.profit);
}

function getStrategyNote(name: string, trades: number, profit: number) {
  const tradeText = `${trades} completed ${pluralize(trades, "trade")}`;
  if (profit > 0) return `Profit from ${tradeText}. Keep using strict confirmation.`;
  if (profit < 0) return `Loss from ${tradeText}. Tighten entry rules before risking more capital.`;
  return `Break-even from ${tradeText}. Add more completed trades for a reliable read.`;
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
