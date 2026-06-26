import { ShieldAlert } from "lucide-react";
import { ChartUploader } from "../components/ChartUploader";

export function Analysis() {
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Analysis Workspace</h1>
          <p className="mt-2 text-slate-500">Upload a chart, add trade levels, review the AI report, then save it to your journal.</p>
        </div>
        <div className="rounded-lg border border-ai/30 bg-ai/10 px-4 py-3 text-sm text-ai">
          Results are educational, not financial advice.
        </div>
      </div>

      <ChartUploader />

      <div className="rounded-lg border border-loss/30 bg-loss/10 p-5">
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 text-loss" size={20} />
          <p className="text-sm leading-6 text-slate-300">
            AI should support your checklist, not replace it. Always confirm price action and risk before entering.
          </p>
        </div>
      </div>
    </div>
  );
}
