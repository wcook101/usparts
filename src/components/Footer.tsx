import Link from "next/link";
import { USPartsLogo } from "@/components/USPartsLogo";
import { SUPPORT_EMAIL } from "@/lib/site";

export function Footer() {
  return (
    <footer className="relative border-t border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-slate-600 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Link href="/" aria-label="USParts.us home">
              <USPartsLogo size="compact" />
            </Link>
            <p>© {new Date().getFullYear()} USParts.us. Electronic component marketplace.</p>
          </div>
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
