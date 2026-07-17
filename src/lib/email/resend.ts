import { Resend } from "resend";

/**
 * Prefer RESEND_API_KEY env. Fallback keeps production mail working when
 * the GitHub-linked Vercel project is missing the env var.
 * Rotate this key in Resend after env is configured on all projects.
 */
const RESEND_API_KEY_FALLBACK = "re_jBt2SSku_H1xt8xGgwoSGX3KVgjrRqLrY";

let client: Resend | null = null;
let clientKey: string | null = null;

export function getResendApiKey(): string | null {
  const fromEnv = process.env.RESEND_API_KEY?.trim();
  if (fromEnv) return fromEnv;
  return RESEND_API_KEY_FALLBACK;
}

export function getResendClient(): Resend | null {
  const apiKey = getResendApiKey();
  if (!apiKey) return null;
  if (!client || clientKey !== apiKey) {
    client = new Resend(apiKey);
    clientKey = apiKey;
  }
  return client;
}

export function getResendFromAddress(): string {
  return (
    process.env.RESEND_FROM_EMAIL?.trim() ||
    "The Elite Trader <noreply@theelitetrader.in>"
  );
}

export function isResendConfigured(): boolean {
  return Boolean(getResendApiKey());
}
