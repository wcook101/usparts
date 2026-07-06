"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  datasheetDownloadPath,
  datasheetResolvePath,
  datasheetViewPath,
  isLikelyPdfUrl,
} from "@/lib/datasheet";

type DatasheetSectionProps = {
  mpn: string;
  mpnNormalized: string;
  manufacturer: string | null;
  datasheetUrls: string[];
  quoteHref: string | null;
  supplierCount: number;
  isLoggedIn: boolean;
  variant?: "part" | "listing";
};

type ResolvePayload = {
  datasheetUrls?: string[];
  resolved?: boolean;
  matchNote?: string | null;
};

export function DatasheetSection({
  mpn,
  mpnNormalized,
  manufacturer,
  datasheetUrls: initialUrls,
  quoteHref,
  supplierCount,
  isLoggedIn,
  variant = "part",
}: DatasheetSectionProps) {
  const pathname = usePathname();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [datasheetUrls, setDatasheetUrls] = useState(initialUrls);
  const [isResolving, setIsResolving] = useState(
    initialUrls.length === 0 && Boolean(mpnNormalized),
  );
  const [resolveFailed, setResolveFailed] = useState(false);
  const [matchNote, setMatchNote] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  const loginNext = encodeURIComponent(pathname || "/");
  const signupHref = `/signup?next=${loginNext}`;
  const loginHref = `/login?next=${loginNext}`;

  const refreshDatasheets = useCallback(async () => {
    if (!mpnNormalized) {
      setIsResolving(false);
      return;
    }

    setIsResolving(true);
    setResolveFailed(false);
    setMatchNote(null);

    try {
      const response = await fetch(datasheetResolvePath(mpnNormalized, true));
      if (!response.ok) {
        setResolveFailed(true);
        return;
      }

      const data = (await response.json()) as ResolvePayload;
      if (data.datasheetUrls?.length) {
        setDatasheetUrls(data.datasheetUrls);
        setMatchNote(data.matchNote ?? null);
        setViewerOpen(true);
      } else {
        setResolveFailed(true);
      }
    } catch {
      setResolveFailed(true);
    } finally {
      setIsResolving(false);
    }
  }, [mpnNormalized]);

  useEffect(() => {
    setDatasheetUrls(initialUrls);
    setResolveFailed(false);
    setMatchNote(null);
    setActiveIndex(0);
    setViewerOpen(false);
  }, [initialUrls, mpnNormalized]);

  useEffect(() => {
    if (initialUrls.length > 0 || !mpnNormalized) {
      setIsResolving(false);
      return;
    }

    void refreshDatasheets();
  }, [initialUrls.length, mpnNormalized, refreshDatasheets]);

  const primaryUrl = datasheetUrls[activeIndex] ?? null;
  const hasDatasheet = Boolean(primaryUrl);
  const viewPath = hasDatasheet
    ? datasheetViewPath(mpnNormalized, activeIndex)
    : null;
  const downloadPath = hasDatasheet
    ? datasheetDownloadPath(mpnNormalized, activeIndex)
    : null;

  function handleDownloadClick() {
    if (!downloadPath) {
      return;
    }

    if (!isLoggedIn) {
      setShowLoginPrompt(true);
      return;
    }

    window.location.assign(downloadPath);
  }

  if (isResolving) {
    return (
      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Datasheet</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          Looking up the official datasheet for {mpn}
          {manufacturer ? ` by ${manufacturer}` : ""}…
        </p>
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-blue-500" />
        </div>
      </section>
    );
  }

  if (!hasDatasheet) {
    return (
      <section className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5 sm:p-6">
        <h3 className="text-base font-semibold text-slate-900">Datasheet</h3>
        <p className="mt-2 text-sm leading-7 text-slate-600">
          {resolveFailed
            ? `We could not find a public manufacturer datasheet for ${mpn} yet. Military and legacy NSC parts often need a supplier-provided URL or Nexar lookup. Stay on USParts to compare stock and request a quote for specs, date code, and traceability.`
            : `We do not have a manufacturer datasheet linked for ${mpn} yet. Stay on USParts to compare US supplier stock, pricing, and condition — then request a quote for specs, date code, and traceability from the listing supplier.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void refreshDatasheets()}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Try datasheet lookup again
          </button>
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

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Datasheet</h3>
          <p className="mt-1 text-sm text-slate-600">
            Preview {mpn}
            {manufacturer ? ` by ${manufacturer}` : ""} on USParts — stay on site while
            you review specs.
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
          <button
            type="button"
            onClick={handleDownloadClick}
            className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Download PDF
          </button>
        </div>
      </div>

      {datasheetUrls.length > 1 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {datasheetUrls.map((url, index) => (
            <button
              key={`${url}-${index}`}
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
              {isLikelyPdfUrl(url) ? "" : " (web)"}
            </button>
          ))}
        </div>
      ) : null}

      {viewerOpen && viewPath ? (
        <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
            Official datasheet preview on USParts
            {matchNote ? ` — ${matchNote}` : ""}
          </div>
          <iframe
            title={`${mpn} datasheet`}
            src={viewPath}
            className="h-[min(70vh,720px)] w-full bg-white"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          <div className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
            Preview is served through USParts so you can keep comparing supplier offers in
            the other tab.
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

      {showLoginPrompt ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
          <div
            role="dialog"
            aria-labelledby="datasheet-login-title"
            className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
          >
            <h4 id="datasheet-login-title" className="text-lg font-semibold text-slate-900">
              Create a free account to download
            </h4>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              View datasheets on USParts anytime. Sign in to download the PDF for {mpn} and
              track your quotes in one place.
            </p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <Link
                href={signupHref}
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Create free account
              </Link>
              <Link
                href={loginHref}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50"
              >
                Sign in
              </Link>
            </div>
            <button
              type="button"
              onClick={() => setShowLoginPrompt(false)}
              className="mt-4 w-full text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Continue previewing
            </button>
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
