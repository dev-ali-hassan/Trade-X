import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import multer from "multer";
import { ZodError } from "zod";
import authRoutes from "./routes/auth.js";
import tradeRoutes from "./routes/trades.js";
import analysisRoutes from "./routes/analysis.js";
import { logger } from "./utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..");

dotenv.config({ path: path.join(workspaceRoot, ".env") });
dotenv.config({ path: path.join(workspaceRoot, "backend", ".env"), override: true });

const app = express();
const port = Number(process.env.PORT ?? 5000);
const allowedOrigins = new Set([
  "https://dev-ali-hassan.github.io",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  process.env.FRONTEND_ORIGIN
].filter((origin): origin is string => Boolean(origin)));

app.disable("x-powered-by");
app.use(securityHeaders);
app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error("This origin is not allowed by Trade X API."));
  }
}));
app.use(express.json({ limit: "2mb" }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/analysis", analysisRoutes);

const frontendDist = path.join(workspaceRoot, "frontend", "dist");

if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) {
      next();
      return;
    }

    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Request data is not valid.",
      issues: err.flatten().fieldErrors
    });
    return;
  }

  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE"
      ? "Chart image is too large. Please upload an image under 8MB."
      : "Chart upload failed. Please try another image.";
    res.status(400).json({ message });
    return;
  }

  const status = err.message.includes("origin is not allowed") ? 403 : 500;
  logger.error("Unhandled request error", { message: err.message, status });
  res.status(status).json({ message: status === 403 ? "This website is not allowed to call the Trade X API." : "Something went wrong. Please try again." });
});

const server = app.listen(port, () => {
  logger.info("Trade X API started", { port });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message });
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: reason instanceof Error ? reason.message : String(reason) });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Closing server.");
  server.close(() => process.exit(0));
});

function securityHeaders(_req: express.Request, res: express.Response, next: express.NextFunction) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
}
