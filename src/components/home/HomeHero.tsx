"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { looksLikeMultiPartQuery } from "@/lib/mpn-normalize";
import type { PlatformStats } from "@/lib/marketplace-stats";
import { formatQuantity } from "@/lib/format";
import { getPartPagePath } from "@/lib/parts/part-path";

type SearchMode = "single" | "bulk" | "smart";

type HomeHeroProps = {
  stats: PlatformStats;
};

const modes: { id: SearchMode; label: string; href: string }[] = [
  { id: "single", label: "MPN search", href: "/search" },
  { id: "bulk", label: "BOM upload", href: "/search?mode=bulk" },
  { id: "smart", label: "Smart search", href: "/search?mode=smart" },
];

const placeholders: Record<SearchMode, string> = {
  single: "Search by manufacturer part number, keyword, or description…",
  bulk: "Paste part numbers or open BOM upload…",
  smart: "Describe the component you need in plain language…",
};

export function HomeHero({ stats }: HomeHeroProps) {
  const router = useRouter();
  const [mode, setMode] = useState<SearchMode>("single");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const input = form.elements.namedItem("q");
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const query = input.value.trim();
    if (!query) {
      event.preventDefault();
      router.push(modes.find((item) => item.id === mode)?.href ?? "/search");
      return;
    }

    if (mode === "bulk" || looksLikeMultiPartQuery(query)) {
      event.preventDefault();
      router.push(`/search?mode=bulk&mpns=${encodeURIComponent(query)}`);
      return;
    }

    if (mode === "smart") {
      event.preventDefault();
      router.push(`/search?mode=smart&describe=${encodeURIComponent(query)}`);
    }
  }

  return (
    <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white via-blue-50/40 to-slate-50">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(37,99,235,0.12),transparent_45%),radial-gradient(circle_at_bottom_left,rgba(15,23,42,0.04),transparent_40%)]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
            Free electronic component search
          </p>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
            Search electronic components from US suppliers
          </h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-600 sm:text-xl">
            Compare pricing, stock, and lead time on semiconductors, ICs, and
            hard-to-find parts. Paste a BOM, request quotes, or list surplus
            inventory — free on USParts.
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {modes.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setMode(item.id)}
                className={`min-h-11 touch-manipulation rounded-full px-4 py-2 text-sm font-semibold transition ${
                  mode === item.id
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 ring-1 ring-slate-200 hover:text-slate-900"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form
            action="/search"
            method="get"
            onSubmit={handleSubmit}
            className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/60"
          >
            <div className="flex flex-col sm:flex-row">
              <input
                type="search"
                name="q"
                placeholder={placeholders[mode]}
                className="min-h-14 flex-1 border-0 bg-transparent px-4 py-4 text-base text-slate-900 outline-none placeholder:text-slate-400 sm:px-5"
              />
              <button
                type="submit"
                className="min-h-14 touch-manipulation bg-blue-600 px-8 py-4 text-base font-semibold text-white transition hover:bg-blue-700 sm:shrink-0"
              >
                Search parts
              </button>
            </div>
          </form>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm text-slate-500">
            <span>Popular:</span>
            {["LM358", "STM32F407", "ESP32", "NE555"].map((term) => (
              <Link
                key={term}
                href={getPartPagePath(term)}
                className="rounded-full bg-white px-3 py-1 font-medium text-slate-700 ring-1 ring-slate-200 transition hover:text-blue-700 hover:ring-blue-200"
              >
                {term}
              </Link>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-3">
          {[
            {
              value: formatQuantity(stats.activeListings),
              label: "Parts searchable by MPN",
            },
            {
              value: formatQuantity(stats.activeSuppliers),
              label: "Registered US suppliers",
            },
            {
              value: "Free",
              label: "BOM search & inventory listing",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/80 bg-white/90 px-5 py-4 text-center shadow-sm backdrop-blur-sm"
            >
              <p className="text-2xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-1 text-sm text-slate-600">{item.label}</p>
            </div>
          ))}
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/search?mode=bulk"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-blue-700 sm:flex-none"
          >
            Upload a BOM — search free
          </Link>
          <Link
            href="/company/upload"
            className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3.5 text-base font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 sm:flex-none"
          >
            List your inventory
          </Link>
        </div>
      </div>
    </section>
  );
}
