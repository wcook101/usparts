import Link from "next/link";
import { notFound } from "next/navigation";
import { InventoryLocationText } from "@/components/InventoryLocationText";
import {
  CATEGORY_LABELS,
  CONDITION_LABELS,
  formatPrice,
  formatQuantity,
} from "@/lib/format";
import { canViewBuyerResource, getSessionUser } from "@/lib/auth";
import { getOrderById } from "@/lib/orders";

type OrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Order Confirmation",
};

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;

  const [order, user] = await Promise.all([getOrderById(id), getSessionUser()]);

  if (!order) {
    notFound();
  }

  if (
    !canViewBuyerResource(
      user,
      {
        userId: order.userId,
        buyerEmail: order.buyerEmail,
        accessToken: order.accessToken,
        listing: { companyId: order.listing.companyId },
      },
      token,
    )
  ) {
    notFound();
  }

  const listing = order.listing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Order placed
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Thank you, {order.buyerName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your order has been sent to {listing.company.name}. Confirmation was
          emailed to {order.buyerEmail}, and the supplier was notified.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <p className="text-sm text-slate-500">Order ID</p>
            <p className="font-mono text-sm font-medium text-slate-900">
              {order.id}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatPrice(order.totalPrice.toString(), order.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-700">Part</p>
            <p className="mt-1 font-mono text-sm text-blue-700">{listing.mpn}</p>
            <p className="text-sm text-slate-600">{listing.manufacturer}</p>
            <p className="mt-2 text-xs text-slate-500">
              {CATEGORY_LABELS[listing.category]} ·{" "}
              {CONDITION_LABELS[listing.condition]}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Quantity</p>
            <p className="mt-1 text-sm text-slate-900">
              {formatQuantity(order.quantity)} @{" "}
              {formatPrice(order.unitPrice.toString(), order.currency)}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Supplier</p>
            <p className="mt-1 text-sm text-slate-900">{listing.company.name}</p>
            <a
              href={`mailto:${listing.company.email}`}
              className="mt-1 inline-block text-sm text-blue-600 hover:text-blue-700"
            >
              {listing.company.email}
            </a>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Ships from</p>
            <p className="mt-1">
              <InventoryLocationText location={listing.inventoryLocation} />
            </p>
          </div>
        </div>

        {order.notes ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Your notes</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {order.notes}
            </p>
          </div>
        ) : null}
      </section>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link
          href={`/listings/${listing.id}`}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Back to listing
        </Link>
        <Link
          href="/search"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Continue searching
        </Link>
      </div>
    </div>
  );
}
