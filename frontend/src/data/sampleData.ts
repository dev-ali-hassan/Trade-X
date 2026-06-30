export type Trade = {
  id: number;
  date: string;
  pair: string;
  type: "BUY" | "SELL";
  entry: number;
  exit: number;
  stopLoss: number;
  takeProfit: number;
  lotSize: number;
  strategy: string;
  notes: string;
  result: "Win" | "Loss";
  profit: number;
  riskReward: string;
  emotion: "Confident" | "Fear" | "FOMO" | "Revenge";
  aiScore: number;
};

export const trades: Trade[] = [];

export const equityCurve: Array<{ day: string; balance: number }> = [];

export const monthlyPerformance: Array<{ month: string; profit: number }> = [];

export const winLoss: Array<{ name: string; value: number }> = [];

export const aiInsight = {
  trend: "",
  support: "",
  resistance: "",
  pattern: "",
  candlestick: "",
  entry: "",
  stopLoss: "",
  target: "",
  score: 0,
  risk: "",
  advice: ""
};
