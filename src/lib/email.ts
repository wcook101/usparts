import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Resend } from "resend";

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

export type EmailProvider = "resend" | "smtp" | "dev";

function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export function readEnv(name: string): string | undefined {
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

function getFromAddress(): string {
  return readEnv("SMTP_FROM") ?? readEnv("EMAIL_FROM") ?? "USParts <noreply@usparts.local>";
}

function isResendConfigured(): boolean {
  return Boolean(readEnv("RESEND_API_KEY"));
}

function isSmtpConfigured(): boolean {
  return Boolean(
    readEnv("SMTP_HOST") &&
      getFromAddress() &&
      readEnv("SMTP_USER") &&
      readEnv("SMTP_PASS"),
  );
}

export function getEmailProvider(): EmailProvider {
  if (isResendConfigured()) {
    return "resend";
  }

  if (isSmtpConfigured()) {
    return "smtp";
  }

  return "dev";
}

function getTransport() {
  const host = readEnv("SMTP_HOST");
  const port = Number(readEnv("SMTP_PORT") ?? 587);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");
  const secure =
    readEnv("SMTP_SECURE") === "true" ||
    (port === 465 && readEnv("SMTP_SECURE") !== "false");

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

async function sendViaResend(input: SendEmailInput): Promise<void> {
  const apiKey = readEnv("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br>"),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });

  if (error) {
    throw new Error(error.message);
  }

  console.log("[email] Resend accepted message:", {
    id: data?.id,
    to: input.to,
    subject: input.subject,
  });
}

async function sendViaSmtp(input: SendEmailInput): Promise<void> {
  const transport = getTransport();
  await transport.sendMail({
    from: getFromAddress(),
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html ?? input.text.replace(/\n/g, "<br>"),
    ...(input.replyTo ? { replyTo: input.replyTo } : {}),
  });
}

export function formatEmailError(error: unknown): string {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Unknown email error";

  if (/ETIMEDOUT|timeout|timed out/i.test(message)) {
    return "Email server connection timed out";
  }

  if (/ECONNREFUSED|ENOTFOUND|ECONNRESET|connect/i.test(message)) {
    return "Could not connect to email server";
  }

  if (/auth|credentials|535|534/i.test(message)) {
    return "Email server rejected login credentials";
  }

  return message;
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const provider = getEmailProvider();

  if (provider === "dev") {
    console.warn(
      "[email:dev] No email provider configured (set RESEND_API_KEY or SMTP_*). Logging instead of sending:",
      { to: input.to, subject: input.subject },
    );
    return;
  }

  try {
    if (provider === "resend") {
      await sendViaResend(input);
      return;
    }

    await sendViaSmtp(input);
  } catch (error) {
    console.error("[email] Failed to send:", {
      provider,
      to: input.to,
      subject: input.subject,
      error: formatEmailError(error),
    });
    throw error;
  }
}

export function appUrl(path: string): string {
  const base = getAppUrl().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
