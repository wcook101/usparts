import Link from "next/link";
import { SecurityBadges } from "@/components/trust/SecurityBadges";
import {
  LEGAL_ENTITY_DBA_LINE,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  TRADE_NAME,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          <Link
            href="/search"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Search Parts
          </Link>
          <Link
            href="/company/upload"
            className="inline-flex items-center justify-center rounded-lg border-2 border-slate-900 px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            List Inventory
          </Link>
          <Link
            href="/blog"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Blog & Guides
          </Link>
        </div>

        <div className="mb-8">
          <SecurityBadges variant="grid" />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p>
              © {new Date().getFullYear()} {LEGAL_ENTITY_NAME}. {TRADE_NAME} is a
              trade name of {LEGAL_ENTITY_NAME}.
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Electronic component marketplace · {LEGAL_ENTITY_DBA_LINE}
            </p>
          </div>
          <nav className="flex flex-wrap gap-4">
            <Link href="/search" className="font-medium hover:text-slate-900">
              Search
            </Link>
            <Link href="/company/upload" className="font-medium hover:text-slate-900">
              List inventory
            </Link>
            <Link href="/blog" className="font-medium hover:text-slate-900">
              Blog & guides
            </Link>
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>
            <Link href="/help" className="hover:text-slate-900">
              Contact
            </Link>
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
          </nav>
        </div>
        <p className="mt-4">
          Questions?{" "}
          <Link href="/help#contact" className="font-medium text-blue-600 hover:text-blue-700">
            Contact support
          </Link>{" "}
          or email {SUPPORT_EMAIL}.
        </p>
      </div>
    </footer>
  );
}
