"use client";

import Link from "next/link";
import { useState } from "react";
import { UPLOAD_EMAIL, buildUploadMailto } from "@/lib/site";

type EmailInventoryUploadPanelProps = {
  companyName?: string | null;
  contactEmail?: string | null;
  contactName?: string | null;
  showOnlineImportLink?: boolean;
};

export function EmailInventoryUploadPanel({
  companyName = null,
  contactEmail = null,
  contactName = null,
  showOnlineImportLink = true,
}: EmailInventoryUploadPanelProps) {
  const [copied, setCopied] = useState(false);
  const mailto = buildUploadMailto({ companyName, contactEmail, contactName });

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(UPLOAD_EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-700">
        Easiest option
      </p>
      <h2 className="mt-2 text-xl font-semibold text-slate-900">
        Email your inventory spreadsheet
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-700">
        No time to use the online uploader? Attach your CSV or Excel file and
        send it to{" "}
        <span className="font-mono font-medium text-slate-900">{UPLOAD_EMAIL}</span>.
        Our team will import it to your supplier account and follow up by email.
      </p>

      <ol className="mt-5 list-decimal space-y-2 pl-5 text-sm leading-7 text-slate-700">
        <li>
          Create a spreadsheet with at least <strong>part number</strong> and{" "}
          <strong>quantity</strong> columns (manufacturer and price are helpful
          too).
        </li>
        <li>
          Attach the file to an email addressed to{" "}
          <strong>{UPLOAD_EMAIL}</strong>.
        </li>
        <li>
          Include your <strong>company name</strong> and{" "}
          <strong>contact email</strong> in the message so we can match it to
          the right account.
        </li>
        <li>We typically import within one business day and email you when it is live.</li>
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        <a
          href={mailto}
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Open email to send inventory
        </a>
        <button
          type="button"
          onClick={() => void copyEmail()}
          className="inline-flex rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
        >
          {copied ? "Copied!" : "Copy upload address"}
        </button>
        <a
          href="/templates/inventory-import-template.csv"
          download
          className="inline-flex rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          Download CSV template
        </a>
      </div>

      {showOnlineImportLink ? (
        <p className="mt-4 text-sm text-slate-600">
          Prefer to upload yourself?{" "}
          <Link href="/company/import" className="font-medium text-blue-600 hover:text-blue-700">
            Use the online bulk import tool
          </Link>
          .
        </p>
      ) : null}
    </div>
  );
}
