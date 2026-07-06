"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { HeaderAuthNav } from "@/components/HeaderAuthNav";

const navLinks = [
  { href: "/search?mode=bulk", label: "BOM Search" },
  { href: "/manufacturers", label: "Manufacturers" },
  { href: "/blog", label: "Blog & Guides" },
  { href: "/company", label: "For Suppliers" },
  { href: "/help", label: "Help" },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12" />
          <path d="M18 6 6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </>
      )}
    </svg>
  );
}

export function SiteNav() {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 1024) {
        setOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="hidden items-center gap-1 lg:flex"
      >
        {navLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          >
            {item.label}
          </Link>
        ))}
        <HeaderAuthNav layout="inline" />
      </nav>

      <div className="lg:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-h-10 min-w-10 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        >
          <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          <MenuIcon open={open} />
        </button>

        {open ? (
          <>
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 bg-slate-900/40"
              onClick={() => setOpen(false)}
            />
            <div
              id={panelId}
              className="fixed inset-x-0 top-[4.25rem] z-50 max-h-[calc(100dvh-4.25rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg"
            >
              <div className="mx-auto max-w-6xl px-4 py-4">
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className="rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Search Parts
                  </Link>
                  <Link
                    href="/company/upload"
                    onClick={() => setOpen(false)}
                    className="rounded-lg border-2 border-slate-900 px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-slate-50"
                  >
                    List Inventory
                  </Link>
                </div>

                <div className="mt-4 flex flex-col gap-1">
                  {navLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={
                        item.href === "/blog"
                          ? "rounded-lg bg-blue-50 px-4 py-3 text-base font-semibold text-blue-800 transition hover:bg-blue-100"
                          : "rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-100"
                      }
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <HeaderAuthNav layout="stacked" onNavigate={() => setOpen(false)} />
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
