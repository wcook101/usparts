import { testimonials } from "@/lib/trust/testimonials";

function QuoteIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-8 w-8 text-blue-200"
      fill="currentColor"
    >
      <path d="M7.17 6A5.17 5.17 0 0 0 2 11.17V18h6v-6H5.17A3.17 3.17 0 0 1 8.34 8.83 5.17 5.17 0 0 0 7.17 6Zm10 0a5.17 5.17 0 0 0-5.17 5.17V18h6v-6h-2.83a3.17 3.17 0 0 1 3.17-3.17A5.17 5.17 0 0 0 17.17 6Z" />
    </svg>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative border-t border-slate-200 bg-white/80">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Buyer & supplier feedback
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900">
            What teams say about USParts
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Procurement and inventory teams use free BOM search to source obsolete
            parts and list surplus semiconductors on the marketplace.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6 shadow-sm"
            >
              <QuoteIcon />
              <blockquote className="mt-4 flex-1 text-sm leading-7 text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 border-t border-slate-200 pt-4">
                <p className="font-semibold text-slate-900">{item.name}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {item.role}, {item.organization}
                </p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
