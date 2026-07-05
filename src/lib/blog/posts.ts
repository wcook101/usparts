export type BlogSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: "Selling" | "Sourcing" | "Guides" | "Marketplace";
  publishedAt: string;
  readTime: string;
  intro: string;
  sections: BlogSection[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "how-to-sell-excess-electronic-component-inventory",
    title: "How to Sell Excess Electronic Component Inventory Online",
    description:
      "A practical guide for distributors and OEMs on listing surplus semiconductors, ICs, and electronic parts so buyers can find your stock through free BOM search and marketplace listings.",
    category: "Selling",
    publishedAt: "2026-06-15",
    readTime: "6 min read",
    intro:
      "Excess inventory ties up cash, warehouse space, and management attention. If you have surplus semiconductors, connectors, or obsolete ICs sitting on shelves, listing them on a free electronics marketplace is one of the fastest ways to reach active buyers searching by manufacturer part number.",
    sections: [
      {
        heading: "Start with clean MPN data",
        paragraphs: [
          "Buyers search by manufacturer part number (MPN). The most successful supplier listings use the exact MPN printed on the label or datasheet, plus manufacturer name, quantity on hand, date code, condition, and price or a note that pricing is on request.",
          "Spreadsheets with inconsistent part numbers — missing dashes, wrong package suffixes, or internal SKUs instead of manufacturer MPNs — are the main reason surplus stock does not get found.",
        ],
        bullets: [
          "Use manufacturer MPNs, not internal warehouse codes",
          "Include manufacturer, quantity, condition, and location",
          "Add date codes when available for traceability",
          "Separate new, refurbished, and used stock if conditions differ",
        ],
      },
      {
        heading: "Choose a free listing platform first",
        paragraphs: [
          "Paid listing fees eat into margins on low-value surplus lines. USParts.us is built as a free electronics parts marketplace: suppliers can register, upload inventory, and appear in BOM search results without per-part listing charges.",
          "That makes it practical to publish your full available stock — not just the handful of high-value lines that justify a paid portal.",
        ],
      },
      {
        heading: "Upload once, stay visible in search",
        paragraphs: [
          "After you register your company, you can email a CSV or Excel file to upload@usparts.us for hands-free import, or use bulk import online. Buyers searching single MPNs or pasting entire BOMs will see your listings when you match their query.",
          "Refresh quantities after shipments so buyers trust your stock levels. Stale listings create quote requests for parts you no longer have.",
        ],
      },
      {
        heading: "Respond quickly to quotes and orders",
        paragraphs: [
          "Marketplace traffic only converts when suppliers reply. Monitor your supplier inbox for quote requests and orders, confirm lead times, and follow up directly with buyers on payment and shipping.",
          "Fast responses improve your reputation with repeat procurement teams who search the same BOM every quarter.",
        ],
      },
    ],
  },
  {
    slug: "what-is-bom-search-for-electronic-components",
    title: "What Is BOM Search for Electronic Components?",
    description:
      "Learn how bill of materials (BOM) search helps procurement teams compare US supplier inventory for hundreds of MPNs at once — and why free BOM upload tools matter for obsolete parts.",
    category: "Sourcing",
    publishedAt: "2026-06-08",
    readTime: "5 min read",
    intro:
      "A bill of materials (BOM) is the list of manufacturer part numbers required to build a board, assembly, or repair kit. BOM search lets buyers paste that list into a marketplace and see which lines are in stock from registered suppliers — instead of searching one MPN at a time.",
    sections: [
      {
        heading: "Why procurement teams use BOM search",
        paragraphs: [
          "Contract manufacturers, repair depots, and OEM procurement desks often need dozens or hundreds of lines at once. Single-part search works for one shortage; BOM search works for production planning, end-of-life redesigns, and cost-down projects.",
          "Free BOM search on USParts.us runs an indexed lookup across supplier inventory so you can compare availability before contacting vendors individually.",
        ],
      },
      {
        heading: "How to format a BOM for upload",
        paragraphs: [
          "You do not need a formal ERP export. A simple list of MPNs — one per line or separated by spaces — is enough to start. Include manufacturer names in your internal worksheet if you have them, but the search engine primarily matches on part numbers and known aliases.",
        ],
        bullets: [
          "One MPN per line is easiest to review",
          "Space-separated lists also work for quick checks",
          "Package variants (LM358N vs LM358D) may match related suffixes",
          "Re-run the BOM after updating your internal shortage list",
        ],
      },
      {
        heading: "When BOM search beats broker calls",
        paragraphs: [
          "Brokers are useful for hard-to-find lines, but calling for every BOM line is slow. BOM search shows what is already published in US supplier inventory. Use quote requests on matching listings to confirm price, date code, and lead time before you pick up the phone.",
        ],
      },
    ],
  },
  {
    slug: "how-to-find-obsolete-semiconductors-and-ics",
    title: "How to Find Obsolete Semiconductors and Hard-to-Find ICs",
    description:
      "Strategies for sourcing obsolete semiconductors, end-of-life ICs, and legacy electronic components using MPN search, BOM tools, and US supplier marketplaces.",
    category: "Sourcing",
    publishedAt: "2026-05-28",
    readTime: "7 min read",
    intro:
      "Obsolete semiconductors do not disappear from service boards when the factory stops making them. Maintenance teams, aerospace programs, and industrial controls still need those exact MPNs — often years after the original distributor delisted them.",
    sections: [
      {
        heading: "Search the exact MPN first",
        paragraphs: [
          "Start with the full manufacturer part number including package suffix. USParts.us indexes supplier listings by MPN and matches common variants so LM358, LM358N, and related lines surface together when suppliers published them.",
          "If the exact suffix is unavailable, review cross-reference datasheets internally before substituting — marketplace search shows what exists, not what is electrically equivalent.",
        ],
      },
      {
        heading: "Look for surplus inventory, not just franchised stock",
        paragraphs: [
          "Obsolete parts often live in excess inventory at independent distributors, contract manufacturers, and asset recovery firms. Those sellers list surplus on marketplaces because franchised channels no longer carry the line.",
          "Free electronics marketplaces aggregate that fragmented supply so you are not calling ten warehouses for one BOM.",
        ],
      },
      {
        heading: "Use quotes when price is not published",
        paragraphs: [
          "Legacy or scarce lines frequently show as price on request. Submit a quote request with quantity and needed date code range. Suppliers with stock can respond with formal offers without you committing to buy through an anonymous form.",
        ],
      },
      {
        heading: "Document sources for quality-sensitive programs",
        paragraphs: [
          "For regulated industries, keep traceability on date code, condition, and supplier identity. Marketplace listings show supplier company names so your quality team can approve vendors before purchase.",
        ],
      },
    ],
  },
  {
    slug: "prepare-spreadsheet-for-electronics-inventory-upload",
    title: "How to Prepare a Spreadsheet for Electronics Inventory Upload",
    description:
      "Column-by-column checklist for suppliers uploading CSV or Excel inventory to USParts.us — MPN, manufacturer, quantity, price, condition, and warehouse location.",
    category: "Guides",
    publishedAt: "2026-05-18",
    readTime: "5 min read",
    intro:
      "Whether you email upload@usparts.us or import online, a clean spreadsheet is the difference between going live in one pass and spending an afternoon fixing mapping errors.",
    sections: [
      {
        heading: "Required columns for most uploads",
        paragraphs: [
          "At minimum, include manufacturer part number and quantity. Manufacturer name, description, condition, price, currency, date code, and warehouse city/state/country help buyers filter and trust your listings.",
        ],
        bullets: [
          "MPN / part number",
          "Manufacturer",
          "Quantity available",
          "Condition (new, refurbished, used)",
          "Unit price or blank for quote-only",
          "City, state, and country for stock location",
        ],
      },
      {
        heading: "Common spreadsheet mistakes",
        paragraphs: [
          "Merged cells, summary rows, and tab names with pricing notes break imports. Use one row per SKU. Remove subtotals and blank separator rows before upload.",
          "Scientific notation in Excel can corrupt MPNs that look like numbers — format part number columns as text before saving.",
        ],
      },
      {
        heading: "Email vs online import",
        paragraphs: [
          "Email is best when you want the USParts team to validate mapping for a messy export from your ERP. Online bulk import is best when you already have a standardized surplus file and want immediate control over append vs replace modes.",
        ],
      },
    ],
  },
  {
    slug: "pricing-surplus-electronic-components",
    title: "Tips for Pricing Surplus Electronic Components",
    description:
      "How to price obsolete semiconductors, excess ICs, and surplus electronic parts for marketplace listings — without leaving money on the table or scaring away buyers.",
    category: "Selling",
    publishedAt: "2026-05-02",
    readTime: "6 min read",
    intro:
      "Surplus pricing is part art, part data. List too high and buyers skip your line; list too low and you leave margin on the table. Marketplaces work best when pricing is transparent enough to compare and flexible enough for negotiation on scarce lines.",
    sections: [
      {
        heading: "Anchor on recent broker and marketplace comps",
        paragraphs: [
          "Search your own MPN on USParts.us before publishing. If other suppliers show public pricing, you know the visible market range. For rare lines with no comps, quote-only listings often outperform guessed high prices that never get clicks.",
        ],
      },
      {
        heading: "Price by condition and date code",
        paragraphs: [
          "New factory-sealed stock commands a premium over pulled or refurbished parts. Date code matters in defense, medical, and long-life industrial programs — note restrictions in your listing description when older date codes apply.",
        ],
      },
      {
        heading: "Use tier breaks for high-quantity lines",
        paragraphs: [
          "If you have thousands of a commodity line, consider whether your unit price reflects full-package purchase. Buyers filling a BOM may only need 50–200 pieces; a realistic break quantity in your quote response wins more deals than a MOQ meant for brokers only.",
        ],
      },
    ],
  },
  {
    slug: "source-electronic-components-from-us-suppliers",
    title: "How to Source Electronic Components from US Suppliers",
    description:
      "Why US-based inventory matters for lead time, compliance, and counterfeit risk — and how to search US supplier stock by MPN and BOM on USParts.us.",
    category: "Sourcing",
    publishedAt: "2026-04-22",
    readTime: "5 min read",
    intro:
      "USParts.us prioritizes inventory located in the United States so procurement teams can shorten freight time, simplify timezone communication, and reduce surprises on import compliance for domestic programs.",
    sections: [
      {
        heading: "Filter by what matters on each line",
        paragraphs: [
          "Search results show supplier name, warehouse location, quantity, condition, and price when published. Use that to shortlist vendors before you request formal quotes on lines that matter for your build.",
        ],
      },
      {
        heading: "Combine single-part and BOM workflows",
        paragraphs: [
          "Use single MPN search for emergency shortages on one or two lines. Use multi-part BOM mode when planning builds or comparing alternates across a full kit. Both are free on USParts.us.",
        ],
      },
      {
        heading: "Build a repeatable supplier shortlist",
        paragraphs: [
          "When a supplier fills several BOM lines with good date codes and response times, note them for future projects. Marketplaces make discovery easy; relationships still close the order.",
        ],
      },
    ],
  },
  {
    slug: "mpn-search-guide-for-electronic-components",
    title: "MPN Search Guide: How to Look Up Electronic Components Correctly",
    description:
      "Manufacturer part number (MPN) search tips for buyers and sellers — suffixes, aliases, common typos, and how USParts.us matches supplier inventory.",
    category: "Guides",
    publishedAt: "2026-04-10",
    readTime: "4 min read",
    intro:
      "An MPN is the manufacturer’s catalog identifier for a specific package and revision of a part. Search engines only work when you speak the same language as the datasheet and the supplier’s spreadsheet.",
    sections: [
      {
        heading: "Include package and temperature grade when relevant",
        paragraphs: [
          "NE555P, NE555D, and NE555DR are related but not identical stocking units. Search the suffix your BOM specifies first, then review variant matches suppliers published.",
        ],
      },
      {
        heading: "Try manufacturer plus keyword for broad exploration",
        paragraphs: [
          "When you do not have an exact MPN yet — for example during a redesign — keyword search and describe-a-part smart search can narrow candidates before you lock a bill of materials.",
        ],
      },
      {
        heading: "Listings link to live supplier stock",
        paragraphs: [
          "Search results on USParts.us reflect inventory suppliers uploaded. If no line appears, the part may still exist in the market but no registered supplier has listed it yet — quote outreach to sellers or list a wanted line through support if you operate at volume.",
        ],
      },
    ],
  },
  {
    slug: "free-electronics-marketplace-vs-brokers",
    title: "Free Electronics Marketplaces vs Brokers: When to Use Each",
    description:
      "Compare free BOM search and inventory listing platforms with traditional component brokers for sourcing obsolete parts and selling surplus electronic inventory.",
    category: "Marketplace",
    publishedAt: "2026-03-28",
    readTime: "6 min read",
    intro:
      "Brokers and marketplaces solve different problems. Brokers excel at blind searches and negotiation for scarce lines. Marketplaces excel at visibility, self-service search, and publishing surplus at scale.",
    sections: [
      {
        heading: "When a free marketplace is the right first step",
        paragraphs: [
          "If you have identifiable MPNs and want buyers to find you, list on USParts.us for free. If you are buying and already know the part numbers on your BOM, run marketplace search before paying broker fees on every line.",
        ],
      },
      {
        heading: "When brokers still add value",
        paragraphs: [
          " Extremely scarce obsolete ICs, untested brokered lots with unclear pedigree, and last-rescue timelines may still need a broker’s phone network. Use marketplace data to inform those calls instead of starting cold.",
        ],
      },
      {
        heading: "Use both in a hybrid sourcing stack",
        paragraphs: [
          "Best-in-class procurement teams publish excess on marketplaces, search free BOM tools for buy-side coverage, and reserve brokers for lines that fail automated search — not for every routine commodity part.",
        ],
      },
    ],
  },
];

export function getAllBlogPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function formatBlogDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${isoDate}T12:00:00`));
}
