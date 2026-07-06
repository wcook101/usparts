import Link from "next/link";

export default function PartNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Part not found
      </p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">No supplier stock for this MPN yet</h1>
      <p className="mt-4 text-base leading-7 text-slate-600">
        We could not find active US supplier listings for that exact part number. Try
        searching with a partial MPN, paste a BOM, or browse recent supplier uploads.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href="/search"
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Search parts
        </Link>
        <Link
          href="/search?mode=bulk"
          className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-semibold text-slate-800 hover:bg-slate-50"
        >
          Upload a BOM
        </Link>
      </div>
    </div>
  );
}
