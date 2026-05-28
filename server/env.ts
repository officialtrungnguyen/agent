import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT ?? 8787),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  GOOGLE_REDIRECT_URI:
    process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:8787/auth/google/callback",
  APP_BASE_URL: process.env.APP_BASE_URL ?? "http://localhost:5173",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",
};

export const HAS_GOOGLE_OAUTH = Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET);
export const HAS_OPENAI = Boolean(env.OPENAI_API_KEY);
