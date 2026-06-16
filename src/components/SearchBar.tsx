import Link from "next/link";

type SearchBarProps = {
  defaultQuery?: string;
  action?: string;
  large?: boolean;
};

export function SearchBar({
  defaultQuery = "",
  action = "/search",
  large = false,
}: SearchBarProps) {
  return (
    <form action={action} method="get" className="w-full">
      <div
        className={`flex w-full overflow-hidden rounded-xl border border-white/70 bg-white/90 shadow-md shadow-blue-100/40 backdrop-blur-sm focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 ${
          large ? "text-base" : "text-sm"
        }`}
      >
        <input
          type="search"
          name="q"
          defaultValue={defaultQuery}
          placeholder="Search by part number, manufacturer, or description..."
          className={`min-w-0 flex-1 border-0 bg-transparent px-4 text-slate-900 outline-none placeholder:text-slate-400 ${
            large ? "py-4" : "py-3"
          }`}
        />
        <button
          type="submit"
          className={`bg-blue-600 font-medium text-white transition hover:bg-blue-700 ${
            large ? "px-6 py-4" : "px-5 py-3"
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
          href={`/search?q=${encodeURIComponent(term)}`}
          className="rounded-full border border-slate-200 bg-white px-3 py-1 text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
        >
          {term}
        </Link>
      ))}
    </div>
  );
}
