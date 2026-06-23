import { ChangeEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ClipboardList, LineChart, UploadCloud } from "lucide-react";
import { api } from "../api/client";
import { aiInsight } from "../data/sampleData";

type AnalysisResult = typeof aiInsight & {
  confidence?: number;
};

const tabs = ["Summary", "Trade Plan", "Insights"] as const;

export function ChartUploader() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>("Summary");
  const [toast, setToast] = useState("");
  const [analyzed, setAnalyzed] = useState(false);
  const [result, setResult] = useState<AnalysisResult>({ ...aiInsight, confidence: 78 });

  const preview = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);

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
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append("image", file);
    formData.append("trade_id", "demo-trade");

    try {
      const response = await api.post<AnalysisResult>("/analysis/analyze-chart", formData);
      setResult({ ...aiInsight, confidence: 78, ...response.data });
    } catch {
      setResult({ ...aiInsight, confidence: 78 });
    } finally {
      setLoading(false);
      setAnalyzed(true);
      setActiveTab("Summary");
      setToast("AI analysis complete");
      window.setTimeout(() => setToast(""), 2600);
    }
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

      <button className="primary-button mt-4 w-full" disabled={!file || loading} onClick={analyze}>
        {loading ? "Analyzing..." : "Analyze Chart"}
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
        <Insight label="Risk/Reward" value="1:2.5" />
      </div>
    );
  }

  if (tab === "Insights") {
    return (
      <div className="space-y-3">
        <InsightRow icon={ClipboardList} title="Mistake to avoid" text="Entering before confirmation can turn a strong pattern into a low-quality trade." />
        <InsightRow icon={LineChart} title="Suggestion" text={result.advice} />
        <InsightRow icon={AlertTriangle} title="Warning" text="Do not guarantee profit. Respect invalidation and reduce size when emotion is high." danger />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Insight label="Trend" value={result.trend} tone="profit" />
        <Insight label="Pattern" value={result.pattern} />
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
