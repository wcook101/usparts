import type { Metadata } from "next";

const MAX_TITLE_LEN = 60;
const MAX_DESC_LEN = 160;

type PageMeta = Pick<Metadata, "title" | "description" | "robots">;

function truncateAtWord(text: string, max: number): string {
  const normalized = text.trim().replace(/\s+/g, " ");
  if (normalized.length <= max) {
    return normalized;
  }

  const slice = normalized.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

export function seoTitle(title: string): Metadata["title"] {
  return { absolute: truncateAtWord(title, MAX_TITLE_LEN) };
}

export function seoDescription(description: string): string {
  const normalized = description.trim().replace(/\s+/g, " ");
  if (normalized.length <= MAX_DESC_LEN) {
    return normalized;
  }

  const trimmed = truncateAtWord(normalized, MAX_DESC_LEN - 3);
  return `${trimmed}...`;
}

function pageMeta(
  title: string,
  description: string,
  options?: { noindex?: boolean },
): PageMeta {
  return {
    title: seoTitle(title),
    description: seoDescription(description),
    ...(options?.noindex
      ? { robots: { index: false, follow: false } as const }
      : {}),
  };
}

export const pageMetadata = {
  login: pageMeta(
    "Sign In - Search & List Electronic Components",
    "Sign in to USParts.us to search MPNs and BOMs, compare US supplier inventory, request quotes, and manage electronic component listings.",
    { noindex: true },
  ),
  signup: pageMeta(
    "Create Account - Free Electronic Parts Search",
    "Create a free USParts.us account to search obsolete semiconductors, ICs, and surplus parts, or register your company and list inventory for buyers.",
    { noindex: true },
  ),
  forgotPassword: pageMeta(
    "Reset Password - USParts Account Recovery",
    "Reset your USParts.us password to regain access to electronic component search, quotes, orders, and supplier inventory tools.",
    { noindex: true },
  ),
  resetPassword: pageMeta(
    "Set New Password - USParts Account",
    "Choose a new password for your USParts.us account to continue searching parts and managing supplier inventory.",
    { noindex: true },
  ),
  account: pageMeta(
    "Account Settings - Profile & Security",
    "Update your USParts.us display name, email preferences, and password for electronic component search and supplier account access.",
    { noindex: true },
  ),
  help: pageMeta(
    "Contact Us - Sell or Source Electronic Components",
    "Contact USParts.us to sell surplus semiconductors, source obsolete ICs, request quotes, or get help with free BOM search and marketplace listings.",
  ),
  about: pageMeta(
    "About Us - Free Electronics Parts Marketplace",
    "USParts.us is a free electronics parts marketplace for BOM search, supplier inventory listings, and connecting buyers with US semiconductor and component stock.",
  ),
  privacy: pageMeta(
    "Privacy Policy - Electronic Parts Marketplace",
    "USParts.us privacy policy for electronic component search, supplier listings, quote requests, and account data on our free MPN and BOM lookup platform.",
  ),
  terms: pageMeta(
    "Terms of Service - USParts Marketplace",
    "Terms of service for using USParts.us to search electronic components, list supplier inventory, request quotes, and access free MPN and BOM search tools.",
  ),
  searchDefault: pageMeta(
    "Search Electronic Components - Free BOM & Quotes",
    "Search electronic components by MPN or keyword, upload a BOM, compare US supplier inventory, and request quotes for obsolete semiconductors and ICs — free.",
  ),
  searchBulk: pageMeta(
    "Bulk BOM Search - Multi-MPN Component Lookup",
    "Paste a bill of materials to search hundreds of manufacturer part numbers at once. Compare US supplier stock for semiconductors, ICs, and electronic components.",
  ),
  searchSmart: pageMeta(
    "Smart Search - Find Parts by Description",
    "Describe the semiconductor, IC, connector, or electronic component you need in plain language. USParts smart search matches parts across US supplier inventory.",
  ),
  supplierPortal: pageMeta(
    "Sell Your Electronics Inventory - Free Listing Platform",
    "Register as a US electronic component supplier on USParts.us. List obsolete semiconductors, surplus ICs, and excess inventory by MPN so buyers can find your stock.",
  ),
  supplierDashboard: pageMeta(
    "Supplier Dashboard - Inventory & Orders",
    "Manage your company's electronic component listings, imports, orders, and quote requests on USParts.us. Buyers can search your MPN inventory without signing in.",
    { noindex: true },
  ),
  supplierUpload: pageMeta(
    "Upload Inventory by Email - Free Supplier Listing",
    "Email your semiconductor and electronic parts spreadsheet to upload@usparts.us. We import MPNs, quantities, and pricing so buyers can search your surplus inventory.",
  ),
  supplierImport: pageMeta(
    "Bulk Import Parts - CSV & Excel Upload",
    "Upload CSV or Excel files to publish hundreds of MPNs, quantities, prices, and warehouse locations for buyers searching obsolete semiconductors and surplus ICs.",
    { noindex: true },
  ),
  supplierListings: pageMeta(
    "Manage Listings - MPN Inventory Dashboard",
    "Edit, deactivate, or review your supplier listings for semiconductors, ICs, and electronic components listed on USParts.us.",
    { noindex: true },
  ),
  supplierNewListing: pageMeta(
    "Add Part Listing - MPN, Qty & Price",
    "Publish a single electronic component listing with manufacturer part number, quantity, pricing, condition, and warehouse location on USParts.us.",
    { noindex: true },
  ),
  supplierSettings: pageMeta(
    "Company Settings - Supplier Profile",
    "Update your supplier company name, website, contact details, and inventory locations shown to buyers searching electronic components on USParts.us.",
    { noindex: true },
  ),
  supplierInbox: pageMeta(
    "Supplier Inbox - Orders & RFQs",
    "Review incoming purchase orders and RFQs from buyers searching your obsolete semiconductors, ICs, and electronic component inventory on USParts.us.",
    { noindex: true },
  ),
  supplierTeam: pageMeta(
    "Team Access - Invite Supplier Users",
    "Invite colleagues to your USParts.us supplier company with buyer or inventory-admin access for electronic component listing and order management.",
    { noindex: true },
  ),
  orders: pageMeta(
    "My Orders - Electronic Component Purchases",
    "Track orders and quote requests you have placed for semiconductors, ICs, and electronic components through USParts.us.",
    { noindex: true },
  ),
  orderConfirmation: pageMeta(
    "Order Confirmation - Electronic Component Purchase",
    "Your electronic component order confirmation on USParts.us, including part details, supplier information, and next steps.",
    { noindex: true },
  ),
  quoteSent: pageMeta(
    "Quote Request Sent - Component RFQ Confirmation",
    "Confirmation that your quote request for electronic components was sent to the supplier on USParts.us.",
    { noindex: true },
  ),
  invite: pageMeta(
    "Team Invite - Join Your Company on USParts",
    "Accept an invitation to join your company's USParts.us team for electronic component search, ordering, or inventory management.",
    { noindex: true },
  ),
  adminOverview: pageMeta(
    "Platform Admin - Supplier Overview",
    "USParts.us platform admin dashboard for monitoring suppliers, users, listings, orders, imports, and system health.",
    { noindex: true },
  ),
  adminImport: pageMeta(
    "Admin Import - Supplier Inventory Upload",
    "Import supplier spreadsheets for semiconductors, ICs, and electronic components on USParts.us. Admin imports bypass supplier cooldown limits.",
    { noindex: true },
  ),
  adminAliases: pageMeta(
    "Part Number Aliases - MPN Search Admin",
    "Manage manufacturer part number aliases so buyers find alternate MPNs, package variants, and equivalent semiconductors during search on USParts.us.",
    { noindex: true },
  ),
  adminOutreach: pageMeta(
    "Supplier Outreach - Onboarding Tracker",
    "Track supplier outreach, follow-ups, registrations, and inventory upload progress for the USParts.us electronic component marketplace.",
    { noindex: true },
  ),
  blog: pageMeta(
    "Blog & Guides - Electronic Component Search Tips",
    "Free guides on BOM search, MPN lookup, supplier quotes, selling surplus inventory, and sourcing obsolete semiconductors on USParts.us.",
  ),
  listingNotFound: pageMeta(
    "Part Not Found - Electronic Component Listing",
    "This electronic component listing is no longer available on USParts.us. Search MPNs to find in-stock semiconductors and ICs from US suppliers.",
  ),
  editListingNotFound: pageMeta(
    "Edit Listing - Supplier Inventory Management",
    "Update an electronic component listing in your USParts.us supplier inventory.",
    { noindex: true },
  ),
} satisfies Record<string, PageMeta>;

export function searchResultsMetadata(label: string): PageMeta {
  const cleanLabel = label.trim().replace(/\s*·\s*/g, " ").replace(/\s+/g, " ");
  const title = `${cleanLabel} MPN Search - US Supplier Stock`;

  return pageMeta(
    title,
    `Find ${cleanLabel} in stock from US electronics suppliers. Compare pricing, quantity, lead time, and condition for obsolete semiconductors, ICs, and hard-to-find components on USParts.us.`,
  );
}

export function listingMetadata(input: {
  mpn: string;
  manufacturer: string | null;
  description: string | null | undefined;
  categoryLabel: string | null;
  conditionLabel: string | null;
  stockLabel: string;
  priceLabel: string;
}): PageMeta {
  const title = input.manufacturer
    ? `${input.mpn} - ${input.manufacturer} Stock & Quotes`
    : `${input.mpn} - Electronic Component In Stock`;

  const builtDescription = [
    `Buy or request a quote for ${input.mpn}${input.manufacturer ? ` by ${input.manufacturer}` : ""} from US suppliers on USParts.us.`,
    input.categoryLabel ? `${input.categoryLabel} component.` : null,
    `${input.stockLabel} in stock.`,
    input.conditionLabel ? `Condition: ${input.conditionLabel}.` : null,
    input.priceLabel ? `Price: ${input.priceLabel}.` : null,
    "Compare supplier inventory for obsolete and hard-to-find electronic parts.",
  ]
    .filter(Boolean)
    .join(" ");

  const description =
    input.description?.trim() && input.description.trim().length >= 80
      ? input.description.trim()
      : builtDescription;

  return pageMeta(title, description);
}

export function editListingMetadata(input: {
  mpn: string;
  manufacturer: string | null;
}): PageMeta {
  const partLabel = input.manufacturer
    ? `${input.mpn} (${input.manufacturer})`
    : input.mpn;

  return pageMeta(
    `Edit ${partLabel} - Supplier Listing`,
    `Update stock, pricing, condition, and warehouse details for ${partLabel} in your USParts.us supplier inventory.`,
    { noindex: true },
  );
}

export function orderMetadata(partLabel: string): PageMeta {
  return pageMeta(
    `${partLabel} - Order Confirmation`,
    `Order confirmation for ${partLabel} on USParts.us, including supplier details, quantity, and purchase status.`,
    { noindex: true },
  );
}

export function quoteMetadata(partLabel: string): PageMeta {
  return pageMeta(
    `${partLabel} - Quote Request Sent`,
    `Your quote request for ${partLabel} was sent to the supplier on USParts.us. Track RFQ status from your account activity page.`,
    { noindex: true },
  );
}

export function blogArticleMetadata(input: {
  title: string;
  description: string;
  publishedAt: string;
}): Metadata {
  return {
    title: seoTitle(input.title),
    description: seoDescription(input.description),
    openGraph: {
      title: truncateAtWord(input.title, MAX_TITLE_LEN),
      description: seoDescription(input.description),
      type: "article",
      publishedTime: input.publishedAt,
    },
  };
}

export function partPageMetadata(input: {
  mpn: string;
  manufacturer: string | null;
  description: string | null;
  supplierCount: number;
  totalQuantity: number;
  lowestPrice: number | null;
}): PageMeta {
  const manufacturerLabel = input.manufacturer ? ` by ${input.manufacturer}` : "";
  const title = `${input.mpn}${manufacturerLabel} - Buy, Price & Stock`;

  const priceSnippet =
    input.lowestPrice !== null
      ? ` Prices from $${input.lowestPrice.toFixed(2)}.`
      : " Request quotes for bulk pricing.";

  const description =
    input.description?.trim() ||
    `Buy ${input.mpn}${manufacturerLabel} from ${input.supplierCount} US supplier${input.supplierCount === 1 ? "" : "s"} on USParts.us.${priceSnippet} ${input.totalQuantity.toLocaleString()} units in stock. Compare offers, view datasheets, and request quotes.`;

  return pageMeta(title, description);
}

export function partPageNotFoundMetadata(mpn: string): PageMeta {
  return pageMeta(
    `${mpn} - Part Not Found`,
    `No active US supplier listings found for ${mpn}. Search MPNs and BOMs for semiconductors, ICs, and electronic components on USParts.us.`,
  );
}

export function manufacturersIndexMetadata(): PageMeta {
  return pageMeta(
    "Electronic Component Manufacturers - US Stock",
    "Browse Texas Instruments, Analog Devices, Microchip, STMicro, NXP, and more. Search US supplier inventory by semiconductor manufacturer on USParts.us.",
  );
}

export function manufacturerPageMetadata(input: {
  name: string;
  listingCount: number;
  partCount: number;
}): PageMeta {
  const title = `${input.name} Parts - US Stock & Quotes`;
  const description =
    input.listingCount > 0
      ? `Search ${input.partCount.toLocaleString()} ${input.name} part numbers from US suppliers on USParts.us. ${input.listingCount.toLocaleString()} active listings — compare stock, request quotes, and upload BOMs.`
      : `Search ${input.name} semiconductors and ICs from US suppliers on USParts.us. Compare surplus inventory, request quotes, and run free BOM search.`;

  return pageMeta(title, description);
}

export function manufacturerPageNotFoundMetadata(): PageMeta {
  return pageMeta(
    "Manufacturer Not Found",
    "Browse semiconductor manufacturers with active US supplier inventory on USParts.us.",
  );
}
