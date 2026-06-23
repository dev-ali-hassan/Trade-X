import OpenAI from "openai";

type AnalyzeInput = {
  imageBuffer: Buffer;
  mimeType: string;
  tradeContext?: TradeContext;
};

export type TradeContext = {
  pair?: string;
  direction?: string;
  entry?: string;
  exit?: string;
  stopLoss?: string;
  takeProfit?: string;
  lotSize?: string;
  riskReward?: string;
};

export type ChartAnalysis = {
  trend: string;
  support: string;
  resistance: string;
  pattern: string;
  candlestick: string;
  entry: string;
  stopLoss: string;
  target: string;
  score: number;
  risk: string;
  advice: string;
  riskReward?: string;
  confidence?: number;
  profitLoss?: number;
  setupQuality?: string;
  validationSummary?: string;
  warnings?: string[];
  suggestions?: string[];
  mistakes?: string[];
};

export async function analyzeChart({ imageBuffer, mimeType, tradeContext }: AnalyzeInput): Promise<ChartAnalysis> {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.AI_API_KEY ?? process.env["API KEY"];
  const backendReview = reviewTradePlan(tradeContext);
  const fallbackAnalysis = createFallbackAnalysis(tradeContext, backendReview);

  if (!apiKey) {
    return fallbackAnalysis;
  }

  const client = new OpenAI({ apiKey });
  const imageBase64 = imageBuffer.toString("base64");
  const tradeContextText = tradeContext
    ? `
User trade plan:
- Pair: ${tradeContext.pair || "not provided"}
- Direction: ${tradeContext.direction || "not provided"}
- Entry: ${tradeContext.entry || "not provided"}
- Exit: ${tradeContext.exit || "not provided"}
- Stop loss: ${tradeContext.stopLoss || "not provided"}
- Take profit: ${tradeContext.takeProfit || "not provided"}
- Lot size: ${tradeContext.lotSize || "not provided"}
- Calculated risk/reward: ${tradeContext.riskReward || "not provided"}

Compare the user's planned trade levels against the chart. Explain whether the entry, stop loss, take profit, and risk/reward are reasonable.`
    : "";

  const response = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You are a professional technical analyst and trading journal coach. Analyze the chart and the user's planned trade. Do not guarantee profit. Explain risks clearly. Be direct, practical, and useful. Return only valid JSON."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Analyze this trading chart screenshot and trade plan. Provide: 1. Market trend 2. Support levels 3. Resistance levels 4. Candlestick patterns 5. Chart patterns 6. Entry quality 7. Stop loss quality 8. Take profit quality 9. Risk/reward quality 10. Trade setup score from 1-10. Backend validation already found: ${backendReview.validationSummary}. Backend warnings: ${backendReview.warnings.join("; ") || "none"}. ${tradeContextText} Return JSON with keys: trend, support, resistance, pattern, candlestick, entry, stopLoss, target, score, risk, riskReward, confidence, setupQuality, validationSummary, warnings, suggestions, mistakes, advice. warnings, suggestions, and mistakes must be arrays of short strings.`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${imageBase64}`
            }
          }
        ]
      }
    ]
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return fallbackAnalysis;

  try {
    const aiResult = JSON.parse(content) as Partial<ChartAnalysis>;
    return mergeAnalysis(fallbackAnalysis, aiResult, backendReview);
  } catch {
    return fallbackAnalysis;
  }
}

type BackendReview = {
  riskReward: string;
  profitLoss: number;
  score: number;
  setupQuality: string;
  risk: string;
  validationSummary: string;
  warnings: string[];
  suggestions: string[];
  mistakes: string[];
};

function reviewTradePlan(tradeContext?: TradeContext): BackendReview {
  const direction = normalizeDirection(tradeContext?.direction);
  const entry = toNumber(tradeContext?.entry);
  const exit = toNumber(tradeContext?.exit);
  const stopLoss = toNumber(tradeContext?.stopLoss);
  const takeProfit = toNumber(tradeContext?.takeProfit);
  const lotSize = toNumber(tradeContext?.lotSize) ?? 1;

  const warnings: string[] = [];
  const suggestions: string[] = [];
  const mistakes: string[] = [];

  if (!entry) warnings.push("Entry price is missing.");
  if (!stopLoss) warnings.push("Stop loss is missing.");
  if (!takeProfit) warnings.push("Take profit is missing.");

  if (entry && stopLoss && direction === "BUY" && stopLoss >= entry) {
    warnings.push("For a BUY trade, stop loss should usually be below entry.");
    mistakes.push("Stop loss is on the wrong side of entry.");
  }

  if (entry && stopLoss && direction === "SELL" && stopLoss <= entry) {
    warnings.push("For a SELL trade, stop loss should usually be above entry.");
    mistakes.push("Stop loss is on the wrong side of entry.");
  }

  if (entry && takeProfit && direction === "BUY" && takeProfit <= entry) {
    warnings.push("For a BUY trade, take profit should usually be above entry.");
    mistakes.push("Take profit is on the wrong side of entry.");
  }

  if (entry && takeProfit && direction === "SELL" && takeProfit >= entry) {
    warnings.push("For a SELL trade, take profit should usually be below entry.");
    mistakes.push("Take profit is on the wrong side of entry.");
  }

  const risk = entry && stopLoss ? Math.abs(entry - stopLoss) : 0;
  const reward = entry && takeProfit ? Math.abs(takeProfit - entry) : 0;
  const rr = risk > 0 && reward > 0 ? reward / risk : 0;
  const riskReward = rr > 0 ? `1:${rr.toFixed(2)}` : "Not enough data";

  if (rr > 0 && rr < 1.5) {
    warnings.push("Risk/reward is low for a quality setup.");
    suggestions.push("Look for a better entry, tighter invalidation, or clearer target.");
  }

  if (rr >= 2) {
    suggestions.push("Risk/reward is acceptable if the chart confirms the setup.");
  }

  if (warnings.length === 0) {
    suggestions.push("Plan is structurally valid. Confirm trend and key levels before entry.");
  }

  const directionalMultiplier = direction === "BUY" ? 1 : -1;
  const profitLoss = entry && exit ? (exit - entry) * lotSize * directionalMultiplier : 0;
  const score = scoreTradePlan(rr, warnings.length);
  const setupQuality = score >= 8 ? "Strong" : score >= 6 ? "Moderate" : "Needs review";
  const riskLabel = warnings.length >= 2 || rr < 1 ? "High" : rr >= 2 ? "Medium" : "Medium-High";

  return {
    riskReward,
    profitLoss,
    score,
    setupQuality,
    risk: riskLabel,
    validationSummary:
      warnings.length === 0
        ? "Trade plan has valid basic structure."
        : "Trade plan needs review before entry.",
    warnings,
    suggestions,
    mistakes
  };
}

function createFallbackAnalysis(tradeContext: TradeContext | undefined, review: BackendReview): ChartAnalysis {
  return {
    trend: "Needs chart confirmation",
    support: "Review visible support",
    resistance: "Review visible resistance",
    pattern: "Not confirmed",
    candlestick: "Not confirmed",
    entry: tradeContext?.entry || "Not provided",
    stopLoss: tradeContext?.stopLoss || "Not provided",
    target: tradeContext?.takeProfit || "Not provided",
    score: review.score,
    risk: review.risk,
    riskReward: review.riskReward,
    profitLoss: review.profitLoss,
    confidence: Math.max(35, Math.min(85, review.score * 10)),
    setupQuality: review.setupQuality,
    validationSummary: review.validationSummary,
    warnings: review.warnings,
    suggestions: review.suggestions,
    mistakes: review.mistakes,
    advice:
      review.warnings.length > 0
        ? `${review.warnings[0]} Fix the trade plan before relying on chart confirmation.`
        : "Trade plan structure is valid. Wait for chart confirmation and manage risk."
  };
}

function mergeAnalysis(fallback: ChartAnalysis, aiResult: Partial<ChartAnalysis>, review: BackendReview): ChartAnalysis {
  return {
    ...fallback,
    ...aiResult,
    score: clampScore(Number(aiResult.score ?? review.score)),
    riskReward: aiResult.riskReward || review.riskReward,
    profitLoss: review.profitLoss,
    confidence: clampConfidence(Number(aiResult.confidence ?? fallback.confidence ?? 70)),
    setupQuality: aiResult.setupQuality || review.setupQuality,
    validationSummary: aiResult.validationSummary || review.validationSummary,
    warnings: normalizeList(aiResult.warnings, review.warnings),
    suggestions: normalizeList(aiResult.suggestions, review.suggestions),
    mistakes: normalizeList(aiResult.mistakes, review.mistakes)
  };
}

function normalizeDirection(value?: string) {
  return value?.toUpperCase() === "SELL" ? "SELL" : "BUY";
}

function toNumber(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function scoreTradePlan(riskReward: number, warningCount: number) {
  let score = 5;
  if (riskReward >= 1.5) score += 1;
  if (riskReward >= 2) score += 2;
  if (riskReward >= 3) score += 1;
  score -= warningCount * 2;
  return clampScore(score);
}

function clampScore(value: number) {
  return Math.max(1, Math.min(10, Math.round(value || 1)));
}

function clampConfidence(value: number) {
  return Math.max(1, Math.min(100, Math.round(value || 1)));
}

function normalizeList(value: unknown, fallback: string[]) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }
  return fallback;
}
