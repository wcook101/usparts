export type SecurityBadge = {
  id: string;
  label: string;
  detail: string;
  href?: string;
};

export const securityBadges: SecurityBadge[] = [
  {
    id: "ssl",
    label: "SSL Secured",
    detail: "Encrypted HTTPS on every page",
  },
  {
    id: "privacy",
    label: "Privacy Protected",
    detail: "Your data handled per our privacy policy",
    href: "/privacy",
  },
  {
    id: "us-network",
    label: "US Supplier Network",
    detail: "Inventory prioritized from US warehouses",
  },
  {
    id: "verified",
    label: "Registered Suppliers",
    detail: "Companies verify identity to list stock",
  },
  {
    id: "free-search",
    label: "Free BOM Search",
    detail: "No fee to search MPNs or upload BOMs",
    href: "/search?mode=bulk",
  },
];
