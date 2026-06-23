import { Router } from "express";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { supabase } from "../database/supabase.js";
import { AuthRequest, requireAuth } from "../middleware/auth.js";

const router = Router();

const tradeSchema = z.object({
  pair: z.string(),
  type: z.enum(["BUY", "SELL"]),
  entry_price: z.number(),
  exit_price: z.number(),
  stop_loss: z.number(),
  take_profit: z.number(),
  lot_size: z.number(),
  strategy: z.string(),
  notes: z.string().optional(),
  emotion: z.string().optional()
});

const demoTrades: unknown[] = [];

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  if (supabase) {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", req.user?.id)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.json(data);
    return;
  }

  res.json(demoTrades);
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const body = tradeSchema.parse(req.body);
  const direction = body.type === "BUY" ? 1 : -1;
  const profit = (body.exit_price - body.entry_price) * body.lot_size * direction;
  const payload = { ...body, user_id: req.user?.id, profit };

  if (supabase) {
    const { data, error } = await supabase.from("trades").insert(payload).select("*").single();
    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }
    res.json(data);
    return;
  }

  const trade = { id: randomUUID(), ...payload, created_at: new Date().toISOString() };
  demoTrades.unshift(trade);
  res.json(trade);
});

export default router;
