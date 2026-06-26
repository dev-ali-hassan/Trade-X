import { NavLink, Route, Routes } from "react-router-dom";
import { useState } from "react";
import {
  Brain,
  ChevronRight,
  ClipboardCheck,
  History,
  LayoutDashboard,
  LogOut,
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
import { clearSession, getSession, getTrades, type LocalSession } from "./lib/storage";

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

export default function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [session, setSession] = useState<LocalSession | null>(() => getSession());
  const trades = session ? getTrades(session) : [];
  const completedTrades = trades.filter((trade) => trade.profit !== 0);
  const disciplineScore = completedTrades.length
    ? Math.round((completedTrades.reduce((sum, trade) => sum + trade.aiScore, 0) / completedTrades.length) * 10)
    : 0;

  if (!session) {
    return <Auth onEnter={setSession} />;
  }

  function logout() {
    clearSession();
    setSession(null);
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-ink text-slate-100">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r border-line bg-[#080808] px-5 py-6 lg:block">
          <div className="mb-8">
            <img src="/logo.png" alt="Logo" className="h-auto w-40 object-contain" />
          </div>

          <nav className="space-y-6">
            {navGroups.map((group) => (
              <div key={group.title}>
                <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-600">
                  {group.title}
                </p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <NavItem key={`${group.title}-${item.label}`} {...item} />
                  ))}
                </div>
              </div>
            ))}
          </nav>

          <div className="mt-8 rounded-lg border border-profit/20 bg-profit/5 p-4">
            <div className="mb-3 flex items-center gap-2 text-profit">
              <TrendingUp size={18} />
              <span className="text-sm font-semibold">Discipline Score</span>
            </div>
            <p className="text-3xl font-bold">{disciplineScore}%</p>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              {completedTrades.length === 0 ? "Complete trades to calculate this score." : "Based on completed journal entries."}
            </p>
          </div>
        </aside>

        <main className="min-w-0 overflow-x-hidden">
          <header className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-ink/88 px-4 py-4 backdrop-blur md:px-8">
            <div className="flex items-center gap-3 lg:hidden">
              <button
                className="grid h-9 w-9 place-items-center rounded-lg border border-line bg-panel text-slate-200"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Open navigation menu"
              >
                <Menu size={18} />
              </button>
              <img src="/logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </div>
            <div className="hidden md:block" />
            <div className="flex min-w-0 items-center gap-3">
              <div className="hidden rounded-lg border border-line bg-panel px-3 py-2 text-sm text-slate-300 sm:block">
                {session.mode === "demo" ? "Demo Mode" : session.name}
              </div>
              <button className="rounded-lg border border-line p-2 text-slate-400 transition hover:text-slate-100" onClick={logout} aria-label="Logout">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          <div className="px-4 py-6 md:px-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/add-trade" element={<AddTrade />} />
              <Route path="/analysis" element={<Analysis />} />
              <Route path="/ai-analysis" element={<Analysis />} />
              <Route path="/trade-rating" element={<TradeRating />} />
              <Route path="/history" element={<TradeHistory />} />
              <Route path="/strategies" element={<Strategies />} />
              <Route path="/psychology" element={<Psychology />} />
              <Route path="/auth" element={<Auth onEnter={setSession} />} />
            </Routes>
          </div>
        </main>
      </div>
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden" onClick={() => setMobileMenuOpen(false)}>
          <aside className="h-full w-[82vw] max-w-sm border-r border-line bg-[#080808] p-5" onClick={(event) => event.stopPropagation()}>
            <div className="mb-6 flex items-center justify-between">
              <img src="/logo.png" alt="Logo" className="h-auto w-36 object-contain" />
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
        `group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
