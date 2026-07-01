import { FormEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { Calculator, CheckCircle2 } from "lucide-react";
import { getSession, saveTrade } from "../lib/storage";

const initialTrade = {
  pair: "",
  type: "",
  entry: "",
  exit: "",
  stopLoss: "",
  takeProfit: "",
  lotSize: "",
  strategy: "",
  date: "",
  notes: ""
};

export function AddTrade() {
  const [trade, setTrade] = useState(initialTrade);
  const [saved, setSaved] = useState(false);
  const firstRender = useRef(true);

  const calculations = useMemo(() => {
    const entry = Number(trade.entry);
    const exit = Number(trade.exit);
    const stopLoss = Number(trade.stopLoss);
    const takeProfit = Number(trade.takeProfit);
    const lotSize = Number(trade.lotSize);
    const hasProfitInputs = trade.type && trade.entry && trade.exit && trade.lotSize;
    const hasRiskInputs = trade.entry && trade.stopLoss && trade.takeProfit;
    const direction = trade.type === "SELL" ? -1 : 1;
    const profit = hasProfitInputs ? (exit - entry) * lotSize * direction : null;
    const potentialProfit = Math.abs(takeProfit - entry);
    const risk = Math.abs(entry - stopLoss);
    const riskReward = hasRiskInputs && risk > 0 ? potentialProfit / risk : null;

    return {
      profit: profit !== null && Number.isFinite(profit) ? profit : null,
      riskReward: riskReward !== null && Number.isFinite(riskReward) ? riskReward : null
    };
  }, [trade]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!trade.pair || !trade.type || !trade.entry || !trade.stopLoss || !trade.takeProfit || !trade.lotSize || !trade.strategy || !trade.date || calculations.riskReward === null) {
      return;
    }
    const session = getSession();
    const profit = calculations.profit ?? 0;
    if (session) {
      const savedTrade = {
        id: Date.now(),
        date: trade.date,
        pair: trade.pair,
        type: trade.type as "BUY" | "SELL",
        entry: Number(trade.entry),
        exit: trade.exit ? Number(trade.exit) : 0,
        stopLoss: Number(trade.stopLoss),
        takeProfit: Number(trade.takeProfit),
        lotSize: Number(trade.lotSize),
        strategy: trade.strategy,
        notes: trade.notes,
        result: trade.exit ? (profit >= 0 ? "Win" as const : "Loss" as const) : "Open" as const,
        profit,
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
    }, 650);

    return () => window.clearTimeout(timer);
  }, [trade]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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
            <input
              className="field"
              required
              value={trade.pair}
              placeholder="Write pair name, e.g. XAU/USD"
              onChange={(e) => setTrade({ ...trade, pair: e.target.value.toUpperCase() })}
            />
          </Field>
          <Field label="Trade Type">
            <select className="field" required value={trade.type} onChange={(e) => setTrade({ ...trade, type: e.target.value })}>
              <option value="">Select type</option>
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </Field>
          {([
            { key: "entry", label: "Entry", required: true },
            { key: "exit", label: "Exit", required: false },
            { key: "stopLoss", label: "Stop Loss", required: true },
            { key: "takeProfit", label: "Take Profit", required: true },
            { key: "lotSize", label: "Lot Size", required: true }
          ] as const).map((item) => (
            <Field key={item.key} label={item.label} optional={!item.required}>
              <input
                className="field"
                required={item.required}
                inputMode="decimal"
                value={trade[item.key]}
                onChange={(e) => setTrade({ ...trade, [item.key]: e.target.value })}
              />
            </Field>
          ))}
          <Field label="Strategy">
            <input className="field" required value={trade.strategy} onChange={(e) => setTrade({ ...trade, strategy: e.target.value })} />
          </Field>
          <Field label="Date">
            <input className="field" required type="date" value={trade.date} onChange={(e) => setTrade({ ...trade, date: e.target.value })} />
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
            <Summary
              label="Profit / Loss"
              value={calculations.profit === null ? "--" : `${calculations.profit >= 0 ? "+" : ""}$${calculations.profit.toFixed(2)}`}
              positive={calculations.profit === null ? undefined : calculations.profit >= 0}
            />
            <Summary label="Risk Reward" value={calculations.riskReward === null ? "--" : `1:${calculations.riskReward.toFixed(2)}`} />
            <Summary label="Setup Quality" value={calculations.riskReward === null ? "--" : calculations.riskReward >= 2 ? "Strong" : "Needs review"} />
          </div>
        </aside>
      </form>
    </div>
  );
}

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="label">
        {label} {optional && <span className="normal-case tracking-normal text-slate-500">(Optional)</span>}
      </label>
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
