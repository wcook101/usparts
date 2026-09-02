import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Do not Disallow /search?… — Google must recrawl those URLs to see
      // noindex and the 308 to /parts/{MPN}. Parameterized search is noindexed
      // in metadata instead.
      disallow: ["/api/", "/account", "/company/dashboard", "/company/import", "/company/listings", "/company/inbox", "/company/settings", "/company/team", "/orders", "/quotes"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
