import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

function isEmailConfigured(): boolean {
  return Boolean(
    readEnv("SMTP_HOST") &&
      readEnv("SMTP_FROM") &&
      readEnv("SMTP_USER") &&
      readEnv("SMTP_PASS"),
  );
}

function readEnv(name: string): string | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return undefined;
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  return raw;
}

function getTransport() {
  const host = readEnv("SMTP_HOST");
  const port = Number(readEnv("SMTP_PORT") ?? 587);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const secure =
    readEnv("SMTP_SECURE") === "true" || (port === 465 && readEnv("SMTP_SECURE") !== "false");

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  if (!user || !pass) {
    throw new Error("SMTP_USER and SMTP_PASS are required");
  }

  const options = {
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    family: 4,
    requireTLS: port === 587,
    tls: {
      minVersion: "TLSv1.2" as const,
    },
  } as SMTPTransport.Options;

  return nodemailer.createTransport(options);
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = readEnv("SMTP_FROM") ?? "USParts <noreply@usparts.local>";

  if (!isEmailConfigured()) {
    console.warn(
      "[email:dev] SMTP not fully configured (need SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM). Logging instead of sending:",
      { to: input.to, subject: input.subject },
    );
    return;
  }

  const transport = getTransport();
  try {
    await transport.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? input.text.replace(/\n/g, "<br>"),
      ...(input.replyTo ? { replyTo: input.replyTo } : {}),
    });
  } catch (error) {
    console.error("[email] Failed to send:", { to: input.to, subject: input.subject, error });
    throw error;
  }
}

export function appUrl(path: string): string {
  const base = getAppUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
