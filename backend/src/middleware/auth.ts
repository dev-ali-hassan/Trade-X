import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type AuthRequest = Request & {
  user?: {
    id: string;
    email: string;
  };
};

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token) {
    res.status(401).json({ message: "Missing authentication token." });
    return;
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? "dev-secret") as AuthRequest["user"];
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}
