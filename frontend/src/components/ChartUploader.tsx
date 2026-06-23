import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, LineChart, UploadCloud } from "lucide-react";
import { api } from "../api/client";
import { aiInsight } from "../data/sampleData";
import { getLatestAnalysis, getSession, saveLatestAnalysis, type StoredAnalysis } from "../lib/storage";

type AnalysisResult = typeof aiInsight & {
  confidence?: number;
  riskReward?: string;
  profitLoss?: number;
  setupQuality?: string;
  validationSummary?: string;
  warnings?: string[];
  suggestions?: string[];
  mistakes?: string[];
};

const tabs = ["Summary", "Trade Plan", "Insights"] as const;

const initialTradeContext = {
  pair: "XAU/USD",
  direction: "BUY",
  entry: "",
  exit: "",
  stopLoss: "",
  takeProfit: "",
  lotSize: "1"
};

export function ChartUploader() {
  const session = getSession();
  const savedAnalysis = getLatestAnalysis(session);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Summary");
  const [toast, setToast] = useState("");
  const [analyzed, setAnalyzed] = useState(Boolean(savedAnalysis));
  const [result, setResult] = useState<AnalysisResult>(savedAnalysis ?? { ...aiInsight, confidence: 78 });
  const [tradeContext, setTradeContext] = useState(initialTradeContext);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  const canAnalyze =
    Boolean(file) &&
    Boolean(tradeContext.pair) &&
    Boolean(tradeContext.direction) &&
    Boolean(tradeContext.entry) &&
    Boolean(tradeContext.stopLoss) &&
    Boolean(tradeContext.takeProfit) &&
    Boolean(tradeContext.lotSize);
  const riskReward = useMemo(() => {
    const entry = Number(tradeContext.entry);
    const stopLoss = Number(tradeContext.stopLoss);
    const takeProfit = Number(tradeContext.takeProfit);
    const risk = Math.abs(entry - stopLoss);
    const reward = Math.abs(takeProfit - entry);
    return risk > 0 && reward > 0 ? `1:${(reward / risk).toFixed(2)}` : "Add entry, SL, TP";
  }, [tradeContext.entry, tradeContext.stopLoss, tradeContext.takeProfit]);

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (selected) {
      setFile(selected);
      setAnalyzed(false);
      setToast("Chart ready for AI analysis");
      window.setTimeout(() => setToast(""), 2200);
    }
  }

  async function analyze() {
    if (!file || !canAnalyze) {
      setToast("Add chart, entry, stop loss, take profit, and lot size");
      window.setTimeout(() => setToast(""), 2600);
      return;
    }
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("trade_id", "demo-trade");
    Object.entries(tradeContext).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("riskReward", riskReward);

    try {
      const response = await api.post<AnalysisResult>("/analysis/analyze-chart", formData);
      const nextResult = {
        ...aiInsight,
        confidence: 78,
        ...response.data,
        entry: tradeContext.entry || aiInsight.entry,
        stopLoss: tradeContext.stopLoss || aiInsight.stopLoss,
        target: tradeContext.takeProfit || aiInsight.target,
        riskReward: response.data.riskReward ?? riskReward
      };
      saveAnalysis(nextResult);
      setResult(nextResult);
    } catch (error) {
      const message =
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof error.response === "object" &&
        error.response !== null &&
        "data" in error.response &&
        typeof error.response.data === "object" &&
        error.response.data !== null &&
        "message" in error.response.data
          ? String(error.response.data.message)
          : "Backend analysis unavailable. Showing trade-plan review.";
      setToast(message);
      const nextResult = {
        ...aiInsight,
        confidence: 78,
        entry: tradeContext.entry || aiInsight.entry,
        stopLoss: tradeContext.stopLoss || aiInsight.stopLoss,
        target: tradeContext.takeProfit || aiInsight.target,
        riskReward,
        advice: "Review your planned entry, stop loss, and target against the chart before entering."
      };
      saveAnalysis(nextResult);
      setResult(nextResult);
    } finally {
      setLoading(false);
      setAnalyzed(true);
      setActiveTab("Summary");
      setToast("Analysis complete");
      window.setTimeout(() => setToast(""), 2600);
    }
  }

  function saveAnalysis(nextResult: AnalysisResult) {
    if (!session) return;

    const storedAnalysis: StoredAnalysis = {
      ...nextResult,
      pair: tradeContext.pair,
      direction: tradeContext.direction,
      createdAt: new Date().toISOString()
    };
    saveLatestAnalysis(session, storedAnalysis);
  }

  return (
    <div className="panel relative p-5 hover:border-ai/30">
      {toast && (
        <div className="absolute right-4 top-4 z-10 flex items-center gap-2 rounded-lg border border-profit/30 bg-profit/10 px-3 py-2 text-sm text-profit shadow-panel">
          <CheckCircle2 size={16} />
          {toast}
        </div>
      )}

      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AI Chart Analyzer</h2>
          <p className="mt-1 text-sm text-slate-500">Upload chart for instant AI analysis.</p>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-ai/10 text-ai">
          <UploadCloud size={20} />
        </div>
      </div>

      <label className="grid min-h-56 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-[#0b111a] p-4 text-center transition hover:border-ai/70">
        {preview ? (
          <div className="w-full">
            <img src={preview} alt="Uploaded trading chart preview" className="mx-auto max-h-64 rounded-lg object-contain" />
            <p className="mt-3 truncate text-sm text-slate-400">{file?.name}</p>
          </div>
        ) : (
          <div>
            <UploadCloud className="mx-auto mb-3 text-ai" size={34} />
            <p className="text-base font-semibold">Upload chart for instant AI analysis</p>
            <p className="mt-2 text-sm text-slate-500">One clean chart screenshot is enough. PNG or JPG works best.</p>
          </div>
        )}
        <input className="sr-only" type="file" accept="image/*" onChange={handleFile} />
      </label>

      <div className="mt-5 rounded-lg border border-line bg-[#0b0b0c] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold">Trade Details</h3>
            <p className="mt-1 text-sm text-slate-500">Add your planned levels so AI can analyze the trade setup.</p>
          </div>
          <span className="rounded-md border border-ai/30 bg-ai/10 px-3 py-1 text-xs font-semibold text-ai">
            R:R {riskReward}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Pair">
            <select className="field" value={tradeContext.pair} onChange={(event) => setTradeContext({ ...tradeContext, pair: event.target.value })}>
              <option>XAU/USD</option>
              <option>EUR/USD</option>
              <option>BTC/USD</option>
              <option>GBP/USD</option>
              <option>NAS100</option>
            </select>
          </Field>
          <Field label="Direction">
            <select className="field" value={tradeContext.direction} onChange={(event) => setTradeContext({ ...tradeContext, direction: event.target.value })}>
              <option>BUY</option>
              <option>SELL</option>
            </select>
          </Field>
          <Field label="Entry">
            <input className="field" inputMode="decimal" value={tradeContext.entry} onChange={(event) => setTradeContext({ ...tradeContext, entry: event.target.value })} placeholder="2360" />
          </Field>
          <Field label="Exit">
            <input className="field" inputMode="decimal" value={tradeContext.exit} onChange={(event) => setTradeContext({ ...tradeContext, exit: event.target.value })} placeholder="2385" />
          </Field>
          <Field label="Stop Loss">
            <input className="field" inputMode="decimal" value={tradeContext.stopLoss} onChange={(event) => setTradeContext({ ...tradeContext, stopLoss: event.target.value })} placeholder="2348" />
          </Field>
          <Field label="Take Profit">
            <input className="field" inputMode="decimal" value={tradeContext.takeProfit} onChange={(event) => setTradeContext({ ...tradeContext, takeProfit: event.target.value })} placeholder="2385" />
          </Field>
          <Field label="Lot Size">
            <input className="field" inputMode="decimal" value={tradeContext.lotSize} onChange={(event) => setTradeContext({ ...tradeContext, lotSize: event.target.value })} placeholder="1" />
          </Field>
        </div>
      </div>

      <button className="primary-button mt-4 w-full" disabled={!canAnalyze || loading} onClick={analyze}>
        {loading ? "Analyzing..." : "Analyze Chart + Trade"}
      </button>

      {loading && (
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
          <div className="skeleton h-24" />
        </div>
      )}

      {analyzed && !loading && (
        <div className="mt-5">
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-lg border border-line bg-[#0b111a] p-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                className={`rounded-md px-2 py-2 text-sm font-semibold transition ${
                  activeTab === tab ? "bg-ai text-white" : "text-slate-500 hover:text-slate-200"
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <AnalysisTabs tab={activeTab} result={result} />
        </div>
      )}
    </div>
  );
}

function AnalysisTabs({ tab, result }: { tab: (typeof tabs)[number]; result: AnalysisResult }) {
  if (tab === "Trade Plan") {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <Insight label="Entry" value={result.entry} />
        <Insight label="Stop Loss" value={result.stopLoss} tone="loss" />
        <Insight label="Take Profit" value={result.target} tone="profit" />
        <Insight label="Risk/Reward" value={result.riskReward ?? "1:2.5"} />
        <Insight label="Profit / Loss" value={`${(result.profitLoss ?? 0) >= 0 ? "+" : ""}$${(result.profitLoss ?? 0).toFixed(2)}`} tone={(result.profitLoss ?? 0) >= 0 ? "profit" : "loss"} />
        <Insight label="Setup Quality" value={result.setupQuality ?? "Review"} />
      </div>
    );
  }

  if (tab === "Insights") {
    const warnings = result.warnings?.length ? result.warnings : ["No major backend warnings."];
    const suggestions = result.suggestions?.length ? result.suggestions : [result.advice];
    const mistakes = result.mistakes?.length ? result.mistakes : ["No clear mistake detected yet."];

    return (
      <div className="space-y-3">
        <InsightRow icon={ClipboardList} title="Backend review" text={result.validationSummary ?? "Trade plan reviewed by backend."} />
        {mistakes.map((item) => (
          <InsightRow key={`mistake-${item}`} icon={ClipboardList} title="Mistake to avoid" text={item} />
        ))}
        {suggestions.map((item) => (
          <InsightRow key={`suggestion-${item}`} icon={LineChart} title="Suggestion" text={item} />
        ))}
        {warnings.map((item) => (
          <InsightRow key={`warning-${item}`} icon={AlertTriangle} title="Warning" text={item} danger />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Insight label="Trend" value={result.trend} tone="profit" />
        <Insight label="Pattern" value={result.pattern} />
        <Insight label="Score" value={`${result.score}/10`} />
        <Insight label="Risk" value={result.risk} />
      </div>
      <div className="rounded-lg border border-ai/30 bg-ai/10 p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-400">Confidence score</span>
          <span className="text-2xl font-bold text-ai">{result.confidence ?? 78}%</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[#0b111a]">
          <div className="h-full rounded-full bg-ai" style={{ width: `${result.confidence ?? 78}%` }} />
        </div>
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

function Insight({ label, value, tone }: { label: string; value: string | number; tone?: "profit" | "loss" }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""}`}>{value}</p>
    </div>
  );
}

function InsightRow({
  icon: Icon,
  title,
  text,
  danger
}: {
  icon: typeof AlertTriangle;
  title: string;
  text: string;
  danger?: boolean;
}) {
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
