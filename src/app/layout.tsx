import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Roboto_Mono } from "next/font/google";
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

const robotoMono = Roboto_Mono({
  variable: "--font-roboto-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: "Electronics Parts Marketplace - Free BOM Search & Inventory",
    template: "%s | USParts",
  },
  description:
    "Free BOM search and electronics marketplace – list inventory or find parts instantly. Search obsolete semiconductors, ICs, and surplus stock by MPN from US suppliers on USParts.us.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "USParts",
    title: "Electronics Parts Marketplace - Free BOM Search & Inventory",
    description:
      "Find obsolete semiconductors, integrated circuits, and surplus electronic parts from US suppliers. Free MPN search, bulk BOM lookup, and quote requests.",
  },
  twitter: {
    card: "summary_large_image",
    title: "USParts.us | Free Obsolete Semiconductor & Electronic Component Search",
    description:
      "Search manufacturer part numbers, compare US supplier stock, and run bulk BOM lookups for semiconductors and electronic components — free.",
  },
  verification: {
    google: "7v20lSf51vU3qHgGO_QwMALrcWE-bzP9pihlTsJfnC8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${robotoMono.variable} h-full antialiased`}
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
