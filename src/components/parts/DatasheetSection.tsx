"use client";

import Link from "next/link";
import { useState } from "react";
import { datasheetEmbedUrl, isLikelyPdfUrl } from "@/lib/datasheet";

type DatasheetSectionProps = {
  mpn: string;
  manufacturer: string | null;
  datasheetUrls: string[];
  quoteHref: string | null;
  supplierCount: number;
  variant?: "part" | "listing";
};

export function DatasheetSection({
  mpn,
  manufacturer,
  datasheetUrls,
  quoteHref,
  supplierCount,
  variant = "part",
}: DatasheetSectionProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const primaryUrl = datasheetUrls[activeIndex] ?? null;

  if (!primaryUrl) {
    return (
      <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Datasheet</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          We do not have a manufacturer datasheet linked for {mpn} yet. Stay on
          USParts to compare US supplier stock, pricing, and condition — then request a
          quote for specs, date code, and traceability from the listing supplier.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {quoteHref ? (
            <Link
              href={quoteHref}
              className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Request quote for datasheet details
            </Link>
          ) : null}
          <Link
            href={`/search?q=${encodeURIComponent(mpn)}`}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            View all supplier offers
          </Link>
        </div>
        <p className="mt-4 text-xs text-slate-500">
          Suppliers: add a datasheet URL when you upload or edit inventory so buyers can
          preview it here without leaving USParts.
        </p>
      </section>
    );
  }

  const embedUrl = datasheetEmbedUrl(primaryUrl);
  const pdf = isLikelyPdfUrl(primaryUrl);

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Datasheet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Preview {mpn}
            {manufacturer ? ` by ${manufacturer}` : ""} on USParts — no Google search
            required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setViewerOpen((open) => !open)}
            className="inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {viewerOpen ? "Hide preview" : "View datasheet"}
          </button>
          <a
            href={primaryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Open PDF in new tab
          </a>
        </div>
      </div>

      {datasheetUrls.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {datasheetUrls.map((url, index) => (
            <button
              key={url}
              type="button"
              onClick={() => {
                setActiveIndex(index);
                setViewerOpen(true);
              }}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                index === activeIndex
                  ? "bg-blue-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Source {index + 1}
            </button>
          ))}
        </div>
      ) : null}

      {viewerOpen ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
            {pdf
              ? "Official datasheet preview"
              : "Manufacturer document preview — some sites may block embedding"}
          </div>
          <iframe
            title={`${mpn} datasheet`}
            src={embedUrl}
            className="h-[min(70vh,720px)] w-full bg-white"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            Preview hosted at the manufacturer or supplier URL. If the frame is blank,
            use &ldquo;Open PDF in new tab&rdquo; above.
            {quoteHref ? (
              <>
                {" "}
                Need pricing?{" "}
                <Link href={quoteHref} className="font-semibold text-blue-600 hover:text-blue-700">
                  Request a quote on USParts
                </Link>
                .
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {variant === "listing" ? null : (
        <p className="mt-4 text-xs text-slate-500">
          {supplierCount} supplier{supplierCount === 1 ? "" : "s"} list this part on
          USParts. Compare offers below before you leave for outside sources.
        </p>
      )}
    </section>
  );
}
