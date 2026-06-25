export const SUPPORT_EMAIL = "support@usparts.us";
export const UPLOAD_EMAIL = "upload@usparts.us";

export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`;

/** Legal entity operating the USParts marketplace. */
export const LEGAL_ENTITY_NAME = "William Ward LLC";
export const TRADE_NAME = "USParts";
export const LEGAL_ENTITY_STATE = "Pennsylvania";

export const LEGAL_ENTITY_DBA_LINE = `${LEGAL_ENTITY_NAME} d/b/a ${TRADE_NAME}`;

export function getLegalEntityDescription(): string {
  return `${LEGAL_ENTITY_NAME}, a ${LEGAL_ENTITY_STATE} limited liability company, doing business as ${TRADE_NAME}`;
}

export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || "https://www.usparts.us";
}

type UploadMailtoOptions = {
  companyName?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
};

export function buildUploadMailto(options: UploadMailtoOptions = {}): string {
  const companyName = options.companyName?.trim() || "";
  const contactName = options.contactName?.trim() || "";
  const contactEmail = options.contactEmail?.trim() || "";

  const subject = companyName
    ? `Inventory upload - ${companyName}`
    : "Inventory upload for USParts";

  const body = [
    "Hello USParts team,",
    "",
    "Please import the attached inventory spreadsheet to my supplier account.",
    "",
    `Company name: ${companyName}`,
    `Contact name: ${contactName}`,
    `Contact email: ${contactEmail}`,
    "",
    "Attached file: CSV or Excel (.xlsx / .xls)",
    "",
    "If I do not have a USParts account yet, please let me know what you need to set one up.",
    "",
    "Thank you,",
  ].join("\n");

  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${UPLOAD_EMAIL}?${params.toString()}`;
}
