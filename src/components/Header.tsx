import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex min-w-0 shrink items-center gap-2">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            US
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-900">
              USParts
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              We prioritize parts located in the US
            </p>
          </div>
        </Link>

        <SiteNav />
      </div>
    </header>
  );
}
