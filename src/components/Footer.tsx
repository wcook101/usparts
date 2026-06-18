import Link from "next/link";
import { SUPPORT_EMAIL, SUPPORT_MAILTO } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} USParts. Electronic component marketplace.</p>
          <nav className="flex flex-wrap gap-4">
            <a href={SUPPORT_MAILTO} className="hover:text-slate-900">
              Help
            </a>
            <Link href="/privacy" className="hover:text-slate-900">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-slate-900">
              Terms
            </Link>
          </nav>
        </div>
        <p>
          Questions? Email{" "}
          <a href={SUPPORT_MAILTO} className="font-medium text-blue-600 hover:text-blue-700">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
