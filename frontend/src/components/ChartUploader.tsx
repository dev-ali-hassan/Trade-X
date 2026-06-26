import { ChangeEvent, ReactNode, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, CheckCircle2, ClipboardList, LineChart, ShieldAlert, Target, UploadCloud } from "lucide-react";
import { AxiosError } from "axios";
import { api } from "../api/client";
import {
  getAnalysisHistory,
  getLatestAnalysis,
  getSession,
  saveAnalysisHistory,
  saveAnalysisToJournal,
  saveLatestAnalysis,
  type StoredAnalysis
} from "../lib/storage";

type ChartAnalysis = {
  asset: string;
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
  indicators: {
    ema: string;
    rsi: string;
    macd: string;
    volume: string;
    atr: string;
  };
  reasoning: string;
  risks: string[];
  alternativeScenario: string;
  chartImage?: string;
  savedToJournal?: boolean;
  createdAt?: string;
};

type NormalizableAnalysis = StoredAnalysis | ChartAnalysis;

const loadingSteps = [
  "Analyzing chart...",
  "Detecting market structure...",
  "Finding support/resistance...",
  "Building trade plan..."
];

const initialContext = {
  asset: "BTC/USD",
  timeframe: "15 Minutes",
  tradingStyle: "Day Trading",
  riskPercent: "1",
  accountBalance: "5000"
};

export function ChartUploader() {
  const session = getSession();
  const savedAnalysis = normalizeStoredAnalysis(getLatestAnalysis(session));
  const [file, setFile] = useState<File | null>(null);
  const [chartImage, setChartImage] = useState(savedAnalysis?.chartImage ?? "");
  const [context, setContext] = useState(initialContext);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ChartAnalysis | null>(savedAnalysis);

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : chartImage), [chartImage, file]);
  const history = getAnalysisHistory(session).map(normalizeStoredAnalysis).filter((item): item is ChartAnalysis => Boolean(item)).slice(0, 4);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0];
    if (!selected) return;

    setFile(selected);
    setChartImage(await readFileAsDataUrl(selected));
    setResult(null);
    setError("");
    showToast("Chart ready for analysis");
  }

  async function analyze() {
    if (!file) {
      showToast("Upload a chart image first");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("image", file);
    formData.append("trade_id", "demo-trade");
    Object.entries(context).forEach(([key, value]) => formData.append(key, value));

    try {
      const response = await api.post<ChartAnalysis>("/analysis/analyze-chart", formData);
      const nextResult = normalizeStoredAnalysis({
        ...response.data,
        chartImage,
        savedToJournal: false,
        createdAt: new Date().toISOString()
      });
      if (!nextResult) throw new Error("AI response could not be displayed.");
      saveAnalysis(nextResult);
      setResult(nextResult);
      showToast("AI chart report complete");
    } catch (requestError) {
      const message = getApiError(requestError);
      setError(message);
      setResult(null);
      showToast("Chart analysis failed");
    } finally {
      setLoading(false);
    }
  }

  function saveAnalysis(nextResult: ChartAnalysis) {
    if (!session) return;

    saveLatestAnalysis(session, nextResult as StoredAnalysis);
    saveAnalysisHistory(session, nextResult as StoredAnalysis);
  }

  function saveToJournal() {
    if (!session || !result) return;

    const storedAnalysis = {
      ...result,
      chartImage,
      savedToJournal: true,
      createdAt: result.createdAt ?? new Date().toISOString()
    };
    saveAnalysisToJournal(session, storedAnalysis as StoredAnalysis);
    saveLatestAnalysis(session, storedAnalysis as StoredAnalysis);
    setResult(storedAnalysis);
    showToast("Saved to journal");
  }

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed right-4 top-20 z-30 rounded-lg border border-ai/30 bg-ai/10 px-4 py-3 text-sm text-ai shadow-panel">
          {toast}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="panel p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Chart Upload</h2>
              <p className="mt-1 text-sm text-slate-500">Upload a chart screenshot and choose analysis context.</p>
            </div>
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-ai/10 text-ai">
              <UploadCloud size={20} />
            </div>
          </div>

          <label className="grid min-h-64 cursor-pointer place-items-center rounded-lg border border-dashed border-line bg-[#0b111a] p-4 text-center transition hover:border-ai/70">
            {preview ? (
              <div className="w-full">
                <img src={preview} alt="Uploaded trading chart preview" className="mx-auto max-h-80 rounded-lg object-contain" />
                <p className="mt-3 truncate text-sm text-slate-400">{file?.name ?? "Saved chart preview"}</p>
              </div>
            ) : (
              <div>
                <UploadCloud className="mx-auto mb-3 text-ai" size={34} />
                <p className="text-base font-semibold">Upload chart for instant AI analysis</p>
                <p className="mt-2 text-sm text-slate-500">TradingView, MT5, crypto, forex, or indices screenshot.</p>
              </div>
            )}
            <input className="sr-only" type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} />
          </label>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Field label="Asset">
              <input className="field" value={context.asset} onChange={(event) => setContext({ ...context, asset: event.target.value })} placeholder="BTC/USD" />
            </Field>
            <Field label="Timeframe">
              <select className="field" value={context.timeframe} onChange={(event) => setContext({ ...context, timeframe: event.target.value })}>
                <option>5 Minutes</option>
                <option>15 Minutes</option>
                <option>30 Minutes</option>
                <option>1 Hour</option>
                <option>4 Hours</option>
                <option>1 Day</option>
              </select>
            </Field>
            <Field label="Trading Style">
              <select className="field" value={context.tradingStyle} onChange={(event) => setContext({ ...context, tradingStyle: event.target.value })}>
                <option>Scalping</option>
                <option>Day Trading</option>
                <option>Swing Trading</option>
              </select>
            </Field>
            <Field label="Risk %">
              <input className="field" inputMode="decimal" value={context.riskPercent} onChange={(event) => setContext({ ...context, riskPercent: event.target.value })} />
            </Field>
            <Field label="Account Balance">
              <input className="field" inputMode="decimal" value={context.accountBalance} onChange={(event) => setContext({ ...context, accountBalance: event.target.value })} />
            </Field>
          </div>

          <button className="primary-button mt-5 w-full" disabled={!file || loading} onClick={analyze}>
            {loading ? "Analyzing Chart..." : "Analyze Chart"}
          </button>
        </section>

        <aside className="panel h-fit p-5">
          <div className="mb-4 flex items-center gap-3">
            <ClipboardList className="text-ai" size={22} />
            <div>
              <h2 className="font-semibold">Analysis History</h2>
              <p className="text-sm text-slate-500">Latest chart reports saved locally.</p>
            </div>
          </div>
          {history.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line p-4 text-sm text-slate-500">
              No analysis history yet.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((item) => (
                <div key={item.createdAt ?? item.asset} className="rounded-lg border border-line bg-panelSoft p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{item.asset || "Chart"}</span>
                    <span className="text-xs text-ai">{item.confidence ?? 0}%</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{[item.direction, item.strategy].filter(Boolean).join(" - ")}</p>
                </div>
              ))}
            </div>
          )}
        </aside>
      </div>

      {loading && (
        <div className="panel p-5">
          <div className="grid gap-3 md:grid-cols-4">
            {loadingSteps.map((step) => (
              <div key={step} className="rounded-lg border border-line bg-panelSoft p-4">
                <div className="skeleton mb-3 h-2 w-full" />
                <p className="text-sm font-semibold text-slate-300">{step}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-loss/30 bg-loss/10 p-4 text-sm leading-6 text-loss">
          {error}
        </div>
      )}

      {result && !loading && <ReportDashboard result={result} onSave={saveToJournal} />}
    </div>
  );
}

function ReportDashboard({ result, onSave }: { result: ChartAnalysis; onSave: () => void }) {
  const direction = result.direction || "NO TRADE";
  const confidence = Math.max(0, Math.min(100, result.confidence ?? 0));

  return (
    <section className="panel p-5">
      <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-xl font-bold">Professional AI Report</h2>
          <p className="mt-1 text-sm text-slate-500">Probability-based analysis. Not financial advice.</p>
        </div>
        <button className="primary-button" onClick={onSave}>Save To Journal</button>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <ReportCard title="Trade Summary" icon={BarChart3}>
          <Metric label="Asset" value={result.asset} />
          <Metric label="Direction" value={direction} tone={isLong(direction) ? "profit" : isShort(direction) ? "loss" : undefined} />
          <Metric label="Confidence" value={`${confidence}%`} />
          <Metric label="Strategy" value={result.strategy} />
        </ReportCard>
        <ReportCard title="Entry" icon={Target}>
          <Metric label="Entry Zone" value={result.entry.zone} />
          <Metric label="Reason" value={result.entry.reason} />
          <Metric label="Market Structure" value={result.marketStructure} />
        </ReportCard>
        <ReportCard title="Risk" icon={ShieldAlert}>
          <Metric label="Stop Loss" value={result.risk.stopLoss} tone="loss" />
          <Metric label="Risk Reward" value={result.risk.riskReward} />
          <Metric label="Invalidation" value={result.risk.invalidation} />
        </ReportCard>
        <ReportCard title="Targets" icon={LineChart}>
          {result.targets.map((target, index) => (
            <Metric key={`${target.name}-${index}`} label={target.name || `TP${index + 1}`} value={[target.price, target.reason].filter(Boolean).join(" - ")} tone="profit" />
          ))}
        </ReportCard>
      </div>

      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_360px]">
        <div className="grid gap-4 md:grid-cols-2">
          <ListCard title="Why this trade?" items={[result.reasoning]} icon={CheckCircle2} />
          <ListCard title="Risks" items={result.risks} icon={AlertTriangle} danger />
          <ListCard title="Alternative Scenario" items={[result.alternativeScenario]} icon={ShieldAlert} danger />
          <ListCard title="Trade Plan" items={result.targets.map((target) => `${target.name}: ${target.price}${target.reason ? ` - ${target.reason}` : ""}`)} icon={BarChart3} />
        </div>
        <div className="rounded-lg border border-line bg-panelSoft p-4">
          <h3 className="font-semibold">Indicator Analysis</h3>
          <div className="mt-4 space-y-3">
            <Metric label="EMA" value={result.indicators.ema} />
            <Metric label="RSI" value={result.indicators.rsi} />
            <Metric label="MACD" value={result.indicators.macd} />
            <Metric label="Volume" value={result.indicators.volume} />
            <Metric label="ATR" value={result.indicators.atr} />
          </div>
        </div>
      </div>
    </section>
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

function ReportCard({ title, icon: Icon, children }: { title: string; icon: typeof BarChart3; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-panelSoft p-4">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="text-ai" size={18} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number | undefined; tone?: "profit" | "loss" }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : ""}`}>{value}</p>
    </div>
  );
}

function ListCard({ title, items, icon: Icon, danger }: { title: string; items: string[]; icon: typeof CheckCircle2; danger?: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${danger ? "border-loss/30 bg-loss/10" : "border-line bg-panelSoft"}`}>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={danger ? "text-loss" : "text-profit"} size={18} />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-2">
        {items.filter(Boolean).map((item) => (
          <p key={item} className="text-sm leading-6 text-slate-400">{item}</p>
        ))}
      </div>
    </div>
  );
}

function isLong(direction: string) {
  return direction.includes("LONG") || direction.includes("BUY");
}

function isShort(direction: string) {
  return direction.includes("SHORT") || direction.includes("SELL");
}

function getApiError(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string; detail?: string }>;
  return axiosError.response?.data?.detail || axiosError.response?.data?.message || "AI chart analysis failed.";
}

function normalizeStoredAnalysis(input: NormalizableAnalysis | null): ChartAnalysis | null {
  if (!input) return null;
  const legacy = input as StoredAnalysis;
  const current = input as ChartAnalysis;

  const entry = typeof current.entry === "object" && current.entry !== null
    ? current.entry
    : {
      zone: typeof legacy.entry === "string" ? legacy.entry : legacy.entryZone ?? "",
      reason: legacy.validationSummary ?? ""
    };

  const risk = typeof current.risk === "object" && current.risk !== null
    ? current.risk
    : {
      stopLoss: legacy.stopLoss ?? "",
      riskReward: legacy.riskReward ?? "",
      invalidation: legacy.validationSummary ?? ""
    };

  const indicators: Partial<ChartAnalysis["indicators"]> = current.indicators
    ? current.indicators
    : {};

  const targets = Array.isArray(input.targets)
    ? input.targets.map((target, index) => typeof target === "object"
      ? {
        name: target.name || `TP${index + 1}`,
        price: target.price ?? "",
        reason: target.reason ?? ""
      }
      : {
        name: `TP${index + 1}`,
        price: target,
        reason: ""
      })
    : legacy.target
      ? [{ name: "TP1", price: legacy.target, reason: "" }]
      : [];

  return {
    asset: input.asset ?? legacy.pair ?? "",
    direction: input.direction ?? "",
    confidence: input.confidence ?? 0,
    strategy: input.strategy ?? legacy.pattern ?? "",
    marketStructure: input.marketStructure ?? legacy.trend ?? legacy.structure ?? "",
    entry: {
      zone: entry.zone ?? "",
      reason: entry.reason ?? ""
    },
    risk: {
      stopLoss: risk.stopLoss ?? "",
      riskReward: risk.riskReward ?? "",
      invalidation: risk.invalidation ?? ""
    },
    targets,
    indicators: {
      ema: indicators.ema ?? "",
      rsi: indicators.rsi ?? "",
      macd: indicators.macd ?? "",
      volume: indicators.volume ?? "",
      atr: indicators.atr ?? ""
    },
    reasoning: input.reasoning ?? legacy.advice ?? legacy.validationSummary ?? "",
    risks: current.risks ?? legacy.warnings ?? [],
    alternativeScenario: input.alternativeScenario ?? "",
    chartImage: input.chartImage,
    savedToJournal: input.savedToJournal,
    createdAt: input.createdAt
  };
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
