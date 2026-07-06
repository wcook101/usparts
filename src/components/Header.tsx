import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-slate-900 hover:text-blue-700"
        >
          USParts
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
    </header>
  );
}
