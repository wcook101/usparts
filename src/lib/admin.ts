import { AuthError } from "@/lib/auth/errors";
import { getSessionUser, type SessionUser } from "@/lib/auth/session";

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

/** Prefer this in admin APIs so non-admins get a generic 404, not a permission leak. */
export async function requirePlatformAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();

  if (!user || !isPlatformAdmin(user.email)) {
    throw new AuthError("Not found", 404);
  }

  return user;
}
