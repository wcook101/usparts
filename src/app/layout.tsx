import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
import { PartsBackground } from "@/components/PartsBackground";
import { getSiteUrl } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default:
      "USParts | Free Electronic Component Search — Obsolete Semiconductors & MPN Lookup",
    template: "%s | USParts",
  },
  description:
    "Search obsolete semiconductors, ICs, and hard-to-find electronic components by MPN or BOM. Compare US supplier inventory, pricing, and stock — free on USParts.us.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "USParts",
    title:
      "USParts | Free Electronic Component Search — Obsolete Semiconductors & MPN Lookup",
    description:
      "Find obsolete semiconductors, integrated circuits, and surplus electronic parts from US suppliers. Free MPN search, bulk BOM lookup, and quote requests.",
  },
  twitter: {
    card: "summary_large_image",
    title: "USParts | Free Electronic Component & MPN Search",
    description:
      "Search manufacturer part numbers, compare US supplier stock, and run bulk BOM lookups for semiconductors and electronic components — free.",
  },
  verification: {
    google: "7v20lSf51vU3qHgGO_QwMALrcWE-bzP9pihlTsJfnC8",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative min-h-full text-slate-900">
        <MicrosoftClarity />
        <PartsBackground variant="site" idPrefix="site" fixed />
        <Header />
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
