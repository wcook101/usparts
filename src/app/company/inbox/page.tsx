import Link from "next/link";
import { redirect } from "next/navigation";
import { SupplierInboxPanel } from "@/components/SupplierInboxPanel";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import {
  getOrdersForCompany,
  getQuotesForCompany,
} from "@/lib/company-inbox";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Supplier Inbox",
};

export default async function CompanyInboxPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/inbox");
  }

  if (!userCanManageInventory(user)) {
    redirect("/company/dashboard");
  }

  const sessionCompany = getSessionCompany(user);
  if (!sessionCompany) {
    redirect("/company");
  }

  const [orders, quotes] = await Promise.all([
    getOrdersForCompany(sessionCompany.id),
    getQuotesForCompany(sessionCompany.id),
  ]);

  const serializedOrders = orders.map((order) => ({
    ...order,
    totalPrice: order.totalPrice,
    createdAt: order.createdAt.toISOString(),
  }));

  const serializedQuotes = quotes.map((quote) => ({
    ...quote,
    createdAt: quote.createdAt.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/company/dashboard"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to supplier dashboard
      </Link>

      <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
        Supplier inbox
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Orders & quote requests
      </h1>
      <p className="mt-3 text-sm text-slate-600">
        Incoming activity for <strong>{sessionCompany.name}</strong>. Update
        status as you confirm, fulfill, or cancel each request.
      </p>

      <div className="mt-8">
        <SupplierInboxPanel
          initialOrders={serializedOrders}
          initialQuotes={serializedQuotes}
        />
      </div>
    </div>
  );
}
