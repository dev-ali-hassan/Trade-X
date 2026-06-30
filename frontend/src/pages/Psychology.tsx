import { useState } from "react";
import {
  BrainCircuit,
  CheckCircle2,
  CircleHelp,
  Frown,
  HeartPulse,
  Lock,
  ShieldCheck,
  Smile,
  Sparkles
} from "lucide-react";
import {
  getPsychologyEntries,
  getSession,
  savePsychologyEntry,
  type PsychologyEmotion
} from "../lib/storage";

const moods = [
  { name: "Confident", description: "Following the plan.", icon: Smile, tone: "text-ai" },
  { name: "Fear", description: "Needs extra confirmation.", icon: Frown, tone: "text-loss" },
  { name: "FOMO", description: "Rushed or afraid to miss out.", icon: CircleHelp, tone: "text-ai" },
  { name: "Revenge", description: "Trying to win back losses.", icon: BrainCircuit, tone: "text-ai" },
  { name: "Doubtful", description: "Not sure about the setup.", icon: HeartPulse, tone: "text-loss" },
  { name: "Calm / Neutral", description: "Feeling balanced.", icon: ShieldCheck, tone: "text-profit" }
] as const;

export function Psychology() {
  const [mood, setMood] = useState<PsychologyEmotion>("Confident");
  const [saved, setSaved] = useState(false);
  const session = getSession();
  const [entries, setEntries] = useState(() => getPsychologyEntries(session));
  const review = getPsychologyReview(entries, mood);

  function saveEmotion() {
    if (!session) return;

    savePsychologyEntry(session, {
      id: Date.now(),
      emotion: mood,
      createdAt: new Date().toISOString()
    });

    setEntries(getPsychologyEntries(session));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2200);
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        <div>
          <div className="flex items-center gap-3">
            <BrainCircuit className="text-ai" size={30} />
            <h1 className="text-3xl font-bold tracking-tight">Psychology Tracker</h1>
          </div>
          <p className="mt-2 text-base text-slate-500">Understand your emotions. Improve your discipline. Become a consistent trader.</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_420px]">
        <section className="panel p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={20} className="text-ai" />
                <h2 className="text-lg font-semibold">1. How did you feel before this trade?</h2>
              </div>
              <p className="mt-2 text-sm text-slate-500">Be honest. Your emotions drive your decisions.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-line bg-panelSoft px-3 py-2 text-sm text-slate-300">
              <CircleHelp size={16} className="text-ai" />
              Why it matters?
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {moods.map((item) => {
              const Icon = item.icon;
              const active = mood === item.name;
              return (
                <button
                  key={item.name}
                  className={`rounded-lg border-2 p-4 text-left transition hover:border-ai/60 ${
                    active ? "border-ai bg-ai/10 shadow-[0_0_26px_rgba(224,178,51,0.12)]" : "border-line bg-panelSoft"
                  }`}
                  onClick={() => {
                    setMood(item.name);
                    setSaved(false);
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Icon size={18} className={item.tone} />
                        <span className={`font-semibold ${active ? "text-ai" : "text-slate-100"}`}>{item.name}</span>
                      </div>
                      <p className="mt-3 text-sm text-slate-500">{item.description}</p>
                    </div>
                    {active && <CheckCircle2 className="text-ai" size={20} />}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              className="primary-button min-w-64"
              onClick={saveEmotion}
            >
              <ShieldCheck size={18} />
              Save Psychology Note
            </button>
            <div className="inline-flex items-center gap-2 text-sm text-profit">
              <Lock size={15} />
              {saved ? "Saved privately" : "Private & secure"}
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="panel p-5 md:p-6">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <Sparkles className="text-ai" size={24} />
                <h2 className="text-lg font-semibold">AI Review</h2>
              </div>
              <span className="rounded-md border border-ai/30 bg-ai/10 px-2 py-1 text-xs font-semibold text-ai">Beta</span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-400">{review.summary}</p>
            <div className="mt-5 rounded-lg border-2 border-ai/20 bg-ai/10 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ai">Current psychology read</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">{review.insight}</p>
            </div>

            <div className="mt-5 rounded-lg border-2 border-ai/20 bg-panelSoft p-4">
              <h3 className="text-sm font-semibold">
                Your Emotion Stats <span className="font-normal text-slate-500">(Based on {entries.length} saved {entries.length === 1 ? "entry" : "entries"})</span>
              </h3>
              <div className="mt-4 space-y-4">
                {moods.map((item) => {
                  const Icon = item.icon;
                  const stat = review.stats[item.name] ?? 0;
                  return (
                    <div key={item.name} className="grid grid-cols-[128px_1fr_42px] items-center gap-3 text-sm">
                      <div className="flex min-w-0 items-center gap-2">
                        <Icon size={16} className={item.tone} />
                        <span className="truncate text-slate-400">{item.name} entries</span>
                      </div>
                      <div className="h-2 rounded-full bg-[#0b0b0c]">
                        <div className="h-full rounded-full bg-ai transition-all" style={{ width: `${stat}%` }} />
                      </div>
                      <span className="text-right font-semibold text-slate-300">{stat}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel p-5">
            <div className="flex gap-3">
              <CircleHelp className="mt-1 text-ai" size={20} />
              <div>
                <h3 className="font-semibold">Tip</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  The more honest your notes are, the better Trade-X can help you grow.
                </p>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function getPsychologyReview(entries: ReturnType<typeof getPsychologyEntries>, selectedMood: string) {
  const total = Math.max(1, entries.length);
  const stats = moods.reduce<Record<string, number>>((result, item) => {
    const moodEntries = entries.filter((entry) => entry.emotion === item.name);
    result[item.name] = entries.length ? Math.round((moodEntries.length / total) * 100) : 0;
    return result;
  }, {});

  const summary =
    entries.length === 0
      ? "Select your current emotion and save it. Trade-X will build your psychology pattern from saved entries."
      : "Trade-X analyzes your psychology pattern based only on your saved emotion entries.";

  let insight = "";

  if (selectedMood === "Revenge") {
    insight = "Revenge pressure can turn one loss into a bigger mistake. Pause, reduce risk, and only continue if the next setup is truly clean.";
  } else if (selectedMood === "FOMO") {
    insight = "This looks like a FOMO risk. Wait for confirmation instead of chasing price. A missed trade is better than a forced entry.";
  } else if (selectedMood === "Fear") {
    insight = "Fear usually means the trade needs clearer confirmation or smaller risk. Check entry, stop loss, and invalidation before clicking buy or sell.";
  } else if (selectedMood === "Doubtful") {
    insight = "Doubt is a warning signal. If the setup is not obvious, skip the trade or wait until price gives a cleaner confirmation.";
  } else if (selectedMood === "Calm / Neutral") {
    insight = "Calm is a strong trading state. Keep following the checklist and avoid increasing lot size just because the setup feels easy.";
  } else {
    insight = "Confidence is useful when it comes from a plan. Before entry, confirm the setup, risk, stop loss, and target so confidence does not turn into overtrading.";
  }

  return { stats, summary, insight };
}
