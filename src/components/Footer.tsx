import Link from "next/link";
import {
  LEGAL_ENTITY_DBA_LINE,
  LEGAL_ENTITY_NAME,
  SUPPORT_EMAIL,
  TRADE_NAME,
} from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <Link href="/about" className="hover:text-slate-900">
              About
            </Link>
            <Link href="/blog" className="hover:text-slate-900">
              Resources
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
        <p>
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
