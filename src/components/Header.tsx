import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="flex min-w-0 shrink items-center"
            aria-label="USParts home"
          >
            <Image
              src="/usparts-logo.png"
              alt="USParts.com — All roads lead to US parts"
              width={280}
              height={120}
              priority
              className="h-14 w-auto sm:h-[4.75rem]"
            />
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/search"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:min-h-11 sm:px-4"
            >
              <span className="sm:hidden">Search</span>
              <span className="hidden sm:inline">Search Parts</span>
            </Link>
            <Link
              href="/company/upload"
              className="inline-flex min-h-10 items-center justify-center rounded-lg border-2 border-slate-900 bg-white px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm transition hover:bg-slate-50 sm:min-h-11 sm:px-4"
            >
              <span className="sm:hidden">List</span>
              <span className="hidden sm:inline">List Inventory</span>
            </Link>
            <SiteNav />
          </div>
        </div>
      </div>
    </header>
  );
}
