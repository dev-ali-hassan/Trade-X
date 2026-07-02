import { NavLink, Route, Routes, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Brain,
  ChevronRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  Menu,
  PlusCircle,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp
} from "lucide-react";
import { Dashboard } from "./pages/Dashboard";
import { AddTrade } from "./pages/AddTrade";
import { Analysis } from "./pages/Analysis";
import { TradeHistory } from "./pages/TradeHistory";
import { Strategies } from "./pages/Strategies";
import { Psychology } from "./pages/Psychology";
import { TradeRating } from "./pages/TradeRating";
import { Auth } from "./pages/Auth";
import { clearSession, getAnalysisHistory, getLatestAnalysis, getSession, getTrades, TRADEX_STORAGE_EVENT, type LocalSession } from "./lib/storage";

const navGroups = [
  {
    title: "Trading",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/add-trade", label: "Add Trade", icon: PlusCircle },
      { to: "/history", label: "History", icon: History }
    ]
  },
  {
    title: "AI",
    items: [
      { to: "/ai-analysis", label: "AI Analysis", icon: Brain },
      { to: "/trade-rating", label: "Trade Rating", icon: ClipboardCheck }
    ]
  },
  {
    title: "Performance",
    items: [
      { to: "/strategies", label: "Strategies", icon: Target },
      { to: "/psychology", label: "Psychology", icon: ShieldCheck }
    ]
  },
  {
    title: "Settings",
    items: [{ to: "/auth", label: "Settings", icon: Settings }]
  }
];

const logoSrc = `${import.meta.env.BASE_URL}logo.png`;

export default function App() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<LocalSession | null>(() => getSession());
  const [, setStorageVersion] = useState(0);
  const trades = session ? getTrades(session) : [];
  const latestAnalysis = session ? getLatestAnalysis(session) : null;
  const analysisHistory = session ? getAnalysisHistory(session) : [];
  const completedTrades = trades.filter((trade) => trade.result !== "Open");
  const isAuthRoute = location.pathname === "/auth";
  const progressSteps = [
    {
      label: "Add Trade",
      complete: trades.length > 0
    },
    {
      label: "Analyze Trade",
      complete: analysisHistory.length > 0 || Boolean(latestAnalysis)
    },
    {
      label: "Save Data",
      complete: trades.length > 0 || Boolean(latestAnalysis?.savedToJournal)
    },
    {
      label: "Get AI Assistance",
      complete: analysisHistory.length > 0 || Boolean(latestAnalysis?.confidence)
    }
  ];
  const disciplineScore = completedTrades.length
    ? Math.round((completedTrades.reduce((sum, trade) => sum + trade.aiScore, 0) / completedTrades.length) * 10)
    : 0;

  useEffect(() => {
    const refreshProgress = () => setStorageVersion((version) => version + 1);
    window.addEventListener(TRADEX_STORAGE_EVENT, refreshProgress);
    window.addEventListener("storage", refreshProgress);
    return () => {
      window.removeEventListener(TRADEX_STORAGE_EVENT, refreshProgress);
      window.removeEventListener("storage", refreshProgress);
    };
  }, []);

  if (!session) {
    return <Auth onEnter={setSession} />;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[250px_1fr]">
        <aside className="hidden border-r border-line bg-[#080808] px-5 py-4 lg:block">
          <div className="mb-6">
            <img src={logoSrc} alt="Logo" className="h-auto w-40 object-contain" />
          </div>

          <nav className="space-y-5">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2.5 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {group.title}
                </p>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <NavItem key={`${group.title}-${item.label}`} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-7 rounded-lg border border-profit/20 bg-profit/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-profit">
              <TrendingUp size={17} />
              <span className="text-sm font-semibold">Discipline Score</span>
            </div>
            <p className="text-3xl font-bold">{disciplineScore}%</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {completedTrades.length === 0 ? "Complete trades to calculate this score." : "Based on completed journal entries."}
            </p>
          </div>
        </aside>

        <main className="min-w-0 overflow-x-hidden">
          {!isAuthRoute && (
            <header className="sticky top-0 z-20 flex min-h-12 items-center justify-between border-b border-line bg-ink/88 px-4 py-2 backdrop-blur md:px-8">
              <div className="flex items-center gap-3 lg:hidden">
                <button
                  className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-slate-200"
                  onClick={() => setMobileMenuOpen(true)}
                  aria-label="Open navigation menu"
                >
                  <Menu size={18} />
                </button>
                <img src={logoSrc} alt="Logo" className="h-10 w-auto object-contain" />
              </div>
              <ProgressLine steps={progressSteps} />
              <div className="flex min-w-0 items-center gap-3">
                <button
                  className="hidden items-center gap-2 rounded-md border border-ai/60 bg-ai/10 px-3.5 py-2 text-sm font-bold text-ai shadow-[0_0_16px_rgba(224,178,51,0.12)] transition hover:border-ai hover:bg-ai/15 sm:inline-flex"
                  onClick={logout}
                  aria-label="Account menu"
                >
                  {session.mode === "demo" ? "Demo Account" : session.name}
                </button>
              </div>
            </header>
          )}

          <div className="px-4 py-3 md:px-8 md:py-4">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-trade/*" element={<AddTrade />} />
              <Route path="/analysis/*" element={<Analysis />} />
              <Route path="/ai-analysis/*" element={<Analysis />} />
              <Route path="/trade-rating/*" element={<TradeRating />} />
              <Route path="/history/*" element={<TradeHistory />} />
              <Route path="/strategies/*" element={<Strategies />} />
              <Route path="/psychology/*" element={<Psychology />} />
              <Route path="/auth/*" element={<Auth onEnter={setSession} />} />
              <Route path="*" element={<Dashboard />} />
            </Routes>
          </div>
        </main>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="h-full w-[82vw] max-w-sm border-r border-line bg-[#080808] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <img src={logoSrc} alt="Logo" className="h-auto w-36 object-contain" />
              <button className="rounded-lg border border-line p-2 text-slate-400" onClick={() => setMobileMenuOpen(false)}>
                <ChevronRight size={18} />
              </button>
            </div>
            <nav className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.title}>
                  <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">{group.title}</p>
                  <div className="space-y-1">
                    {group.items.map((item) => (
                      <NavItem key={`mobile-${group.title}-${item.label}`} {...item} onNavigate={() => setMobileMenuOpen(false)} />
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </div>
  );
}

function ProgressLine({ steps }: { steps: Array<{ label: string; complete: boolean }> }) {
  if (steps.every((step) => step.complete)) {
    return <div className="hidden min-w-0 flex-1 lg:block" />;
  }

  return (
    <div className="hidden min-w-0 flex-1 items-center lg:flex">
      <div className="w-full max-w-3xl rounded-full border-2 border-ai/35 bg-panel/80 px-7 py-3 shadow-[0_0_26px_rgba(224,178,51,0.08)]">
        <div className="relative grid grid-cols-4">
          <div className="absolute left-[12.5%] right-[12.5%] top-[9px] grid grid-cols-3 gap-0">
            {steps.slice(0, -1).map((step, index) => (
              <span
                key={`${step.label}-connector`}
                className={`h-1 rounded-full transition duration-500 ${
                  step.complete && steps[index + 1].complete ? "bg-ai shadow-[0_0_14px_rgba(224,178,51,0.35)]" : "bg-slate-500/70"
                }`}
              />
            ))}
          </div>
          {steps.map((step) => (
            <div key={step.label} className="relative z-10 flex flex-col items-center text-center">
              <span
                className={`grid h-5 w-5 place-items-center rounded-full border-2 transition ${
                  step.complete ? "border-ai bg-ai shadow-glow" : "border-slate-300 bg-ink"
                }`}
                aria-label={`${step.label} ${step.complete ? "completed" : "pending"}`}
              >
                <span className={`h-2 w-2 rounded-full ${step.complete ? "bg-black" : "bg-transparent"}`} />
              </span>
              <span className={`mt-1.5 text-xs font-semibold ${step.complete ? "text-ai" : "text-slate-400"}`}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function NavItem({
  to,
  label,
  icon: Icon,
  onNavigate
}: {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
          isActive
            ? "bg-ai/12 text-ai shadow-glow"
            : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
        }`
      }
    >
      <Icon size={18} />
      <span>{label}</span>
    </NavLink>
  );
}
