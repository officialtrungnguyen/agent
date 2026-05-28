import "dotenv/config";
import express from "express";
import cors from "cors";
import { gmailRouter } from "./routes/gmail.js";
import { authRouter } from "./routes/auth.js";

const app = express();
const PORT = Number(process.env.PORT || 8787);

app.use(cors({
  origin: (origin, cb) => cb(null, true),
  credentials: true,
}));
app.use(express.json({ limit: "2mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    name: "bulgebracket.ai",
    time: new Date().toISOString(),
    gmailConfigured: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ),
  });
});

app.use("/auth", authRouter);
app.use("/api/gmail", gmailRouter);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[bulgebracket api] listening on http://localhost:${PORT}`);
});
