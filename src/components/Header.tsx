import Link from "next/link";
import { HeaderAuthNav } from "@/components/HeaderAuthNav";
import { USPartsLogo } from "@/components/USPartsLogo";

const navItems = [
  { href: "/search", label: "Search Parts" },
  { href: "/company", label: "For Suppliers" },
  { href: "/help", label: "Help" },
];

export function Header() {
  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <USPartsLogo size="header" priority />
        </Link>

        <nav className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 sm:px-3"
            >
              {item.label}
            </Link>
          ))}
          <HeaderAuthNav />
        </nav>
      </div>
    </header>
  );
}
