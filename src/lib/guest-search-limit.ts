export const GUEST_SEARCH_LIMIT = 3;
export const GUEST_SEARCH_COOKIE = "usparts_guest_searches";

export type GuestSearchAccess = {
  isGuest: boolean;
  allowed: boolean;
  used: number;
  remaining: number;
  limit: number;
};

export function guestSearchLimitResponse() {
  return {
    error: "Create a free account to keep searching.",
    code: "GUEST_SEARCH_LIMIT",
    limit: GUEST_SEARCH_LIMIT,
    signupUrl: "/signup?reason=search-limit&next=/search",
    loginUrl: "/login?reason=search-limit&next=/search",
  };
}
