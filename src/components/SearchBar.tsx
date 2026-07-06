"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { looksLikeMultiPartQuery } from "@/lib/mpn-normalize";
import { getPartPagePath } from "@/lib/parts/part-path";

type SearchBarProps = {
  defaultQuery?: string;
  action?: string;
  large?: boolean;
  disabled?: boolean;
};

export function SearchBar({
  defaultQuery = "",
  action = "/search",
  large = false,
  disabled = false,
}: SearchBarProps) {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const input = form.elements.namedItem("q");
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const query = input.value.trim();
    if (query && looksLikeMultiPartQuery(query)) {
      event.preventDefault();
      router.push(`/search?mode=bulk&mpns=${encodeURIComponent(query)}`);
    }
  }

  return (
    <form action={action} method="get" className="w-full" onSubmit={handleSubmit}>
      <div
        className={`flex w-full overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-md shadow-blue-100/40 backdrop-blur-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
          large ? "text-base" : "text-sm"
        }`}
      >
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          disabled={disabled}
          placeholder="Search by part number, manufacturer, or description..."
          className={`min-w-0 flex-1 border-0 bg-transparent px-3 text-base text-slate-900 outline-none placeholder:text-slate-400 disabled:cursor-not-allowed disabled:text-slate-400 sm:px-4 ${
            large ? "py-3.5 sm:py-4" : "py-3"
          }`}
        />
        <button
          type="submit"
          disabled={disabled}
          className={`min-h-11 shrink-0 touch-manipulation bg-blue-600 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 ${
            large ? "px-5 py-3.5 sm:px-6 sm:py-4" : "px-4 py-3 sm:px-5"
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}

export function QuickSearchLinks() {
  const examples = ["STM32F407", "LM358", "1N4148", "ESP32", "NE555"];

  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
      <span>Try:</span>
      {examples.map((term) => (
        <Link
          key={term}
          href={getPartPagePath(term)}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          {term}
        </Link>
      ))}
      <Link
        href="/search?mode=bulk"
        className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-medium text-blue-700 transition hover:border-blue-300"
      >
        Paste a part list
      </Link>
    </div>
  );
}
