"use client";

import { useState } from "react";
import {
  datasheetResolvePath,
  datasheetViewPath,
  normalizeDatasheetUrl,
} from "@/lib/datasheet";

type DatasheetLookupButtonProps = {
  mpn: string;
  mpnNormalized: string;
  manufacturer?: string | null;
  cachedUrl?: string | null;
  className?: string;
};

type LookupState = "idle" | "loading" | "ready" | "unavailable";

export function DatasheetLookupButton({
  mpn,
  mpnNormalized,
  cachedUrl,
  className = "",
}: DatasheetLookupButtonProps) {
  const hasCachedUrl = Boolean(normalizeDatasheetUrl(cachedUrl));
  const [state, setState] = useState<LookupState>(hasCachedUrl ? "ready" : "idle");

  async function openDatasheet() {
    window.open(
      datasheetViewPath(mpnNormalized),
      "_blank",
      "noopener,noreferrer",
    );
  }

  async function handleClick() {
    if (state === "loading") {
      return;
    }

    if (state === "ready") {
      await openDatasheet();
      return;
    }

    if (!mpnNormalized) {
      setState("unavailable");
      return;
    }

    setState("loading");

    try {
      const response = await fetch(datasheetResolvePath(mpnNormalized, true));
      if (!response.ok) {
        setState("unavailable");
        return;
      }

      const data = (await response.json()) as { datasheetUrls?: string[] };
      if (data.datasheetUrls?.length) {
        setState("ready");
        await openDatasheet();
        return;
      }

      setState("unavailable");
    } catch {
      setState("unavailable");
    }
  }

  if (state === "unavailable") {
    return (
      <span className={`text-xs text-slate-400 ${className}`} title={`No datasheet found for ${mpn}`}>
        —
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => void handleClick()}
      disabled={state === "loading"}
      className={`inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 hover:text-blue-800 disabled:cursor-wait disabled:opacity-70 ${className}`}
      title={state === "ready" ? `View datasheet for ${mpn}` : `Look up datasheet for ${mpn}`}
    >
      {state === "loading" ? (
        <>
          <span
            className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-700"
            aria-hidden
          />
          <span className="sr-only">Looking up datasheet</span>
        </>
      ) : (
        <>
          <span aria-hidden>📄</span>
          <span>View PDF</span>
        </>
      )}
    </button>
  );
}
