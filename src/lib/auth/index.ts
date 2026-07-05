export { SESSION_COOKIE_NAME, SESSION_DURATION_MS } from "@/lib/auth/constants";
export { AuthError, isAuthError } from "@/lib/auth/errors";
export { hashPassword, verifyPassword } from "@/lib/auth/password";
export {
  authErrorResponse,
  clearSessionCookie,
  createSession,
  deleteSessionByToken,
  getBuyerDefaults,
  getSessionUser,
  requireAuth,
  requireCompanyOwner,
  requireCompanyTeamOwner,
  requireOwnedCompany,
  setSessionCookie,
  toAuthUserPayload,
  type SessionUser,
} from "@/lib/auth/session";
export {
  claimCompanyForUser,
  detachPlatformAdminSupplierIdentity,
  findOwnedCompany,
  linkUnownedCompanyByEmail,
} from "@/lib/auth/ownership";
export {
  acceptCompanyInvite,
  createCompanyInvite,
  getInviteByToken,
} from "@/lib/auth/invites";
export {
  canInviteMembers,
  canManageInventory,
  ensureOwnerMembership,
  getCompanyAccess,
  type CompanyMembership,
} from "@/lib/auth/membership";
export {
  canViewBuyerResource,
  getSessionCompany,
  getSessionRole,
  userBelongsToCompany,
  userCanManageInventory,
} from "@/lib/auth/resource-access";
export {
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/lib/auth/password-reset";
