export const VISITOR_LABELS = [
  "Microsoft Search Bot",
  "Google Search Bot",
  "Meta AI",
  "Known Supplier",
  "Unknown Scraper",
  "Returning Visitor",
  "Human Visitor",
  "Unclassified",
] as const;

export type VisitorLabel = (typeof VISITOR_LABELS)[number];

export type ClassifyVisitorInput = {
  userAgent?: string | null;
  ipAddress?: string | null;
  isKnownSupplier?: boolean;
  isReturningVisitor?: boolean;
};

const GOOGLE_BOT_RE =
  /\b(googlebot|google-extended|googleother|adsbot-google|mediapartners-google|storebot-google|google-inspectiontool|apis-google|feedfetcher-google)\b/i;

const MICROSOFT_BOT_RE =
  /\b(bingbot|bingpreview|msnbot|adidxbot|microsoftpreview)\b/i;

const META_BOT_RE =
  /\b(meta-externalagent|meta-externalfetcher|facebookexternalhit|facebot)\b/i;

/** Generic crawlers / scripted clients that are not a named search engine above. */
const UNKNOWN_SCRAPER_RE =
  /\b(bot|crawler|spider|scrapy|curl\/|wget\/|python-requests|python-urllib|go-http-client|java\/|apache-httpclient|okhttp|axios\/|node-fetch|puppeteer|playwright|headlesschrome|gptbot|chatgpt-user|claudebot|anthropic|bytespider|petalbot|ahrefsbot|semrushbot|dotbot|mj12bot|yandexbot|baiduspider|duckduckbot|applebot|amazonbot|chatgpt|openai)\b/i;

const BROWSER_HINT_RE =
  /\b(mozilla\/|chrome\/|safari\/|firefox\/|edg\/|opr\/|samsungbrowser\/)\b/i;

function normalizeUserAgent(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 500);
}

export function classifyVisitor(input: ClassifyVisitorInput): VisitorLabel {
  const ua = normalizeUserAgent(input.userAgent);

  if (ua) {
    if (MICROSOFT_BOT_RE.test(ua)) return "Microsoft Search Bot";
    if (GOOGLE_BOT_RE.test(ua)) return "Google Search Bot";
    if (META_BOT_RE.test(ua)) return "Meta AI";
    if (UNKNOWN_SCRAPER_RE.test(ua)) return "Unknown Scraper";
  }

  if (input.isKnownSupplier) {
    return "Known Supplier";
  }

  if (ua && BROWSER_HINT_RE.test(ua)) {
    if (input.isReturningVisitor) {
      return "Returning Visitor";
    }
    return "Human Visitor";
  }

  // No UA yet (legacy rows) or unusual client — still prefer supplier/returning signals.
  if (!ua) {
    if (input.isReturningVisitor) {
      return "Returning Visitor";
    }
    return "Unclassified";
  }

  if (input.isReturningVisitor) {
    return "Returning Visitor";
  }

  return "Human Visitor";
}

export function isBotVisitor(label: VisitorLabel) {
  return (
    label === "Microsoft Search Bot" ||
    label === "Google Search Bot" ||
    label === "Meta AI" ||
    label === "Unknown Scraper"
  );
}

export function isHumanVisitor(label: VisitorLabel) {
  return (
    label === "Human Visitor" ||
    label === "Returning Visitor" ||
    label === "Known Supplier"
  );
}

export function getUserAgentFromHeaders(headers: Headers) {
  return normalizeUserAgent(headers.get("user-agent"));
}
