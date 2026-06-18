import "dotenv/config";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import { SUPPORT_EMAIL } from "../src/lib/site";

function requireEnv(name: string): string {
  const raw = process.env[name]?.trim();
  if (!raw) {
    throw new Error(`Missing ${name}. Set SMTP variables in Railway or your .env file.`);
  }

  if (
    (raw.startsWith('"') && raw.endsWith('"')) ||
    (raw.startsWith("'") && raw.endsWith("'"))
  ) {
    return raw.slice(1, -1);
  }

  return raw;
}

async function main() {
  const host = requireEnv("SMTP_HOST");
  const port = Number(process.env.SMTP_PORT?.trim() || 587);
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const from = requireEnv("SMTP_FROM");

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

  const to = process.argv[2]?.trim() || SUPPORT_EMAIL;
  const subject = "USParts SMTP test";
  const text = [
    "This is a test email from the USParts SMTP configuration.",
    "",
    `Sent at: ${new Date().toISOString()}`,
    "",
    "If you received this, transactional email (support form, orders, password reset) should work.",
  ].join("\n");

  console.log(`Sending test message to ${to}...`);
  await transport.sendMail({ from, to, subject, text });
  console.log(`Test email sent to ${to}.`);
}

main().catch((error) => {
  console.error("SMTP test failed:", error);
  process.exit(1);
});
