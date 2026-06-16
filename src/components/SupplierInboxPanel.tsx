"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { OrderStatus } from "@/generated/prisma/client";
import { formatPrice, ORDER_STATUS_LABELS } from "@/lib/format";

type InboxOrder = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  totalPrice: { toString(): string };
  currency: string;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  listing: {
    mpn: string;
    manufacturer: string;
  };
};

type InboxQuote = {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerCompany: string | null;
  quantity: number;
  status: OrderStatus;
  notes: string | null;
  createdAt: string;
  listing: {
    mpn: string;
    manufacturer: string;
  };
};

type SupplierInboxPanelProps = {
  initialOrders: InboxOrder[];
  initialQuotes: InboxQuote[];
};

const NEXT_STATUS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED", "FULFILLED"],
  CONFIRMED: ["FULFILLED", "CANCELLED"],
  FULFILLED: [],
  CANCELLED: [],
};

function StatusSelect({
  value,
  onChange,
  disabled,
}: {
  value: OrderStatus;
  onChange: (status: OrderStatus) => void;
  disabled?: boolean;
}) {
  const options = [value, ...NEXT_STATUS[value]];

  return (
    <select
      value={value}
      disabled={disabled || NEXT_STATUS[value].length === 0}
      onChange={(event) => onChange(event.target.value as OrderStatus)}
      className="rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
    >
      {options.map((status) => (
        <option key={status} value={status}>
          {ORDER_STATUS_LABELS[status]}
        </option>
      ))}
    </select>
  );
}

export function SupplierInboxPanel({
  initialOrders,
  initialQuotes,
}: SupplierInboxPanelProps) {
  const router = useRouter();
  const [orders, setOrders] = useState(initialOrders);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updateOrderStatus(orderId: string, status: OrderStatus) {
    setUpdatingId(orderId);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update order");
      }

      setOrders((current) =>
        current.map((order) =>
          order.id === orderId ? { ...order, status: data.status } : order,
        ),
      );
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update order",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateQuoteStatus(quoteId: string, status: OrderStatus) {
    setUpdatingId(quoteId);
    setError(null);

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to update quote");
      }

      setQuotes((current) =>
        current.map((quote) =>
          quote.id === quoteId ? { ...quote, status: data.status } : quote,
        ),
      );
      router.refresh();
    } catch (updateError) {
      setError(
        updateError instanceof Error
          ? updateError.message
          : "Failed to update quote",
      );
    } finally {
      setUpdatingId(null);
    }
  }

  return (
    <div className="space-y-10">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {order.listing.mpn}
                      </Link>
                      <p className="text-slate-500">{order.listing.manufacturer}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{order.buyerName}</p>
                      <p className="text-slate-500">{order.buyerEmail}</p>
                      {order.buyerCompany ? (
                        <p className="text-slate-500">{order.buyerCompany}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatPrice(order.totalPrice.toString(), order.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={(status) =>
                          void updateOrderStatus(order.id, status)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold text-slate-900">Quote requests</h2>
        {quotes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No quote requests yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white/90">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part</th>
                  <th className="px-4 py-3">Buyer</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotes.map((quote) => (
                  <tr key={quote.id}>
                    <td className="px-4 py-3">
                      <Link
                        href={`/quotes/${quote.id}`}
                        className="font-medium text-blue-600 hover:text-blue-700"
                      >
                        {quote.listing.mpn}
                      </Link>
                      <p className="text-slate-500">{quote.listing.manufacturer}</p>
                      {quote.notes ? (
                        <p className="mt-1 text-xs text-slate-500">{quote.notes}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-slate-900">{quote.buyerName}</p>
                      <p className="text-slate-500">{quote.buyerEmail}</p>
                      {quote.buyerCompany ? (
                        <p className="text-slate-500">{quote.buyerCompany}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{quote.quantity}</td>
                    <td className="px-4 py-3">
                      <StatusSelect
                        value={quote.status}
                        disabled={updatingId === quote.id}
                        onChange={(status) =>
                          void updateQuoteStatus(quote.id, status)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(quote.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
