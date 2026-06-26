import fs from "node:fs";
import path from "node:path";

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

type GroqChatResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
  };
};

type AiProvider = "groq" | "gemini";

type AiKeyConfig = {
  key: string;
  provider: AiProvider;
};

export async function analyzeChart({ imageBuffer, mimeType, tradeContext }: AnalyzeInput): Promise<ProfessionalChartAnalysis> {
  const config = getApiKey();
  console.log("[analysis] Image received by AI service", { mimeType, bytes: imageBuffer.byteLength });
  console.log("[analysis] AI key loaded", { loaded: Boolean(config?.key), provider: config?.provider });

  if (!config) {
    throw new Error("GROQ_API_KEY, GEMINI_API_KEY, GOOGLE_API_KEY, or API_KEY is not configured in the backend environment.");
  }

  const imageBase64 = imageBuffer.toString("base64");
  const context = tradeContext ?? {};
  const content = config.provider === "groq"
    ? await analyzeWithGroq({ apiKey: config.key, imageBase64, mimeType, context })
    : await analyzeWithGemini({ apiKey: config.key, imageBase64, mimeType, context });

  try {
    const parsed = JSON.parse(content) as Partial<ProfessionalChartAnalysis>;
    const normalized = normalizeAnalysis(parsed, context);
    console.log("[analysis] JSON parsing result", {
      parsed: true,
      direction: normalized.direction,
      confidence: normalized.confidence,
      targetCount: normalized.targets.length
    });
    return normalized;
  } catch (error) {
    console.error("[analysis] JSON parsing result", { parsed: false, error: getErrorMessage(error) });
    throw new Error(`AI response was not valid JSON: ${getErrorMessage(error)}`);
  }
}

async function analyzeWithGroq({
  apiKey,
  imageBase64,
  mimeType,
  context
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  context: TradeContext;
}) {
  const model = process.env.GROQ_MODEL ?? "meta-llama/llama-4-scout-17b-16e-instruct";

  console.log("[analysis] Groq vision request sent", { model });

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_completion_tokens: 1600,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "You are Trade X AI, a professional trading chart analyst. Analyze only the uploaded chart image and any user context. Return only valid JSON in the exact requested schema. Do not add markdown, prose outside JSON, placeholders, or financial guarantees.\n\n" +
                buildPrompt(context)
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
    })
  });

  const rawResponse = await response.text();
  console.log("[analysis] Groq response received", { ok: response.ok, status: response.status });

  if (!response.ok) {
    throw new Error(extractGroqError(rawResponse) || `Groq request failed with status ${response.status}.`);
  }

  const groqResponse = JSON.parse(rawResponse) as GroqChatResponse;
  const content = groqResponse.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Groq returned an empty chart analysis response.");
  }

  return content;
}

async function analyzeWithGemini({
  apiKey,
  imageBase64,
  mimeType,
  context
}: {
  apiKey: string;
  imageBase64: string;
  mimeType: string;
  context: TradeContext;
}) {
  const model = process.env.GEMINI_MODEL ?? "gemini-1.5-flash";

  console.log("[analysis] Gemini vision request sent", { model });

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
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
  console.log("[analysis] Gemini response received", { ok: response.ok, status: response.status });

  if (!response.ok) {
    throw new Error(extractGeminiError(rawResponse) || `Gemini request failed with status ${response.status}.`);
  }

  const geminiResponse = JSON.parse(rawResponse) as GeminiGenerateResponse;
  const content = geminiResponse.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("").trim();
  if (!content) {
    throw new Error("Gemini returned an empty chart analysis response.");
  }

  return content;
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

function getApiKey(): AiKeyConfig | undefined {
  const directKey =
    process.env.GROQ_API_KEY ??
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.API_KEY ??
    process.env["API KEY"] ??
    process.env.AI_API_KEY;
  if (directKey?.trim()) return normalizeKeyConfig(directKey);

  for (const envPath of [
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "backend", ".env")
  ]) {
    try {
      if (!fs.existsSync(envPath)) continue;
      const envText = fs.readFileSync(envPath, "utf8");
      const line = envText
        .split(/\r?\n/)
        .map((item) => item.trim())
        .find((item) => /^(GROQ_API_KEY|GEMINI_API_KEY|GOOGLE_API_KEY|AI_API_KEY|API_KEY|API\s+KEY)\s*=/.test(item) || /^(gsk_|AIza)/.test(item));

      if (!line) continue;

      const value = line.includes("=")
        ? line.split("=").slice(1).join("=").trim().replace(/^["']|["']$/g, "")
        : line.trim().replace(/^["']|["']$/g, "");
      if (value) return normalizeKeyConfig(value);
    } catch (error) {
      console.error("[analysis] Failed reading env file", { envPath, error: getErrorMessage(error) });
    }
  }

  return undefined;
}

function normalizeKeyConfig(value: string): AiKeyConfig {
  const cleaned = value.trim();
  if (cleaned.startsWith("gsk_")) {
    return { key: cleaned, provider: "groq" };
  }

  const geminiKey = cleaned.startsWith("sk-AIza") ? cleaned.slice(3) : cleaned;
  return { key: geminiKey, provider: "gemini" };
}

function extractGeminiError(rawResponse: string) {
  try {
    const parsed = JSON.parse(rawResponse) as GeminiGenerateResponse;
    return parsed.error?.message;
  } catch {
    return rawResponse.slice(0, 300);
  }
}

function extractGroqError(rawResponse: string) {
  try {
    const parsed = JSON.parse(rawResponse) as GroqChatResponse;
    return parsed.error?.message;
  } catch {
    return rawResponse.slice(0, 300);
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
