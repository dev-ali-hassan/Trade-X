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

export const trades: Trade[] = [
  {
    id: 1,
    date: "2026-06-20",
    pair: "XAU/USD",
    type: "BUY",
    entry: 2360,
    exit: 2385,
    stopLoss: 2348,
    takeProfit: 2385,
    lotSize: 2,
    strategy: "Breakout",
    notes: "Waited for retest and volume confirmation.",
    result: "Win",
    profit: 5000,
    riskReward: "1:2.1",
    emotion: "Confident",
    aiScore: 8
  },
  {
    id: 2,
    date: "2026-06-18",
    pair: "EUR/USD",
    type: "SELL",
    entry: 1.079,
    exit: 1.083,
    stopLoss: 1.084,
    takeProfit: 1.071,
    lotSize: 1,
    strategy: "Reversal",
    notes: "Entered before candle close.",
    result: "Loss",
    profit: -400,
    riskReward: "1:1.8",
    emotion: "FOMO",
    aiScore: 5
  },
  {
    id: 3,
    date: "2026-06-15",
    pair: "BTC/USD",
    type: "BUY",
    entry: 64200,
    exit: 65400,
    stopLoss: 63600,
    takeProfit: 65800,
    lotSize: 0.5,
    strategy: "Trend Pullback",
    notes: "Clean higher low into support.",
    result: "Win",
    profit: 600,
    riskReward: "1:2.6",
    emotion: "Confident",
    aiScore: 9
  },
  {
    id: 4,
    date: "2026-06-09",
    pair: "GBP/USD",
    type: "SELL",
    entry: 1.273,
    exit: 1.276,
    stopLoss: 1.277,
    takeProfit: 1.264,
    lotSize: 1,
    strategy: "Breakout",
    notes: "Late entry after large candle.",
    result: "Loss",
    profit: -300,
    riskReward: "1:2.0",
    emotion: "Revenge",
    aiScore: 4
  }
];

export const equityCurve = [
  { day: "Mon", balance: 10000 },
  { day: "Tue", balance: 10600 },
  { day: "Wed", balance: 10300 },
  { day: "Thu", balance: 11100 },
  { day: "Fri", balance: 11850 },
  { day: "Sat", balance: 11650 },
  { day: "Sun", balance: 12400 }
];

export const monthlyPerformance = [
  { month: "Jan", profit: 900 },
  { month: "Feb", profit: 1300 },
  { month: "Mar", profit: -250 },
  { month: "Apr", profit: 1750 },
  { month: "May", profit: 1050 },
  { month: "Jun", profit: 2150 }
];

export const winLoss = [
  { name: "Wins", value: 90 },
  { name: "Losses", value: 60 }
];

export const aiInsight = {
  trend: "Bullish",
  support: "2345",
  resistance: "2380",
  pattern: "Ascending Triangle",
  candlestick: "Bullish Engulfing",
  entry: "2360",
  stopLoss: "2348",
  target: "2385",
  score: 8,
  risk: "Medium",
  advice: "Good setup, but wait for confirmation and avoid entering directly into resistance."
};
