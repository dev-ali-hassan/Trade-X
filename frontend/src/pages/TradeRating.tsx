import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardCheck, Lightbulb, ShieldAlert, UploadCloud } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../api/client";

type ChartAnalysis = {
  direction: string;
  confidence: number;
  strategy: string;
  marketStructure: string;
  entry: {
    zone: string;
    reason: string;
  };
  risk: {
    stopLoss: string;
    riskReward: string;
    invalidation: string;
  };
  targets: Array<{
    name: string;
    price: string;
    reason: string;
  }>;
  reasoning: string;
  risks: string[];
  alternativeScenario: string;
};

type RatingResult = {
  trend: string;
  pattern: string;
  score: number;
  risk: string;
  advice: string;
  confidence?: number;
  riskReward?: string;
  setupQuality?: string;
  validationSummary?: string;
  warnings?: string[];
  suggestions?: string[];
  mistakes?: string[];
};

const initialTrade = {
  pair: "XAU/USD",
  timeframe: "15M",
  direction: "BUY",
  entry: "",
  stopLoss: "",
  takeProfit: "",
  exit: "",
  lotSize: "1",
  strategy: "",
  notes: ""
};

export function TradeRating() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [trade, setTrade] = useState(initialTrade);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<RatingResult | null>(null);

  const riskReward = useMemo(() => {
    const entry = Number(trade.entry);
    const stopLoss = Number(trade.stopLoss);
    const takeProfit = Number(trade.takeProfit);
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return risk > 0 && reward > 0 ? `1:${(reward / risk).toFixed(2)}` : "Add entry, SL, TP";
  }, [trade.entry, trade.stopLoss, trade.takeProfit]);

  const canRate = Boolean(file && trade.entry && trade.stopLoss && trade.takeProfit && trade.lotSize);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setPreview(await readFileAsDataUrl(selected));
    setResult(null);
    setError("");
  }

  async function rateTrade() {
    if (!file || !canRate) {
      showToast("Upload chart and enter entry, stop loss, take profit, and lot size.");
      return;
    }

    setLoading(true);
    setError("");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("trade_id", "trade-rating");
    formData.append("pair", trade.pair);
    formData.append("direction", trade.direction);
    formData.append("entry", trade.entry);
    formData.append("stopLoss", trade.stopLoss);
    formData.append("takeProfit", trade.takeProfit);
    formData.append("exit", trade.exit);
    formData.append("lotSize", trade.lotSize);
    formData.append("riskReward", riskReward);
    formData.append("timeframe", trade.timeframe);
    formData.append("strategy", trade.strategy);
    formData.append("notes", trade.notes);

    try {
      const response = await api.post<ChartAnalysis>("/analysis/analyze-chart", formData);
      setResult(buildRating(response.data));
      showToast("Trade rating complete");
    } catch (requestError) {
      setResult(null);
      setError(getApiError(requestError));
      showToast("Trade rating failed");
    } finally {
      setLoading(false);
    }
  }

  function buildRating(data: ChartAnalysis): RatingResult {
    const score = Math.max(1, Math.min(10, Math.round(data.confidence / 10)));
    return {
      trend: data.marketStructure,
      pattern: data.strategy,
      score,
      confidence: data.confidence,
      risk: data.risks.join(" "),
      riskReward: data.risk.riskReward || riskReward,
      setupQuality: score >= 8 ? "Strong" : score >= 6 ? "Good" : "Weak",
      validationSummary: data.reasoning,
      mistakes: data.risks,
      suggestions: [data.entry.reason, data.alternativeScenario].filter(Boolean),
      warnings: data.risks,
      advice: data.reasoning
    };
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-30 rounded-lg border border-ai/30 bg-ai/10 px-4 py-3 text-sm text-ai shadow-panel">
          {toast}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade Rating</h1>
        <p className="mt-2 text-slate-500">Upload a chart and enter your trade plan. Trade-X will rate the setup, mistakes, correction, and best working strategy.</p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Chart + Trade Details</h2>
              <p className="mt-1 text-sm text-slate-500">The rating starts after you enter real trade data.</p>
            </div>
            <div className="rounded-lg border border-ai/30 bg-ai/10 px-3 py-1 text-sm font-semibold text-ai">
              R:R {riskReward}
            </div>
          </div>

          <label className="grid min-h-60 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-[#0b111a] p-4 text-center transition hover:border-ai/70">
            {preview ? (
              <img src={preview} alt="Trade chart preview" className="max-h-72 rounded-lg object-contain" />
            ) : (
              <div>
                <UploadCloud className="mx-auto mb-3 text-ai" size={34} />
                <p className="font-semibold">Upload chart image</p>
                <p className="mt-2 text-sm text-slate-500">TradingView, MT5, or clean screenshot.</p>
              </div>
            )}
            <input className="sr-only" type="file" accept="image/*" onChange={handleFile} />
          </label>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Pair">
              <select className="field" value={trade.pair} onChange={(event) => setTrade({ ...trade, pair: event.target.value })}>
                <option>XAU/USD</option>
                <option>EUR/USD</option>
                <option>BTC/USD</option>
                <option>GBP/USD</option>
                <option>NAS100</option>
              </select>
            </Field>
            <Field label="Timeframe">
              <select className="field" value={trade.timeframe} onChange={(event) => setTrade({ ...trade, timeframe: event.target.value })}>
                <option>5M</option>
                <option>15M</option>
                <option>30M</option>
                <option>1H</option>
                <option>4H</option>
                <option>1D</option>
              </select>
            </Field>
            <Field label="Direction">
              <select className="field" value={trade.direction} onChange={(event) => setTrade({ ...trade, direction: event.target.value })}>
                <option>BUY</option>
                <option>SELL</option>
              </select>
            </Field>
            <Field label="Entry">
              <input className="field" inputMode="decimal" value={trade.entry} onChange={(event) => setTrade({ ...trade, entry: event.target.value })} placeholder="2360" />
            </Field>
            <Field label="Stop Loss">
              <input className="field" inputMode="decimal" value={trade.stopLoss} onChange={(event) => setTrade({ ...trade, stopLoss: event.target.value })} placeholder="2348" />
            </Field>
            <Field label="Take Profit">
              <input className="field" inputMode="decimal" value={trade.takeProfit} onChange={(event) => setTrade({ ...trade, takeProfit: event.target.value })} placeholder="2385" />
            </Field>
            <Field label="Exit">
              <input className="field" inputMode="decimal" value={trade.exit} onChange={(event) => setTrade({ ...trade, exit: event.target.value })} placeholder="Optional" />
            </Field>
            <Field label="Lot Size">
              <input className="field" inputMode="decimal" value={trade.lotSize} onChange={(event) => setTrade({ ...trade, lotSize: event.target.value })} />
            </Field>
            <Field label="Strategy">
              <input className="field" value={trade.strategy} onChange={(event) => setTrade({ ...trade, strategy: event.target.value })} placeholder="Breakout Retest" />
            </Field>
            <div className="sm:col-span-2">
              <label className="label">Trade Notes</label>
              <textarea className="field min-h-28" value={trade.notes} onChange={(event) => setTrade({ ...trade, notes: event.target.value })} placeholder="Why are you entering? Any FOMO, early entry, or confirmation?" />
            </div>
          </div>

          <button className="primary-button mt-5 w-full" disabled={!canRate || loading} onClick={rateTrade}>
            {loading ? "Rating Trade..." : "Rate This Trade"}
          </button>
        </section>

        <aside className="panel h-fit p-5">
          <div className="mb-5 flex items-center gap-3">
            <ClipboardCheck className="text-ai" size={24} />
            <div>
              <h2 className="font-semibold">AI Trade Review</h2>
              <p className="text-sm text-slate-500">Mistakes, correction, and strategy.</p>
            </div>
          </div>

          {!result ? (
            <div className="rounded-lg border border-dashed border-line p-5 text-center">
              <p className="font-semibold">No rating yet</p>
              <p className="mt-2 text-sm leading-6 text-slate-500">{error || "Upload chart and enter trade details to receive a real review."}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-ai/30 bg-ai/10 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Trade score</span>
                  <span className="text-3xl font-bold text-ai">{result.score}/10</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#0b111a]">
                  <div className="h-full rounded-full bg-ai" style={{ width: `${Math.min(100, result.score * 10)}%` }} />
                </div>
              </div>
              <ResultBox icon={Lightbulb} title="Best working strategy" text={trade.strategy || result.pattern || "Define strategy before entry."} />
              <ResultBox icon={CheckCircle2} title="Correction" text={(result.suggestions ?? [result.advice]).join(" ")} />
              <ResultBox icon={AlertTriangle} title="Mistakes" text={(result.mistakes ?? ["No major mistake detected."]).join(" ")} danger />
              <ResultBox icon={ShieldAlert} title="Risk notes" text={(result.warnings ?? [result.risk]).join(" ")} danger={result.risk === "High"} />
            </div>
          )}
        </aside>
      </div>
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

function ResultBox({ icon: Icon, title, text, danger }: { icon: typeof Lightbulb; title: string; text: string; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? "border-loss/30 bg-loss/10" : "border-line bg-panelSoft"}`}>
      <div className="flex gap-3">
        <Icon className={danger ? "mt-0.5 text-loss" : "mt-0.5 text-ai"} size={18} />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">{text}</p>
        </div>
      </div>
    </div>
  );
}

function getApiError(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
  return axiosError.response?.data?.detail || axiosError.response?.data?.message || "Trade rating failed.";
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
