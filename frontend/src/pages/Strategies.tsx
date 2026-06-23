import { Target } from "lucide-react";

const strategies = [
  { name: "Breakout", trades: 50, winRate: "72%", profit: "+$2,000", note: "Strongest when retest confirms support." },
  { name: "Trend Pullback", trades: 34, winRate: "68%", profit: "+$1,450", note: "Best during clear higher-high structure." },
  { name: "Reversal", trades: 22, winRate: "41%", profit: "-$320", note: "Needs stricter confirmation before entry." }
];

export function Strategies() {
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
              <span className={strategy.profit.startsWith("+") ? "text-profit" : "text-loss"}>{strategy.profit}</span>
            </div>
            <h2 className="text-lg font-semibold">{strategy.name}</h2>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Box label="Trades" value={String(strategy.trades)} />
              <Box label="Win Rate" value={strategy.winRate} />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">{strategy.note}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
