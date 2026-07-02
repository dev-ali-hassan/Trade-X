import { logger } from "../utils/logger.js";

type AnalyzeInput = {
  imageBuffer: Buffer;
  mimeType: string;
  tradeContext?: TradeContext;
};

export type TradeContext = {
  asset?: string;
  pair?: string;
  timeframe?: string;
  tradingStyle?: string;
  riskPercent?: string;
  accountBalance?: string;
  direction?: string;
  entry?: string;
  exit?: string;
  stopLoss?: string;
  takeProfit?: string;
  lotSize?: string;
  riskReward?: string;
  strategy?: string;
  notes?: string;
};

export type ProfessionalChartAnalysis = {
  asset: string;
  direction: string;
  confidence: number;
  strategy: string;
  marketStructure: string;
  entry: {
    zone: string;
    reason: string;
  };
  risk: {
    stopLoss: string;
    riskReward: string;
    invalidation: string;
  };
  targets: Array<{
    name: string;
    price: string;
    reason: string;
  }>;
  indicators: {
    ema: string;
    rsi: string;
    macd: string;
    volume: string;
    atr: string;
  };
  reasoning: string;
  risks: string[];
  alternativeScenario: string;
};

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  error?: {
    message?: string;
  };
};

const GEMINI_TIMEOUT_MS = 45_000;

export async function analyzeChart({ imageBuffer, mimeType, tradeContext }: AnalyzeInput): Promise<ProfessionalChartAnalysis> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the backend environment.");
  }

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-1.5-flash";
  const imageBase64 = imageBuffer.toString("base64");
  const context = tradeContext ?? {};

  logger.info("Gemini vision request sent", {
    model,
    mimeType,
    bytes: imageBuffer.byteLength
  });

  const responseContent = await requestGemini({
    apiKey,
    model,
    imageBase64,
    mimeType,
    context
  });

  try {
    const parsed = parseJsonObject(responseContent) as Partial<ProfessionalChartAnalysis>;
    const normalized = normalizeAnalysis(parsed, context);
    logger.info("Gemini JSON parsed", {
      model,
      direction: normalized.direction,
      confidence: normalized.confidence,
      targetCount: normalized.targets.length
    });
    return normalized;
  } catch (error) {
    logger.error("Gemini JSON parsing failed", { message: getErrorMessage(error) });
    throw new Error(`AI response was not valid JSON: ${getErrorMessage(error)}`);
  }
}

async function requestGemini({
  apiKey,
  model,
  imageBase64,
  mimeType,
  context
}: {
  apiKey: string;
  model: string;
  imageBase64: string;
  mimeType: string;
  context: TradeContext;
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text:
                    "You are Trade X AI, a professional trading chart analyst. Analyze only the uploaded chart image and any user context. Return only valid JSON in the exact requested schema. Do not add markdown, prose outside JSON, placeholders, or financial guarantees."
                },
                {
                  text: buildPrompt(context)
                },
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json"
          }
        })
      }
    );

    const rawResponse = await response.text();
    logger.info("Gemini response received", { ok: response.ok, status: response.status });

    if (!response.ok) {
      throw new Error(extractGeminiError(rawResponse) || `Gemini request failed with status ${response.status}.`);
    }

    const geminiResponse = JSON.parse(rawResponse) as GeminiGenerateResponse;
    const content = geminiResponse.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
    if (!content) {
      throw new Error("Gemini returned an empty chart analysis response.");
    }

    return content;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Gemini request timed out.");
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(context: TradeContext) {
  return `Analyze this trading chart screenshot and return one professional trade plan.

User context:
- Asset: ${context.asset || context.pair || ""}
- Timeframe: ${context.timeframe || ""}
- Trading style: ${context.tradingStyle || ""}
- Risk percent: ${context.riskPercent || ""}
- Account balance: ${context.accountBalance || ""}
- User direction, if provided: ${context.direction || ""}
- User entry, if provided: ${context.entry || ""}
- User stop loss, if provided: ${context.stopLoss || ""}
- User take profit, if provided: ${context.takeProfit || ""}
- User notes, if provided: ${context.strategy || context.notes || ""}

Analyze:
- Market trend
- Market structure
- Higher highs / lower lows
- Support zones
- Resistance zones
- Supply and demand zones
- Liquidity areas
- Candlestick patterns
- EMA / RSI / MACD / Volume / ATR if visible
- Entry zone
- Stop loss
- Take profit levels
- Risk reward ratio
- Trading strategy
- Confidence score
- Trade invalidation
- Alternative scenario

Rules:
- If the chart is unclear, set direction to "NO TRADE" and explain why inside reasoning/risks.
- Use zones or ranges where exact prices are not readable.
- Do not invent visible indicators. If an indicator is not visible, use an empty string for that indicator.
- confidence must be a number from 0 to 100.
- Return only valid JSON, no markdown.

Return exactly this JSON shape:
{
 "asset":"",
 "direction":"",
 "confidence":0,
 "strategy":"",
 "marketStructure":"",
 "entry":{
    "zone":"",
    "reason":""
 },
 "risk":{
    "stopLoss":"",
    "riskReward":"",
    "invalidation":""
 },
 "targets":[
    {
     "name":"TP1",
     "price":"",
     "reason":""
    }
 ],
 "indicators":{
    "ema":"",
    "rsi":"",
    "macd":"",
    "volume":"",
    "atr":""
 },
 "reasoning":"",
 "risks":[],
 "alternativeScenario":""
}`;
}

function extractGeminiError(rawResponse: string) {
  try {
    const parsed = JSON.parse(rawResponse) as GeminiGenerateResponse;
    return parsed.error?.message;
  } catch {
    return rawResponse.slice(0, 300);
  }
}

function parseJsonObject(content: string) {
  const trimmed = content.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(trimmed.slice(start, end + 1));
    }
    throw new Error("AI response did not contain a JSON object.");
  }
}

function normalizeAnalysis(input: Partial<ProfessionalChartAnalysis>, context: TradeContext): ProfessionalChartAnalysis {
  return {
    asset: toText(input.asset) || toText(context.asset) || toText(context.pair),
    direction: toText(input.direction).toUpperCase(),
    confidence: clampConfidence(input.confidence),
    strategy: toText(input.strategy),
    marketStructure: toText(input.marketStructure),
    entry: {
      zone: toText(input.entry?.zone),
      reason: toText(input.entry?.reason)
    },
    risk: {
      stopLoss: toText(input.risk?.stopLoss),
      riskReward: toText(input.risk?.riskReward),
      invalidation: toText(input.risk?.invalidation)
    },
    targets: normalizeTargets(input.targets),
    indicators: {
      ema: toText(input.indicators?.ema),
      rsi: toText(input.indicators?.rsi),
      macd: toText(input.indicators?.macd),
      volume: toText(input.indicators?.volume),
      atr: toText(input.indicators?.atr)
    },
    reasoning: toText(input.reasoning),
    risks: Array.isArray(input.risks) ? input.risks.map(toText).filter(Boolean) : [],
    alternativeScenario: toText(input.alternativeScenario)
  };
}

function normalizeTargets(targets: ProfessionalChartAnalysis["targets"] | undefined) {
  if (!Array.isArray(targets)) return [];

  return targets
    .map((target, index) => ({
      name: toText(target?.name) || `TP${index + 1}`,
      price: toText(target?.price),
      reason: toText(target?.reason)
    }))
    .filter((target) => target.name || target.price || target.reason);
}

function toText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function clampConfidence(value: unknown) {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, Math.round(numeric)));
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}
