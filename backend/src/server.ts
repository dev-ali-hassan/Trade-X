import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import authRoutes from "./routes/auth.js";
import tradeRoutes from "./routes/trades.js";
import analysisRoutes from "./routes/analysis.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, "..", "..", "..");

dotenv.config({ path: path.join(workspaceRoot, ".env") });
dotenv.config({ path: path.join(workspaceRoot, "backend", ".env"), override: true });

const app = express();
const port = Number(process.env.PORT ?? 5000);

app.use(cors({ origin: process.env.FRONTEND_ORIGIN ?? "http://127.0.0.1:5173" }));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "Trade X API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/trades", tradeRoutes);
app.use("/api/analysis", analysisRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.message);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});

app.listen(port, () => {
  console.log(`Trade X API running on http://127.0.0.1:${port}`);
});
