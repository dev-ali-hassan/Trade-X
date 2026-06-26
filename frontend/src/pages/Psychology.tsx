import { useState } from "react";
import { BrainCircuit } from "lucide-react";
import { getSession, getTrades } from "../lib/storage";

const moods = ["Confident", "Fear", "FOMO", "Revenge"];

export function Psychology() {
  const [mood, setMood] = useState("Confident");
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState("");
  const trades = getTrades(getSession());
  const review = getPsychologyReview(trades, savedNote || note, mood);

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
          <textarea
            className="field mt-5 min-h-32"
            value={note}
            placeholder="Write what triggered this emotion..."
            onChange={(event) => setNote(event.target.value)}
          />
          <button className="primary-button mt-4" onClick={() => setSavedNote(note.trim())}>
            Save Psychology Note
          </button>
        </div>

        <aside className="panel p-5">
          <div className="mb-4 flex items-center gap-3">
            <BrainCircuit className="text-ai" size={24} />
            <h2 className="font-semibold">AI Review</h2>
          </div>
          <p className="text-sm leading-6 text-slate-300">
            {review.summary}
          </p>
          <div className="mt-4 rounded-lg border border-ai/30 bg-ai/10 p-3">
            <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Text review</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{review.textReview}</p>
          </div>
          <div className="mt-5 space-y-3">
            <Risk label="Confident trades" value={`${review.rates.Confident}% win rate`} tone={review.rates.Confident > 0 ? "profit" : "neutral"} />
            <Risk label="Fear trades" value={`${review.rates.Fear}% win rate`} tone={review.rates.Fear > 0 ? "profit" : "neutral"} />
            <Risk label="FOMO trades" value={`${review.rates.FOMO}% win rate`} tone={review.rates.FOMO > 0 ? "profit" : "neutral"} />
            <Risk label="Revenge trades" value={`${review.rates.Revenge}% win rate`} tone={review.rates.Revenge > 0 ? "profit" : "neutral"} />
          </div>
        </aside>
      </div>
    </div>
  );
}

function Risk({ label, value, tone }: { label: string; value: string; tone: "profit" | "loss" | "neutral" }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-panelSoft p-3 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className={tone === "profit" ? "text-profit" : tone === "loss" ? "text-loss" : "text-slate-400"}>{value}</span>
    </div>
  );
}

function getPsychologyReview(trades: ReturnType<typeof getTrades>, note: string, selectedMood: string) {
  const rates = moods.reduce<Record<string, number>>((result, item) => {
    const moodTrades = trades.filter((trade) => trade.emotion === item);
    const wins = moodTrades.filter((trade) => trade.result === "Win").length;
    result[item] = moodTrades.length ? Math.round((wins / moodTrades.length) * 100) : 0;
    return result;
  }, {});

  const summary =
    trades.length === 0
      ? "No psychology trade data yet. Save trades with emotions first, then Trade-X will calculate real win rates."
      : `Based on ${trades.length} saved trades, your psychology review is calculated from your actual journal.`;

  const lowerNote = note.toLowerCase();
  let textReview = "Write a short note about your emotion to get a review based on your own words.";

  if (note.trim()) {
    if (lowerNote.includes("revenge")) {
      textReview = "Your note mentions revenge. Pause before entry, reduce size, and only trade if the setup still matches your plan.";
    } else if (lowerNote.includes("fomo") || lowerNote.includes("miss") || lowerNote.includes("late")) {
      textReview = "Your note shows possible FOMO. Wait for confirmation and avoid chasing a candle after the move already happened.";
    } else if (lowerNote.includes("fear") || lowerNote.includes("scared") || lowerNote.includes("nervous")) {
      textReview = "Your note shows fear or hesitation. Lower risk and confirm entry rules before taking the trade.";
    } else if (selectedMood === "Confident") {
      textReview = "Your note looks planned. Keep the same checklist: entry reason, invalidation, target, and risk before execution.";
    } else {
      textReview = `You selected ${selectedMood}. Add one clear rule before entry so this emotion does not control the trade.`;
    }
  }

  return { rates, summary, textReview };
}
