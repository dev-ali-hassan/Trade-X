import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import { getSession, saveTrade } from "../lib/storage";

const initialTrade = {
  pair: "XAU/USD",
  type: "BUY",
  entry: "2360",
  exit: "2385",
  stopLoss: "2348",
  takeProfit: "2385",
  lotSize: "2",
  strategy: "Breakout",
  date: "2026-06-23",
  notes: ""
};

export function AddTrade() {
  const [trade, setTrade] = useState(initialTrade);
  const [saved, setSaved] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);
  const firstRender = useRef(true);

  const calculations = useMemo(() => {
    const entry = Number(trade.entry);
    const exit = Number(trade.exit);
    const stopLoss = Number(trade.stopLoss);
    const takeProfit = Number(trade.takeProfit);
    const lotSize = Number(trade.lotSize);
    const direction = trade.type === "BUY" ? 1 : -1;
    const profit = (exit - entry) * lotSize * direction;
    const potentialProfit = Math.abs(takeProfit - entry);
    const risk = Math.abs(entry - stopLoss);
    const riskReward = risk > 0 ? potentialProfit / risk : 0;

    return {
      profit: Number.isFinite(profit) ? profit : 0,
      riskReward: Number.isFinite(riskReward) ? riskReward : 0
    };
  }, [trade]);

  function submit(event: FormEvent) {
    event.preventDefault();
    const session = getSession();
    if (session) {
      const savedTrade = {
        id: Date.now(),
        date: trade.date,
        pair: trade.pair,
        type: trade.type as "BUY" | "SELL",
        entry: Number(trade.entry),
        exit: Number(trade.exit),
        stopLoss: Number(trade.stopLoss),
        takeProfit: Number(trade.takeProfit),
        lotSize: Number(trade.lotSize),
        strategy: trade.strategy,
        notes: trade.notes || "Saved from Add Trade form.",
        result: calculations.profit >= 0 ? "Win" as const : "Loss" as const,
        profit: calculations.profit,
        riskReward: `1:${calculations.riskReward.toFixed(2)}`,
        emotion: "Confident" as const,
        aiScore: calculations.riskReward >= 2 ? 8 : 5
      };
      saveTrade(session, savedTrade);
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2600);
  }

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      localStorage.setItem("tradex_draft_trade", JSON.stringify(trade));
      setAutoSaved(true);
      window.setTimeout(() => setAutoSaved(false), 1800);
    }, 650);

    return () => window.clearTimeout(timer);
  }, [trade]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {autoSaved && (
        <div className="fixed right-4 top-20 z-30 rounded-lg border border-ai/30 bg-ai/10 px-4 py-3 text-sm text-ai shadow-panel">
          Draft auto-saved
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Add Trade</h1>
        <p className="mt-2 text-slate-500">Record entries, exits, strategy notes, and trade quality in one simple form.</p>
      </div>

      {saved && (
        <div className="flex items-center gap-3 rounded-lg border border-profit/30 bg-profit/10 p-4 text-profit">
          <CheckCircle2 size={20} />
          Trade saved successfully.
        </div>
      )}

      <form className="grid gap-6 xl:grid-cols-[1fr_340px]" onSubmit={submit}>
        <div className="panel grid gap-4 p-5 md:grid-cols-2">
          <Field label="Pair">
            <select className="field" value={trade.pair} onChange={(e) => setTrade({ ...trade, pair: e.target.value })}>
              <option>XAU/USD</option>
              <option>EUR/USD</option>
              <option>BTC/USD</option>
              <option>GBP/USD</option>
            </select>
          </Field>
          <Field label="Trade Type">
            <select className="field" value={trade.type} onChange={(e) => setTrade({ ...trade, type: e.target.value })}>
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </Field>
          {(["entry", "exit", "stopLoss", "takeProfit", "lotSize"] as const).map((key) => (
            <Field key={key} label={key.replace(/([A-Z])/g, " $1")}>
              <input className="field" value={trade[key]} onChange={(e) => setTrade({ ...trade, [key]: e.target.value })} />
            </Field>
          ))}
          <Field label="Strategy">
            <input className="field" value={trade.strategy} onChange={(e) => setTrade({ ...trade, strategy: e.target.value })} />
          </Field>
          <Field label="Date">
            <input className="field" type="date" value={trade.date} onChange={(e) => setTrade({ ...trade, date: e.target.value })} />
          </Field>
          <div className="md:col-span-2">
            <label className="label">Notes</label>
            <textarea
              className="field min-h-32 resize-y"
              value={trade.notes}
              placeholder="What was your reason for entry? What did you feel?"
              onChange={(e) => setTrade({ ...trade, notes: e.target.value })}
            />
          </div>
          <div className="md:col-span-2">
            <button className="primary-button" type="submit">Save Trade</button>
          </div>
        </div>

        <aside className="panel h-fit p-5">
          <div className="mb-4 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ai/10 text-ai">
              <Calculator size={20} />
            </div>
            <div>
              <h2 className="font-semibold">Auto Calculations</h2>
              <p className="text-sm text-slate-500">Based on your trade fields.</p>
            </div>
          </div>
          <div className="space-y-3">
            <Summary label="Profit / Loss" value={`${calculations.profit >= 0 ? "+" : ""}$${calculations.profit.toFixed(2)}`} positive={calculations.profit >= 0} />
            <Summary label="Risk Reward" value={`1:${calculations.riskReward.toFixed(2)}`} />
            <Summary label="Setup Quality" value={calculations.riskReward >= 2 ? "Strong" : "Needs review"} />
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function Summary({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${positive === undefined ? "" : positive ? "text-profit" : "text-loss"}`}>{value}</p>
    </div>
  );
}
