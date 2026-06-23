import type { Trade } from "../data/sampleData";

export type LocalSession = {
  mode: "demo" | "account";
  name: string;
  email: string;
};

export type StoredAnalysis = {
  trend: string;
  pattern: string;
  candlestick: string;
  support: string;
  resistance: string;
  entry: string;
  stopLoss: string;
  target: string;
  score: number;
  risk: string;
  advice: string;
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
  createdAt: string;
};

type LocalUser = {
  name: string;
  email: string;
  password: string;
};

const SESSION_KEY = "tradex_session";
const USERS_KEY = "tradex_users";

export function getSession(): LocalSession | null {
  return readJson<LocalSession | null>(SESSION_KEY, null);
}

export function saveSession(session: LocalSession) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function createDemoSession(): LocalSession {
  const session: LocalSession = { mode: "demo", name: "Demo Trader", email: "demo@local" };
  localStorage.setItem("tradex_demo_trades", JSON.stringify([]));
  localStorage.removeItem("tradex_demo_latest_analysis");
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

  return readJson<Trade[]>(tradeKey(session), []);
}

export function saveTrade(session: LocalSession, trade: Trade) {
  const current = getTrades(session);
  const next = [trade, ...current.filter((item) => item.id !== trade.id)];
  localStorage.setItem(tradeKey(session), JSON.stringify(next));
}

export function getLatestAnalysis(session: LocalSession | null): StoredAnalysis | null {
  if (!session) return null;

  return readJson<StoredAnalysis | null>(analysisKey(session), null);
}

export function saveLatestAnalysis(session: LocalSession, analysis: StoredAnalysis) {
  localStorage.setItem(analysisKey(session), JSON.stringify(analysis));
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

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
