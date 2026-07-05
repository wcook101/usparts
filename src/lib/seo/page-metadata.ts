import type { Metadata } from "next";

type PageMeta = Pick<Metadata, "title" | "description">;

function seoTitle(title: string): Metadata["title"] {
  return { absolute: title };
}

export const pageMetadata = {
  login: {
    title: "Sign In — Search Obsolete Semiconductors & Electronic Components",
    description:
      "Sign in to USParts.us to search MPNs, compare US supplier inventory, request quotes, or manage your electronic component listings.",
  },
  signup: {
    title: "Create Free Account — Search & List Electronic Components",
    description:
      "Create a free USParts.us account to search obsolete semiconductors, ICs, and surplus parts, or register your company and list inventory for buyers.",
  },
  forgotPassword: {
    title: "Reset Password — USParts Account Recovery",
    description:
      "Reset your USParts.us password to regain access to electronic component search, quotes, orders, and supplier inventory tools.",
  },
  resetPassword: {
    title: "Set New Password — USParts Account Security",
    description:
      "Choose a new password for your USParts.us account to continue searching parts and managing supplier inventory.",
  },
  account: {
    title: "Account Settings — Profile & Password Management",
    description:
      "Update your USParts.us display name, email preferences, and password for electronic component search and supplier account access.",
  },
  help: {
    title: seoTitle("Contact Us - Sell or Source Electronic Components"),
    description:
      "Contact USParts.us to sell electronic component inventory, source hard-to-find parts, request quotes, or get help with free BOM search and marketplace listings.",
  },
  about: {
    title: seoTitle("About Us - Free Electronics Parts Marketplace"),
    description:
      "Learn about USParts.us, a free electronics parts marketplace for BOM search, supplier inventory listings, and connecting buyers with US electronic component stock.",
  },
  privacy: {
    title: "Privacy Policy — Electronic Component Search & Marketplace Data",
    description:
      "USParts.us privacy policy for electronic component search, supplier listings, quote requests, and account data on our free MPN and BOM lookup platform.",
  },
  terms: {
    title: "Terms of Service — USParts Electronic Component Marketplace",
    description:
      "Terms of service for using USParts.us to search electronic components, list supplier inventory, request quotes, and access free MPN and BOM search tools.",
  },
  searchDefault: {
    title: seoTitle("Search Electronic Components - Free BOM Upload & Quotes"),
    description:
      "Search electronic components by MPN or keyword, upload a BOM, compare US supplier inventory, and request quotes for free on USParts.us.",
  },
  searchBulk: {
    title: "Bulk BOM Part Search — Multi-MPN Electronic Component Lookup",
    description:
      "Paste a bill of materials (BOM) or part list to search hundreds of manufacturer part numbers at once. Compare US supplier inventory for semiconductors, ICs, and electronic components — free.",
  },
  searchSmart: {
    title: "Smart Part Search — Find Electronic Components by Description",
    description:
      "Describe the semiconductor, IC, connector, or electronic component you need in plain language. USParts smart search matches parts across US supplier inventory.",
  },
  supplierPortal: {
    title: seoTitle("Sell Your Electronics Inventory - Free Listing Platform"),
    description:
      "Register as a US electronic component supplier on USParts.us. List obsolete semiconductors, surplus ICs, and excess inventory by MPN so buyers can find and quote your stock — free.",
  },
  supplierDashboard: {
    title: "Supplier Dashboard — Manage Electronic Component Inventory",
    description:
      "Manage your company's electronic component listings, imports, orders, and quote requests on USParts.us. Buyers can search your MPN inventory without signing in.",
  },
  supplierUpload: {
    title: "Email Electronic Component Inventory Upload for Suppliers",
    description:
      "Email your semiconductor and electronic parts spreadsheet to upload@usparts.us. Our team imports MPNs, quantities, and pricing so buyers can search your surplus inventory on USParts.us.",
  },
  supplierImport: {
    title: "Bulk Import Semiconductors & Electronic Parts — CSV/Excel Upload",
    description:
      "Upload CSV or Excel files to publish hundreds of MPNs, quantities, prices, and warehouse locations for buyers searching obsolete semiconductors and surplus ICs on USParts.us.",
  },
  supplierListings: {
    title: "Manage Electronic Component Listings & MPN Inventory",
    description:
      "Edit, deactivate, or review your supplier listings for semiconductors, ICs, and electronic components listed on USParts.us.",
  },
  supplierNewListing: {
    title: "List a Part — Add MPN, Stock, Price & Location for Buyers",
    description:
      "Publish a single electronic component listing with manufacturer part number, quantity, pricing, condition, and warehouse location on USParts.us.",
  },
  supplierSettings: {
    title: "Company Settings — Supplier Profile & Warehouse Locations",
    description:
      "Update your supplier company name, website, contact details, and inventory locations shown to buyers searching electronic components on USParts.us.",
  },
  supplierInbox: {
    title: "Supplier Inbox — Orders & Quote Requests from Buyers",
    description:
      "Review incoming purchase orders and RFQs from buyers searching your obsolete semiconductors, ICs, and electronic component inventory on USParts.us.",
  },
  supplierTeam: {
    title: "Team Management — Invite Supplier & Buyer Accounts",
    description:
      "Invite colleagues to your USParts.us supplier company with buyer or inventory-admin access for electronic component listing and order management.",
  },
  orders: {
    title: "My Orders & Quote Requests — Electronic Component Activity",
    description:
      "Track orders and quote requests you have placed for semiconductors, ICs, and electronic components through USParts.us.",
  },
  orderConfirmation: {
    title: "Order Confirmation — Electronic Component Purchase",
    description:
      "Your electronic component order confirmation on USParts.us, including part details, supplier information, and next steps.",
  },
  quoteSent: {
    title: "Quote Request Sent — Electronic Component RFQ Confirmation",
    description:
      "Confirmation that your quote request for electronic components was sent to the supplier on USParts.us.",
  },
  invite: {
    title: "Accept Team Invite — Join Your Company on USParts",
    description:
      "Accept an invitation to join your company's USParts.us team for electronic component search, ordering, or inventory management.",
  },
  adminOverview: {
    title: "Platform Admin — Supplier Overview & System Health",
    description:
      "USParts.us platform admin dashboard for monitoring suppliers, users, listings, orders, imports, and system health.",
  },
  adminImport: {
    title: "Admin Import — Upload Supplier Electronic Component Inventory",
    description:
      "Import supplier spreadsheets for semiconductors, ICs, and electronic components on USParts.us. Admin imports bypass supplier cooldown limits.",
  },
  adminAliases: {
    title: "Part Number Aliases — MPN Search Mapping Admin",
    description:
      "Manage manufacturer part number aliases so buyers find alternate MPNs, package variants, and equivalent semiconductors during search on USParts.us.",
  },
  adminOutreach: {
    title: "Supplier Outreach — Track Onboarding & Inventory Uploads",
    description:
      "Track supplier outreach, follow-ups, registrations, and inventory upload progress for the USParts.us electronic component marketplace.",
  },
  blog: {
    title: seoTitle("Electronics Resale Blog - Tips for Selling Parts"),
    description:
      "Product guides, procurement tips, and industry insights for selling surplus inventory and sourcing semiconductors with free BOM search on USParts.us.",
  },
} satisfies Record<string, PageMeta>;

export function searchResultsMetadata(label: string): PageMeta {
  return {
    title: `${label} — Electronic Component Search Results`,
    description: `Find ${label} in stock from US suppliers. Compare pricing, quantity, lead time, and condition for obsolete semiconductors, ICs, and hard-to-find electronic components on USParts.us.`,
  };
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
    ? `${input.mpn} by ${input.manufacturer} — Buy, Quote & Compare US Supplier Stock`
    : `${input.mpn} — Electronic Component In Stock from US Suppliers`;

  const description =
    input.description?.trim() ||
    [
      `Find ${input.mpn}${input.manufacturer ? ` by ${input.manufacturer}` : ""} from US suppliers on USParts.us.`,
      input.categoryLabel ? `${input.categoryLabel} component.` : null,
      `${input.stockLabel} in stock.`,
      input.conditionLabel ? `Condition: ${input.conditionLabel}.` : null,
      input.priceLabel ? `Price: ${input.priceLabel}.` : null,
      "Request a quote or compare supplier inventory for obsolete and hard-to-find electronic parts.",
    ]
      .filter(Boolean)
      .join(" ");

  return { title, description };
}

export function editListingMetadata(input: {
  mpn: string;
  manufacturer: string | null;
}): PageMeta {
  const partLabel = input.manufacturer
    ? `${input.mpn} (${input.manufacturer})`
    : input.mpn;

  return {
    title: `Edit ${partLabel} — Supplier Listing Management`,
    description: `Update stock, pricing, condition, and warehouse details for ${partLabel} in your USParts.us supplier inventory.`,
  };
}
