import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { supabase } from "../database/supabase.js";
import { analyzeChart } from "../services/aiService.js";
import { logger } from "../utils/logger.js";

const router = Router();
const allowedImageTypes = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const optionalNumericString = (label: string) =>
  z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number.isFinite(Number(value)), `${label} must be a valid number.`);

const tradeContextSchema = z.object({
  asset: z.string().trim().optional(),
  pair: z.string().trim().optional(),
  timeframe: z.string().trim().optional(),
  tradingStyle: z.string().trim().optional(),
  riskPercent: optionalNumericString("Risk"),
  accountBalance: optionalNumericString("Account balance"),
  direction: z.enum(["BUY", "SELL"]).optional(),
  entry: optionalNumericString("Entry"),
  exit: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number.isFinite(Number(value)), "Exit must be a valid number."),
  stopLoss: optionalNumericString("Stop loss"),
  takeProfit: optionalNumericString("Take profit"),
  lotSize: optionalNumericString("Lot size"),
  riskReward: z.string().trim().optional(),
  strategy: z.string().trim().optional(),
  notes: z.string().trim().optional()
});

router.post("/analyze-chart", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Please upload a chart image." });
    return;
  }

  if (!allowedImageTypes.has(req.file.mimetype)) {
    res.status(400).json({ message: "Please upload a PNG, JPG, or WEBP chart image." });
    return;
  }

  const parsedContext = tradeContextSchema.safeParse(req.body);
  if (!parsedContext.success) {
    res.status(400).json({
      message: "Trade details are not valid.",
      issues: parsedContext.error.flatten().fieldErrors
    });
    return;
  }

  const tradeContext = removeEmptyValues(parsedContext.data);

  logger.info("Chart image received", {
    mimeType: req.file.mimetype,
    bytes: req.file.size,
    hasContext: Boolean(tradeContext)
  });

  try {
    const result = await analyzeChart({
      imageBuffer: req.file.buffer,
      mimeType: req.file.mimetype,
      tradeContext
    });

    if (supabase && req.body.trade_id && req.body.trade_id !== "demo-trade") {
      await supabase.from("ai_analysis").insert({
        trade_id: req.body.trade_id,
        trend: result.marketStructure,
        support: "",
        resistance: "",
        pattern: result.strategy,
        score: Math.max(1, Math.min(10, Math.round(result.confidence / 10))),
        recommendation: result.reasoning
      });
    }

    logger.info("Chart analysis response sent", {
      direction: result.direction,
      confidence: result.confidence
    });

    res.json(result);
  } catch (error) {
    const message = sanitizeApiError(error instanceof Error ? error.message : String(error));
    logger.error("Chart analysis failed", { message });
    const status = message.includes("GEMINI_API_KEY") ? 503 : 502;
    res.status(status).json({
      message: getFriendlyAnalysisMessage(message),
      detail: message
    });
  }
});

function removeEmptyValues<T extends Record<string, unknown>>(input: T) {
  const cleaned = Object.fromEntries(
    Object.entries(input).filter(([, value]) => typeof value === "string" ? value.trim().length > 0 : value !== undefined)
  ) as Partial<T>;

  return Object.keys(cleaned).length > 0 ? cleaned : undefined;
}

function sanitizeApiError(message: string) {
  return message
    .replace(/[a-z]{2,}[-_][A-Za-z0-9_*]{12,}/g, "[redacted-api-key]")
    .replace(/AIza[A-Za-z0-9_-]{12,}/g, "[redacted-api-key]")
    .replace(/gsk_[A-Za-z0-9_-]{12,}/g, "[redacted-api-key]");
}

function getFriendlyAnalysisMessage(message: string) {
  if (message.includes("GEMINI_API_KEY")) {
    return "AI analysis is not configured yet. Please add the Gemini API key on the backend.";
  }

  if (/timeout|aborted/i.test(message)) {
    return "AI analysis timed out. Please retry with a clearer or smaller chart image.";
  }

  return "AI chart analysis failed. Please retry in a moment.";
}

export default router;
