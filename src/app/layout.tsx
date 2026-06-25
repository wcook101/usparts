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
    default: "USParts | Free Part Find System for Electronic Components",
    template: "%s | USParts",
  },
  description:
    "USParts is a free part find system for electronic components. Search MPNs, compare US supplier inventory, paste BOMs for multi-part lookup, and request quotes.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "USParts",
    title: "USParts | Free Part Find System for Electronic Components",
    description:
      "The most technically advanced part find system for electronic components — free to search and free to list. Find parts from US suppliers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "USParts | Free Part Find System",
    description:
      "Search electronic components, compare supplier inventory, and run multi-part BOM lookups — free.",
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
