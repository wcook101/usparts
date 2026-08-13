import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Roboto_Mono } from "next/font/google";
import { Footer } from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { Header } from "@/components/Header";
import { MicrosoftClarity } from "@/components/MicrosoftClarity";
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
    default: "Electronic Component Marketplace | ICs & Semiconductors",
    template: "%s | USParts",
  },
  description:
    "Free electronic component marketplace for ICs, semiconductors, and obsolete or surplus stock. Search by MPN for price and availability from US suppliers, or list inventory free.",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "USParts",
    title: "Electronic Component Marketplace | ICs & Semiconductors",
    description:
      "Find obsolete semiconductors, integrated circuits, and surplus electronic parts from US suppliers. Free MPN search, price and availability, bulk BOM lookup, and quote requests.",
  },
  twitter: {
    card: "summary_large_image",
    title: "USParts.us | ICs, Semiconductors & Obsolete Parts Marketplace",
    description:
      "Search manufacturer part numbers for price and availability, cross-reference obsolete parts, and run bulk BOM lookups for ICs and semiconductors — free.",
  },
  verification: {
    google: "7v20lSf51vU3qHgGO_QwMALrcWE-bzP9pihlTsJfnC8",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1628",
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
      <body className="relative min-h-full bg-white text-[#0a1628]">
        <GoogleAnalytics />
        <MicrosoftClarity />
        <Header />
        <main className="relative flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
