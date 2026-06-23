import { Brain, CheckCircle2, ShieldAlert, UploadCloud } from "lucide-react";
import { ChartUploader } from "../components/ChartUploader";

export function Analysis() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Chart Analysis</h1>
          <p className="mt-2 text-slate-500">Upload one clean trading chart and turn it into a simple trade plan.</p>
        </div>
        <div className="rounded-lg border border-ai/30 bg-ai/10 px-4 py-3 text-sm text-ai">
          Results are educational, not financial advice.
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <ChartUploader />

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-ai/10 text-ai">
                <Brain size={20} />
              </div>
              <div>
                <h2 className="font-semibold">How AI reads it</h2>
                <p className="text-sm text-slate-500">Three focused outputs.</p>
              </div>
            </div>
            <div className="space-y-3">
              <Step icon={UploadCloud} title="Summary" text="Trend, pattern, and confidence score." />
              <Step icon={CheckCircle2} title="Trade Plan" text="Entry, SL, TP, and risk/reward." />
              <Step icon={ShieldAlert} title="Insights" text="Mistakes, suggestions, and warnings." />
            </div>
          </div>

          <div className="rounded-lg border border-loss/30 bg-loss/10 p-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 text-loss" size={20} />
              <p className="text-sm leading-6 text-slate-300">
                AI should support your checklist, not replace it. Always confirm price action and risk before entering.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Step({ icon: Icon, title, text }: { icon: typeof UploadCloud; title: string; text: string }) {
  return (
    <div className="flex gap-3 rounded-lg border border-line bg-panelSoft p-3">
      <Icon className="mt-0.5 text-ai" size={18} />
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
      </div>
    </div>
  );
}
