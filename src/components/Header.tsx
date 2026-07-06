import Image from "next/image";
import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-end gap-2 border-b border-slate-100 py-2.5 sm:gap-3 sm:py-3">
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

        <div className="flex justify-start py-3 sm:py-4">
          <Link href="/" className="inline-flex" aria-label="USParts home">
            <Image
              src="/usparts-logo.png"
              alt="USParts.com — All roads lead to US parts"
              width={560}
              height={240}
              priority
              className="h-28 w-auto sm:h-[9.5rem]"
            />
          </Link>
        </div>
      </div>
    </header>
  );
}
