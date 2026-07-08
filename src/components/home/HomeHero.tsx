"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { looksLikeMultiPartQuery } from "@/lib/mpn-normalize";
import { getPartPagePath } from "@/lib/parts/part-path";

type HomeHeroProps = {
  popularParts?: string[];
};

export function HomeHero({ popularParts = [] }: HomeHeroProps) {
  const router = useRouter();
  const popularTerms =
    popularParts.length > 0
      ? popularParts.slice(0, 4)
      : ["LM358", "STM32F407", "ESP32", "NE555"];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const input = form.elements.namedItem("q");
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const query = input.value.trim();
    if (!query) {
      event.preventDefault();
      router.push("/search");
      return;
    }

    if (looksLikeMultiPartQuery(query)) {
      event.preventDefault();
      router.push(`/search?mode=bulk&mpns=${encodeURIComponent(query)}`);
    }
  }

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-20 lg:py-24">
        <h1 className="text-4xl font-bold tracking-tight text-[#0a1628] sm:text-5xl">
          USParts
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Free electronic component search from verified US Based Inventory.
        </p>

        <form
          action="/search"
          method="get"
          onSubmit={handleSubmit}
          className="mt-10"
        >
          <label htmlFor="home-search" className="sr-only">
            Search part number, manufacturer, or paste BOM
          </label>
          <div className="flex flex-col overflow-hidden rounded border border-slate-300 bg-white shadow-sm focus-within:border-[#0a1628] focus-within:ring-1 focus-within:ring-[#0a1628] sm:flex-row">
            <input
              id="home-search"
              type="search"
              name="q"
              placeholder="Search part number, manufacturer, or paste BOM"
              className="min-h-14 flex-1 border-0 bg-transparent px-4 py-4 text-base text-[#0a1628] outline-none placeholder:text-slate-400 sm:px-5"
              autoComplete="off"
            />
            <button
              type="submit"
              className="min-h-14 touch-manipulation bg-[#c41230] px-8 py-4 text-base font-semibold text-white transition hover:bg-[#a50e28] sm:shrink-0"
            >
              Search Parts
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Link
            href="/search?mode=bulk"
            className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:border-slate-400 hover:bg-slate-50"
          >
            Upload BOM
          </Link>
          <Link
            href="/company/upload"
            className="inline-flex min-h-11 items-center justify-center rounded border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-[#0a1628] transition hover:border-slate-400 hover:bg-slate-50"
          >
            List Inventory
          </Link>
        </div>

        <p className="mt-8 text-sm font-medium text-[#0a1628]">
          Search Millions of unique parts.
        </p>

        <p className="mt-6 max-w-2xl mx-auto text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
          Find electronic components from U.S. suppliers. Search listed parts,
          upload a BOM, request quotes, and list surplus inventory for free.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-slate-500">
          <span>Popular:</span>
          {popularTerms.map((term) => (
            <Link
              key={term}
              href={
                popularParts.length > 0
                  ? getPartPagePath(term)
                  : `/search?q=${encodeURIComponent(term)}`
              }
              className="font-mono text-[#0a1628] underline-offset-2 hover:text-[#c41230] hover:underline"
            >
              {term}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
