import { testimonials } from "@/lib/trust/testimonials";

export function TestimonialsSection() {
  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold text-[#0a1628] sm:text-2xl">
            What buyers and suppliers say
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Procurement and inventory teams using USParts for MPN and BOM sourcing.
          </p>
        </div>

        <div className="mt-6 divide-y divide-slate-200 border border-slate-200">
          {testimonials.map((item) => (
            <figure key={item.name} className="px-4 py-5 sm:px-5">
              <blockquote className="text-sm leading-7 text-slate-700">
                &ldquo;{item.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-3 text-sm">
                <span className="font-semibold text-[#0a1628]">{item.name}</span>
                <span className="text-slate-500">
                  {" "}
                  · {item.role}, {item.organization}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
