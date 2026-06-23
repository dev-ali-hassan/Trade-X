import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { Router } from "express";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { supabase } from "../database/supabase.js";

const router = Router();

const authSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});

const demoUsers = new Map<string, { id: string; name: string; email: string; passwordHash: string }>();

router.post("/register", async (req, res) => {
  const body = authSchema.parse(req.body);
  const passwordHash = await bcrypt.hash(body.password, 10);

  if (supabase) {
    const { data, error } = await supabase
      .from("users")
      .insert({ name: body.name ?? "Trader", email: body.email, password_hash: passwordHash })
      .select("id,name,email")
      .single();

    if (error) {
      res.status(400).json({ message: error.message });
      return;
    }

    res.json({ token: signToken(data.id, data.email), user: data });
    return;
  }

  const user = { id: randomUUID(), name: body.name ?? "Trader", email: body.email, passwordHash };
  demoUsers.set(body.email, user);
  res.json({ token: signToken(user.id, user.email), user: { id: user.id, name: user.name, email: user.email } });
});

router.post("/login", async (req, res) => {
  const body = authSchema.omit({ name: true }).parse(req.body);

  if (supabase) {
    const { data, error } = await supabase.from("users").select("id,name,email,password_hash").eq("email", body.email).single();
    if (error || !data || !(await bcrypt.compare(body.password, data.password_hash))) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }
    res.json({ token: signToken(data.id, data.email), user: { id: data.id, name: data.name, email: data.email } });
    return;
  }

  const user = demoUsers.get(body.email);
  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    res.status(401).json({ message: "Invalid email or password." });
    return;
  }

  res.json({ token: signToken(user.id, user.email), user: { id: user.id, name: user.name, email: user.email } });
});

function signToken(id: string, email: string) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET ?? "dev-secret", { expiresIn: "7d" });
}

export default router;
