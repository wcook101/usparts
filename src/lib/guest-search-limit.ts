import { cookies } from "next/headers";
import type { SessionUser } from "@/lib/auth/session";

export const GUEST_SEARCH_LIMIT = 3;
export const GUEST_SEARCH_COOKIE = "usparts_guest_searches";

export type GuestSearchAccess = {
  isGuest: boolean;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
};

const COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 365;

export async function getGuestSearchCount(): Promise<number> {
  const store = await cookies();
  const raw = store.get(GUEST_SEARCH_COOKIE)?.value;
  const parsed = Number.parseInt(raw ?? "0", 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

export async function getGuestSearchAccess(
  user: SessionUser | null,
): Promise<GuestSearchAccess> {
  if (user) {
    return {
      isGuest: false,
      allowed: true,
      used: 0,
      remaining: GUEST_SEARCH_LIMIT,
      limit: GUEST_SEARCH_LIMIT,
    };
  }

  const used = await getGuestSearchCount();
  return {
    isGuest: true,
    allowed: used < GUEST_SEARCH_LIMIT,
    used,
    remaining: Math.max(0, GUEST_SEARCH_LIMIT - used),
    limit: GUEST_SEARCH_LIMIT,
  };
}

export async function consumeGuestSearch(
  user: SessionUser | null,
): Promise<GuestSearchAccess> {
  if (user) {
    return getGuestSearchAccess(user);
  }

  const store = await cookies();
  const used = (await getGuestSearchCount()) + 1;
  store.set(GUEST_SEARCH_COOKIE, String(used), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SEC,
  });

  return {
    isGuest: true,
    allowed: used < GUEST_SEARCH_LIMIT,
    used,
    remaining: Math.max(0, GUEST_SEARCH_LIMIT - used),
    limit: GUEST_SEARCH_LIMIT,
  };
}

export function guestSearchLimitResponse() {
  return {
    error: "Create a free account to keep searching.",
    code: "GUEST_SEARCH_LIMIT",
    limit: GUEST_SEARCH_LIMIT,
    signupUrl: "/signup?reason=search-limit&next=/search",
    loginUrl: "/login?reason=search-limit&next=/search",
  };
}
