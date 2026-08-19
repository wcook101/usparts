import Link from "next/link";
import { notFound } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/admin";
import { getUploadReceiptsForAdmin } from "@/lib/admin-upload-receipts";
import { formatWhen } from "@/lib/datetime";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const metadata = pageMetadata.adminUploadReceipts;

export const dynamic = "force-dynamic";

function statusClass(status: "SENT" | "SKIPPED" | "FAILED"): string {
  if (status === "SENT") {
    return "bg-green-100 text-green-800";
  }
  if (status === "FAILED") {
    return "bg-red-100 text-red-800";
  }
  return "bg-slate-100 text-slate-700";
}

function statusLabel(status: "SENT" | "SKIPPED" | "FAILED"): string {
  if (status === "SENT") {
    return "Sent";
  }
  if (status === "FAILED") {
    return "Failed";
  }
  return "Skipped";
}

export default async function AdminUploadReceiptsPage() {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  if (!isPlatformAdmin(user.email)) {
    notFound();
  }

  const receipts = await getUploadReceiptsForAdmin();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <Link
          href="/admin"
          className="text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to admin
        </Link>
        <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
          Supplier onboarding
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Upload receipt
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
          Receipt emails sent after inventory imports go live. Each row is an
          upload receipt to the supplier company email and owner email.
        </p>
      </div>

      {receipts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-medium text-slate-900">No upload receipts yet</p>
          <p className="mt-2 text-sm text-slate-600">
            After you import inventory for a supplier, the upload receipt is logged
            here.
          </p>
          <Link
            href="/admin/import"
            className="mt-5 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Import inventory
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">When</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Sent to</th>
                <th className="px-4 py-3">Listings</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {receipts.map((receipt) => (
                <tr key={receipt.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                    {formatWhen(receipt.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">{receipt.companyName}</p>
                    <p className="text-slate-500">{receipt.companyEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{receipt.fileName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {receipt.recipients.length > 0
                      ? receipt.recipients.join(", ")
                      : "—"}
                    <p className="mt-1 text-xs text-slate-500">{receipt.message}</p>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {receipt.createdCount.toLocaleString()} new
                    <span className="text-slate-400"> · </span>
                    {receipt.updatedCount.toLocaleString()} updated
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusClass(receipt.status)}`}
                    >
                      {statusLabel(receipt.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
