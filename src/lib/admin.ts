import { AuthError } from "@/lib/auth/errors";
import { requireAuth, type SessionUser } from "@/lib/auth/session";

function parseAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

export function isPlatformAdmin(email: string): boolean {
  const admins = parseAdminEmails();
  if (admins.size === 0) {
    return false;
  }

  return admins.has(email.trim().toLowerCase());
}

export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await requireAuth();

  if (!isPlatformAdmin(user.email)) {
    throw new AuthError("Admin access required", 403);
  }

  return user;
}
