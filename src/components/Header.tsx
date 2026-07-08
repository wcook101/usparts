import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-[#0a1628] hover:text-[#c41230]"
        >
          USParts
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            className="inline-flex min-h-10 items-center justify-center rounded bg-[#c41230] px-3 py-2 text-sm font-semibold text-white transition hover:bg-[#a50e28] sm:min-h-11 sm:px-4"
          >
            <span className="sm:hidden">Search</span>
            <span className="hidden sm:inline">Search Parts</span>
          </Link>
          <Link
            href="/company/upload"
            className="inline-flex min-h-10 items-center justify-center rounded border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-[#0a1628] transition hover:border-slate-400 hover:bg-slate-50 sm:min-h-11 sm:px-4"
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
