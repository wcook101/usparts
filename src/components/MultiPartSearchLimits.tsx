import {
  BULK_RFQ_COOLDOWN_MINUTES,
  MAX_BULK_RFQ_LISTINGS,
  MAX_BULK_SEARCH_PARTS,
} from "@/lib/validations";

type MultiPartSearchLimitsProps = {
  compact?: boolean;
};

export function MultiPartSearchLimits({ compact = false }: MultiPartSearchLimitsProps) {
  const items = [
    {
      label: "Parts per search",
      value: `Up to ${MAX_BULK_SEARCH_PARTS.toLocaleString()}`,
    },
    {
      label: "Quote requests per batch",
      value: `Up to ${MAX_BULK_RFQ_LISTINGS.toLocaleString()} matching listings`,
    },
    {
      label: "Bulk RFQ frequency",
      value: `One batch every ${BULK_RFQ_COOLDOWN_MINUTES} minutes`,
    },
  ];

  if (compact) {
    return (
      <p className="text-xs leading-5 text-slate-500">
        Limits: {MAX_BULK_SEARCH_PARTS.toLocaleString()} parts per search ·{" "}
        {MAX_BULK_RFQ_LISTINGS.toLocaleString()} quotes per batch · new bulk RFQ
        every {BULK_RFQ_COOLDOWN_MINUTES} min
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Limits
      </h3>
      <dl className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-3 text-sm">
            <dt className="text-slate-600">{item.label}</dt>
            <dd className="text-right font-medium text-slate-900">{item.value}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-xs leading-5 text-slate-500">
        Search is free for everyone. Bulk RFQ limits apply separately to reduce
        spam.
      </p>
    </div>
  );
}
