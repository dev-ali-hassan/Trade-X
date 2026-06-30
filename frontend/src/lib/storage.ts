import type { Trade } from "../data/sampleData";

export type LocalSession = {
  mode: "demo" | "account";
  name: string;
  email: string;
};

export type StoredAnalysis = {
  id?: string;
  asset?: string;
  timeframe?: string;
  tradingStyle?: string;
  marketStructure?: string;
  entry?: {
    zone: string;
    reason: string;
  } | string;
  risk?: {
    stopLoss: string;
    riskReward: string;
    invalidation: string;
  } | string;
  indicators?: {
    ema?: string;
    rsi?: string;
    macd?: string;
    volume?: string;
    atr?: string;
  };
  targets?: Array<{
    name: string;
    price: string;
    reason: string;
  }> | string[];
  risks?: string[];
  alternativeScenario?: string;
  reasoning?: string;
  trend?: string;
  pattern?: string;
  candlestick?: string;
  support?: string;
  resistance?: string;
  entryZone?: string;
  stopLoss?: string;
  target?: string;
  score?: number;
  advice?: string;
  confidence?: number;
  riskReward?: string;
  profitLoss?: number;
  setupQuality?: string;
  validationSummary?: string;
  warnings?: string[];
  suggestions?: string[];
  mistakes?: string[];
  pair?: string;
  direction?: string;
  structure?: string;
  strategy?: string;
  chartImage?: string;
  savedToJournal?: boolean;
  createdAt: string;
};

export type PsychologyEmotion = "Confident" | "Fear" | "FOMO" | "Revenge" | "Doubtful" | "Calm / Neutral";

export type PsychologyEntry = {
  id: number;
  emotion: PsychologyEmotion;
  createdAt: string;
};

type LocalUser = {
  name: string;
  email: string;
  password: string;
};

const SESSION_KEY = "tradex_session";
const USERS_KEY = "tradex_users";
export const TRADEX_STORAGE_EVENT = "tradex-storage-updated";

export function getSession(): LocalSession | null {
  return readJson<LocalSession | null>(SESSION_KEY, null);
}

export function saveSession(session: LocalSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  notifyStorageUpdated();
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  notifyStorageUpdated();
}

export function createDemoSession(): LocalSession {
  const session: LocalSession = { mode: "demo", name: "Demo Trader", email: "demo@local" };
  localStorage.setItem("tradex_demo_trades", JSON.stringify([]));
  localStorage.removeItem("tradex_demo_latest_analysis");
  localStorage.removeItem("tradex_demo_analysis_history");
  localStorage.removeItem("tradex_demo_psychology");
  saveSession(session);
  return session;
}

export function registerLocalUser(name: string, email: string, password: string): LocalSession {
  const users = getUsers();
  const normalizedEmail = email.trim().toLowerCase();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  users.push({ name: name.trim() || "Trader", email: normalizedEmail, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

  const session: LocalSession = { mode: "account", name: name.trim() || "Trader", email: normalizedEmail };
  saveSession(session);
  ensureTradeKey(session);
  return session;
}

export function loginLocalUser(email: string, password: string): LocalSession {
  const normalizedEmail = email.trim().toLowerCase();
  const user = getUsers().find((item) => item.email === normalizedEmail && item.password === password);

  if (!user) {
    throw new Error("Email or password is not correct.");
  }

  const session: LocalSession = { mode: "account", name: user.name, email: user.email };
  saveSession(session);
  ensureTradeKey(session);
  return session;
}

export function getTrades(session: LocalSession | null): Trade[] {
  if (!session) return [];

  const key = tradeKey(session);
  const trades = readJson<Trade[]>(key, []);
  const cleaned = trades.filter((trade) => !isLegacySampleTrade(trade));
  if (cleaned.length !== trades.length) {
    localStorage.setItem(key, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveTrade(session: LocalSession, trade: Trade) {
  const current = getTrades(session);
  const next = [trade, ...current.filter((item) => item.id !== trade.id)];
  localStorage.setItem(tradeKey(session), JSON.stringify(next));
  notifyStorageUpdated();
}

export function getLatestAnalysis(session: LocalSession | null): StoredAnalysis | null {
  if (!session) return null;

  const key = analysisKey(session);
  const analysis = readJson<StoredAnalysis | null>(key, null);
  if (analysis && isLegacySampleAnalysis(analysis)) {
    localStorage.removeItem(key);
    return null;
  }
  return analysis;
}

export function saveLatestAnalysis(session: LocalSession, analysis: StoredAnalysis) {
  localStorage.setItem(analysisKey(session), JSON.stringify(analysis));
  notifyStorageUpdated();
}

export function getAnalysisHistory(session: LocalSession | null): StoredAnalysis[] {
  if (!session) return [];

  const key = analysisHistoryKey(session);
  const history = readJson<StoredAnalysis[]>(key, []);
  const cleaned = history.filter((analysis) => !isLegacySampleAnalysis(analysis));
  if (cleaned.length !== history.length) {
    localStorage.setItem(key, JSON.stringify(cleaned));
  }
  return cleaned;
}

export function saveAnalysisHistory(session: LocalSession, analysis: StoredAnalysis) {
  const current = getAnalysisHistory(session);
  const nextAnalysis = { ...analysis, id: analysis.id ?? String(Date.now()) };
  const next = [nextAnalysis, ...current.filter((item) => item.id !== nextAnalysis.id)].slice(0, 25);
  localStorage.setItem(analysisHistoryKey(session), JSON.stringify(next));
  notifyStorageUpdated();
}

export function getPsychologyEntries(session: LocalSession | null): PsychologyEntry[] {
  if (!session) return [];
  return readJson<PsychologyEntry[]>(psychologyKey(session), []);
}

export function savePsychologyEntry(session: LocalSession, entry: PsychologyEntry) {
  const current = getPsychologyEntries(session);
  const next = [entry, ...current].slice(0, 100);
  localStorage.setItem(psychologyKey(session), JSON.stringify(next));
  notifyStorageUpdated();
}

export function saveAnalysisToJournal(session: LocalSession, analysis: StoredAnalysis) {
  const entryZone = typeof analysis.entry === "object" ? analysis.entry.zone : analysis.entry ?? analysis.entryZone;
  const riskPlan = typeof analysis.risk === "object" ? analysis.risk : null;
  const firstTarget = Array.isArray(analysis.targets) ? analysis.targets[0] : null;
  const targetPrice = firstTarget && typeof firstTarget === "object" ? firstTarget.price : firstTarget ?? analysis.target;
  const entry = Number(entryZone);
  const stopLoss = Number(riskPlan?.stopLoss ?? analysis.stopLoss);
  const takeProfit = Number(targetPrice);
  const profit = analysis.profitLoss ?? 0;
  const trade: Trade = {
    id: Date.now(),
    date: new Date().toISOString().slice(0, 10),
    pair: analysis.pair ?? analysis.asset ?? "Chart",
    type: analysis.direction?.includes("SHORT") || analysis.direction === "SELL" ? "SELL" : "BUY",
    entry: Number.isFinite(entry) ? entry : 0,
    exit: Number.isFinite(takeProfit) ? takeProfit : 0,
    stopLoss: Number.isFinite(stopLoss) ? stopLoss : 0,
    takeProfit: Number.isFinite(takeProfit) ? takeProfit : 0,
    lotSize: 1,
    strategy: analysis.strategy ?? analysis.pattern ?? "AI chart analysis",
    notes: analysis.reasoning ?? analysis.validationSummary ?? analysis.advice ?? "",
    result: profit < 0 ? "Loss" : "Win",
    profit,
    riskReward: riskPlan?.riskReward ?? analysis.riskReward ?? "1:0.00",
    emotion: "Confident",
    aiScore: Math.max(1, Math.min(10, Math.round(analysis.score || (analysis.confidence ?? 50) / 10)))
  };

  saveTrade(session, trade);
  saveLatestAnalysis(session, { ...analysis, savedToJournal: true });
}

function getUsers(): LocalUser[] {
  return readJson<LocalUser[]>(USERS_KEY, []);
}

function ensureTradeKey(session: LocalSession) {
  const key = tradeKey(session);
  if (!localStorage.getItem(key)) {
    localStorage.setItem(key, JSON.stringify([]));
  }
}

function tradeKey(session: LocalSession) {
  return session.mode === "demo" ? "tradex_demo_trades" : `tradex_trades_${session.email}`;
}

function analysisKey(session: LocalSession) {
  return session.mode === "demo" ? "tradex_demo_latest_analysis" : `tradex_latest_analysis_${session.email}`;
}

function analysisHistoryKey(session: LocalSession) {
  return session.mode === "demo" ? "tradex_demo_analysis_history" : `tradex_analysis_history_${session.email}`;
}

function psychologyKey(session: LocalSession) {
  return session.mode === "demo" ? "tradex_demo_psychology" : `tradex_psychology_${session.email}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function notifyStorageUpdated() {
  window.dispatchEvent(new CustomEvent(TRADEX_STORAGE_EVENT));
}

function isLegacySampleTrade(trade: Trade) {
  const sampleIds = [1, 2, 3, 4];
  return sampleIds.includes(trade.id)
    && ["XAU/USD", "EUR/USD", "BTC/USD", "GBP/USD"].includes(trade.pair)
    && ["Breakout", "Reversal", "Trend Pullback"].includes(trade.strategy)
    && ["2026-06-20", "2026-06-18", "2026-06-15", "2026-06-09"].includes(trade.date);
}

function isLegacySampleAnalysis(analysis: StoredAnalysis) {
  return analysis.trend === "Bullish"
    && analysis.pattern === "Ascending Triangle"
    && analysis.entryZone === "2360"
    && analysis.stopLoss === "2348"
    && analysis.target === "2385";
}
