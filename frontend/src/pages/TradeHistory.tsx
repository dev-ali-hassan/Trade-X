import { useState } from "react";
import { formatMoney } from "../lib/format";
import { getSession, getTrades } from "../lib/storage";

export function TradeHistory() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("All");
  const trades = getTrades(getSession());

  const filtered = trades.filter((trade) => {
    const matchesQuery = `${trade.pair} ${trade.strategy} ${trade.type}`.toLowerCase().includes(query.toLowerCase());
    const matchesResult = result === "All" || trade.result === result;
    return matchesQuery && matchesResult;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trade History</h1>
          <p className="mt-2 text-slate-500">Search, filter, and review closed trades.</p>
        </div>
        <div className="flex gap-3">
          <input className="field w-56" placeholder="Search pair or strategy" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="field w-32" value={result} onChange={(e) => setResult(e.target.value)}>
            <option>All</option>
            <option>Win</option>
            <option>Loss</option>
            <option>Open</option>
          </select>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-panelSoft text-xs uppercase tracking-[0.14em] text-slate-500">
              <tr>
                {["Date", "Pair", "Direction", "Entry", "Exit", "Profit", "Result", "AI Score", "Notes"].map((head) => (
                  <th key={head} className="px-5 py-3">{head}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((trade) => (
                <tr key={trade.id}>
                  <td className="px-5 py-4 text-slate-400">{trade.date}</td>
                  <td className="px-5 py-4 font-semibold">{trade.pair}</td>
                  <td className="px-5 py-4">{trade.type}</td>
                  <td className="px-5 py-4">{trade.entry}</td>
                  <td className="px-5 py-4">{trade.result === "Open" ? "--" : trade.exit}</td>
                  <td className={`px-5 py-4 font-semibold ${trade.profit >= 0 ? "text-profit" : "text-loss"}`}>
                    {trade.result === "Open" ? "--" : formatMoney(trade.profit)}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                        trade.result === "Win"
                          ? "bg-profit/10 text-profit"
                          : trade.result === "Loss"
                            ? "bg-loss/10 text-loss"
                            : "bg-ai/10 text-ai"
                      }`}
                    >
                      {trade.result}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-ai">{trade.aiScore}/10</td>
                  <td className="max-w-xs px-5 py-4 text-slate-400">{trade.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
