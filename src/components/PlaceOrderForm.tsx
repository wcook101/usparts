"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BuyerContactFields,
  resolveBuyerPayload,
  useBuyerContact,
  type BuyerDefaults,
} from "@/components/BuyerContactFields";
import {
  calculateLineTotal,
  formatPrice,
  formatQuantity,
} from "@/lib/format";

type PlaceOrderFormProps = {
  listingId: string;
  mpn: string;
  manufacturer: string;
  unitPrice: string;
  currency: string;
  availableQuantity: number;
  buyerDefaults?: BuyerDefaults | null;
};

export function PlaceOrderForm({
  listingId,
  mpn,
  manufacturer,
  unitPrice,
  currency,
  availableQuantity,
  buyerDefaults = null,
}: PlaceOrderFormProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { hasAccountProfile, contact, persistGuestContact } = useBuyerContact({
    buyerDefaults,
  });

  const lineTotal = useMemo(
    () => calculateLineTotal(unitPrice, quantity),
    [unitPrice, quantity],
  );

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
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to place order");
      }

      router.push(`/orders/${data.id}?token=${encodeURIComponent(data.accessToken)}`);
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to place order",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
        <p className="mt-1">
          {formatPrice(unitPrice, currency)} per unit ·{" "}
          {formatQuantity(availableQuantity)} available
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <BuyerContactFields buyerDefaults={buyerDefaults} />

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700">Quantity</span>
          <input
            name="quantity"
            type="number"
            min={1}
            max={availableQuantity}
            required
            value={quantity}
            onChange={(event) => setQuantity(Number(event.target.value))}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>

        <div className="flex items-end">
          <div className="w-full rounded-lg bg-slate-50 px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">
              Order total
            </p>
            <p className="mt-1 text-xl font-semibold text-slate-900">
              {formatPrice(lineTotal, currency)}
            </p>
          </div>
        </div>

        <label className="block space-y-2 sm:col-span-2">
          <span className="text-sm font-medium text-slate-700">
            Notes <span className="font-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            name="notes"
            rows={3}
            placeholder="PO number, shipping instructions, or packaging requests"
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || availableQuantity < 1}
        className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isSubmitting ? "Placing order..." : "Place order now"}
      </button>
    </form>
  );
}
