import { useState } from "react";
import { BrainCircuit } from "lucide-react";

const moods = ["Confident", "Fear", "FOMO", "Revenge"];

export function Psychology() {
  const [mood, setMood] = useState("Confident");

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Psychology Tracker</h1>
        <p className="mt-2 text-slate-500">Track your emotion before each trade and spot discipline leaks.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="panel p-5">
          <h2 className="text-lg font-semibold">How do you feel before this trade?</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {moods.map((item) => (
              <button
                key={item}
                className={`rounded-lg border p-4 text-left transition ${
                  mood === item ? "border-ai bg-ai/10 text-ai" : "border-line bg-panelSoft text-slate-300 hover:border-ai/60"
                }`}
                onClick={() => setMood(item)}
              >
                <span className="font-semibold">{item}</span>
                <p className="mt-2 text-sm text-slate-500">
                  {item === "Confident" ? "Following the plan." : "Needs extra confirmation before entry."}
                </p>
              </button>
            ))}
          </div>
          <textarea className="field mt-5 min-h-32" placeholder="Write what triggered this emotion..." />
          <button className="primary-button mt-4">Save Psychology Note</button>
        </div>

        <aside className="panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <BrainCircuit className="text-ai" size={24} />
            <h2 className="font-semibold">AI Review</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            Your losses increase when entering with FOMO or revenge. Your strongest setup appears when you wait for breakout confirmation.
          </p>
          <div className="mt-5 space-y-3">
            <Risk label="Confident trades" value="72% win rate" tone="profit" />
            <Risk label="FOMO trades" value="38% win rate" tone="loss" />
            <Risk label="Revenge trades" value="31% win rate" tone="loss" />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Risk({ label, value, tone }: { label: string; value: string; tone: "profit" | "loss" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-panelSoft p-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={tone === "profit" ? "text-profit" : "text-loss"}>{value}</span>
    </div>
  );
}
