import Link from "next/link";
import { SUPPORT_EMAIL } from "@/lib/site";
export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} USParts. Electronic component marketplace.</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/help" className="hover:text-slate-900">
              Help
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
        </p>      </div>
    </footer>
  );
}
