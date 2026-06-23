import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { supabase } from "../database/supabase.js";
import { analyzeChart } from "../services/aiService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => Number.isFinite(Number(value)), `${label} must be a valid number.`);

const tradeContextSchema = z.object({
  pair: z.string().trim().min(1, "Pair is required."),
  direction: z.enum(["BUY", "SELL"]),
  entry: numericString("Entry"),
  exit: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || Number.isFinite(Number(value)), "Exit must be a valid number."),
  stopLoss: numericString("Stop loss"),
  takeProfit: numericString("Take profit"),
  lotSize: numericString("Lot size"),
  riskReward: z.string().trim().optional()
});

router.post("/analyze-chart", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Please upload a chart image." });
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

  const result = await analyzeChart({
    imageBuffer: req.file.buffer,
    mimeType: req.file.mimetype,
    tradeContext: parsedContext.data
  });

  if (supabase && req.body.trade_id && req.body.trade_id !== "demo-trade") {
    await supabase.from("ai_analysis").insert({
      trade_id: req.body.trade_id,
      trend: result.trend,
      support: result.support,
      resistance: result.resistance,
      pattern: result.pattern,
      score: result.score,
      recommendation: result.advice
    });
  }

  res.json(result);
});

export default router;
