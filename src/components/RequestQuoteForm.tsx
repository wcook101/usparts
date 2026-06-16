"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuyerContactFields,
  resolveBuyerPayload,
  useBuyerContact,
  type BuyerDefaults,
} from "@/components/BuyerContactFields";
import { formatQuantity } from "@/lib/format";

type RequestQuoteFormProps = {
  listingId: string;
  mpn: string;
  manufacturer: string;
  availableQuantity: number;
  buyerDefaults?: BuyerDefaults | null;
  variant?: "primary" | "secondary";
  submitLabel?: string;
};

export function RequestQuoteForm({
  listingId,
  mpn,
  manufacturer,
  availableQuantity,
  buyerDefaults = null,
  variant = "primary",
  submitLabel = "Request quote",
}: RequestQuoteFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(
    availableQuantity > 0 ? Math.min(availableQuantity, 1) : 1,
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasAccountProfile, contact, persistGuestContact } = useBuyerContact({
    buyerDefaults,
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const buyer = resolveBuyerPayload(formData, contact, hasAccountProfile);
    persistGuestContact(buyer);

    const payload = {
      listingId,
      ...buyer,
      quantity,
      notes: formData.get("notes"),
    };

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit quote request");
      }

      router.push(`/quotes/${data.id}?token=${encodeURIComponent(data.accessToken)}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit quote request",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const buttonClass =
    variant === "primary"
      ? "w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      : "w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-100";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
        <p className="font-medium text-slate-900">
          {mpn} · {manufacturer}
        </p>
        {availableQuantity > 0 ? (
          <p className="mt-1">
            {formatQuantity(availableQuantity)} listed as available
          </p>
        ) : (
          <p className="mt-1">Request pricing and availability</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BuyerContactFields buyerDefaults={buyerDefaults} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Quantity</span>
          <input
            name="quantity"
            type="number"
            min={1}
            required
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Message <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            name="notes"
            rows={3}
            placeholder="Target price, packaging, lead time, or alternate quantities"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className={buttonClass}>
        {isSubmitting ? "Sending request..." : submitLabel}
      </button>
    </form>
  );
}
