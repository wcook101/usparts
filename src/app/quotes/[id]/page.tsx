import Link from "next/link";
import { notFound } from "next/navigation";
import { formatQuantity } from "@/lib/format";
import { canViewBuyerResource, getSessionUser } from "@/lib/auth";
import { getQuoteById } from "@/lib/quotes";

type QuotePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Quote Request Sent",
};

export default async function QuotePage({ params, searchParams }: QuotePageProps) {
  const { id } = await params;
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : null;

  const [quote, user] = await Promise.all([getQuoteById(id), getSessionUser()]);

  if (!quote) {
    notFound();
  }

  if (
    !canViewBuyerResource(
      user,
      {
        userId: quote.userId,
        buyerEmail: quote.buyerEmail,
        accessToken: quote.accessToken,
        listing: { companyId: quote.listing.companyId },
      },
      token,
    )
  ) {
    notFound();
  }

  const listing = quote.listing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-green-700">
          Quote request sent
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Thank you, {quote.buyerName}
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your request for {listing.mpn} was sent to {listing.company.name}.
          Confirmation was emailed to {quote.buyerEmail}, and the supplier was
          notified.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="border-b border-slate-100 pb-6">
          <p className="text-sm text-slate-500">Request ID</p>
          <p className="font-mono text-sm font-medium text-slate-900">
            {quote.id}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-slate-700">Part</p>
            <p className="mt-1 font-mono text-sm text-blue-700">{listing.mpn}</p>
            <p className="text-sm text-slate-600">{listing.manufacturer}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Quantity</p>
            <p className="mt-1 text-sm text-slate-900">
              {formatQuantity(quote.quantity)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-700">Supplier</p>
            <p className="mt-1 text-sm text-slate-900">{listing.company.name}</p>
          </div>
        </div>

        {quote.notes ? (
          <div className="mt-6 rounded-lg bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Your message</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
              {quote.notes}
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
          href="/orders"
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          View my activity
        </Link>
      </div>
    </div>
  );
}
