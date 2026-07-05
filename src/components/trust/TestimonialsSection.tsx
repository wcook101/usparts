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

function StarRating() {
  return (
    <div className="flex gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }).map((_, index) => (
        <svg
          key={index}
          aria-hidden="true"
          viewBox="0 0 20 20"
          className="h-4 w-4 fill-amber-400"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292Z" />
        </svg>
      ))}
    </div>
  );
}

export function TestimonialsSection() {
  return (
    <section className="relative border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Buyer & supplier feedback
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 sm:text-3xl">
            Trusted by procurement and inventory teams
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-600 sm:text-base">
            Teams use USParts for free BOM search, obsolete semiconductor
            sourcing, and listing surplus electronic component inventory.
          </p>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="flex h-full flex-col rounded-2xl border border-slate-200 bg-slate-50/80 p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <QuoteIcon />
                <StarRating />
              </div>
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
