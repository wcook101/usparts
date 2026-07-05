import Link from "next/link";
import { redirect } from "next/navigation";
import { formatPrice } from "@/lib/format";
import { getSessionUser } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { getQuotesForUser } from "@/lib/quotes";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.orders;

export default async function MyOrdersPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/orders");
  }

  const [orders, quotes] = await Promise.all([
    getOrdersForUser(user.id, user.email),
    getQuotesForUser(user.id, user.email),
  ]);

  const company = user.membership?.company ?? user.company;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Activity
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Orders & quote requests
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Signed in as {user.email}
        {company ? ` (${company.name})` : ""}.
      </p>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Orders</h2>
        {orders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No orders yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/90">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part</th>
                  <th className="px-4 py-3">Supplier</th>
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
                    <td className="px-4 py-3 text-slate-700">
                      {order.listing.company.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.quantity}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {formatPrice(order.totalPrice.toString(), order.currency)}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{order.status}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="text-lg font-semibold text-slate-900">Quote requests</h2>
        {quotes.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No quote requests yet.</p>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white/90">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Part</th>
                  <th className="px-4 py-3">Supplier</th>
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
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {quote.listing.company.name}
                    </td>
                    <td className="px-4 py-3 text-slate-700">{quote.quantity}</td>
                    <td className="px-4 py-3 text-slate-700">{quote.status}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {quote.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {orders.length === 0 && quotes.length === 0 ? (
        <Link
          href="/search"
          className="mt-8 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Search parts
        </Link>
      ) : null}
    </div>
  );
}
