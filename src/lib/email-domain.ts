import { normalizeEmail } from "@/lib/auth/ownership";

export function getEmailDomain(email: string): string {
  const normalized = normalizeEmail(email);
  const atIndex = normalized.lastIndexOf("@");
  if (atIndex < 0) {
    return "";
  }

  return normalized.slice(atIndex + 1);
}

export function emailMatchesDomain(email: string, domain: string): boolean {
  const emailDomain = getEmailDomain(email);
  const expected = domain.trim().toLowerCase().replace(/^@+/, "");
  return emailDomain.length > 0 && emailDomain === expected;
}
