import { Router } from "express";
import multer from "multer";
import { supabase } from "../database/supabase.js";
import { analyzeChart } from "../services/aiService.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 }
});

router.post("/analyze-chart", upload.single("image"), async (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "Please upload a chart image." });
    return;
  }

  const result = await analyzeChart({
    imageBuffer: req.file.buffer,
    mimeType: req.file.mimetype
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
