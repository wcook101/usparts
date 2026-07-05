"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { HeaderAuthNav } from "@/components/HeaderAuthNav";

const navItems = [
  { href: "/search", label: "Search Parts" },
  { href: "/company/upload", label: "Upload inventory" },
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
      if (window.innerWidth >= 768) {
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
        className="hidden items-center gap-2 md:flex md:gap-3"
      >
        {navItems.map((item) => (
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

      <div className="md:hidden">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
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
              className="fixed inset-x-0 top-[4.5rem] z-50 max-h-[calc(100dvh-4.5rem)] overflow-y-auto border-b border-slate-200 bg-white shadow-lg"
            >
              <div className="mx-auto max-w-6xl px-4 py-4">
                <div className="flex flex-col gap-1">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="rounded-lg px-4 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-100"
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
