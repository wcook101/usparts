import nodemailer from "nodemailer";

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
    process.env.SMTP_HOST &&
      process.env.SMTP_FROM &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS,
  );
}

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? 587);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) {
    throw new Error("SMTP_HOST is not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: user && pass ? { user, pass } : undefined,
  });
}

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const from = process.env.SMTP_FROM ?? "USParts <noreply@usparts.local>";

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
