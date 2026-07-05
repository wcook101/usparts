import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="/" className="flex min-w-0 shrink items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
            US
          </span>
          <div className="min-w-0">
            <p className="truncate text-lg font-bold tracking-tight text-slate-900">
              USParts
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              Electronic component search & marketplace
            </p>
          </div>
        </Link>

        <SiteNav />
      </div>
    </header>
  );
}
