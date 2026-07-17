import { Resend } from "resend";

let client: Resend | null = null;
let clientKey: string | null = null;

export function getResendApiKey(): string | null {
  return process.env.RESEND_API_KEY?.trim() || null;
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
