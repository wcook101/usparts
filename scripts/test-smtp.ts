import "dotenv/config";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { Resend } from "resend";
import {
  formatEmailError,
  getEmailProvider,
  readEnv,
} from "../src/lib/email";
import { SUPPORT_EMAIL } from "../src/lib/site";

async function sendTestViaResend(to: string, from: string) {
  const apiKey = readEnv("RESEND_API_KEY");
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const resend = new Resend(apiKey);
  const subject = "USParts email test";
  const text = [
    "This is a test email from the USParts Resend configuration.",
    "",
    `Sent at: ${new Date().toISOString()}`,
  ].join("\n");

  console.log(`Sending Resend test message to ${to}...`);
  const { error } = await resend.emails.send({ from, to, subject, text });
  if (error) {
    throw new Error(error.message);
  }
}

async function sendTestViaSmtp(to: string, from: string) {
  const host = readEnv("SMTP_HOST");
  const port = Number(readEnv("SMTP_PORT") ?? 587);
  const user = readEnv("SMTP_USER");
  const pass = readEnv("SMTP_PASS");

  if (!host || !user || !pass) {
    throw new Error("SMTP is not fully configured");
  }

  const options = {
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 20_000,
    family: 4,
    requireTLS: port === 587,
  } as SMTPTransport.Options;

  const transport = nodemailer.createTransport(options);

  console.log(`Verifying SMTP connection to ${host}:${port} as ${user}...`);
  await transport.verify();
  console.log("SMTP connection OK.");

  const subject = "USParts SMTP test";
  const text = [
    "This is a test email from the USParts SMTP configuration.",
    "",
    `Sent at: ${new Date().toISOString()}`,
  ].join("\n");

  console.log(`Sending SMTP test message to ${to}...`);
  await transport.sendMail({ from, to, subject, text });
}

async function main() {
  const provider = getEmailProvider();
  const from =
    readEnv("SMTP_FROM") ?? readEnv("EMAIL_FROM") ?? "USParts <noreply@usparts.local>";
  const to = process.argv[2]?.trim() || SUPPORT_EMAIL;

  console.log(`Email provider: ${provider}`);

  if (provider === "dev") {
    throw new Error(
      "No email provider configured. Set RESEND_API_KEY or SMTP_* variables first.",
    );
  }

  if (provider === "resend") {
    await sendTestViaResend(to, from);
  } else {
    await sendTestViaSmtp(to, from);
  }

  console.log(`Test email sent to ${to}.`);
}

main().catch((error) => {
  console.error("Email test failed:", formatEmailError(error));
  console.error(error);
  process.exit(1);
});
