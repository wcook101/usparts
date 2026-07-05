import Link from "next/link";
import { redirect } from "next/navigation";
import { CompanyListingsPanel } from "@/components/CompanyListingsPanel";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import { getListingsForCompany } from "@/lib/listings";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.supplierListings;

export default async function CompanyListingsPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/listings");
  }

  if (!userCanManageInventory(user)) {
    redirect("/company/dashboard");
  }

  const sessionCompany = getSessionCompany(user);
  if (!sessionCompany) {
    redirect("/company");
  }

  const listings = await getListingsForCompany(sessionCompany.id, {
    includeInactive: true,
  });

  const serializedListings = listings.map((listing) => ({
    id: listing.id,
    mpn: listing.mpn,
    manufacturer: listing.manufacturer,
    category: listing.category,
    quantity: listing.quantity,
    price: listing.price,
    currency: listing.currency,
    isActive: listing.isActive,
    updatedAt: listing.updatedAt.toISOString(),
    inventoryLocation: listing.inventoryLocation,
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/company/dashboard"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Back to supplier dashboard
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Inventory
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            Manage listings
          </h1>
          <p className="mt-3 text-sm text-slate-600">
            Edit or deactivate parts for <strong>{sessionCompany.name}</strong>{" "}
            without re-importing your full catalog.
          </p>
        </div>
        <Link
          href="/company/listings/new"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Add part
        </Link>
      </div>

      <div className="mt-8">
        <CompanyListingsPanel initialListings={serializedListings} />
      </div>
    </div>
  );
}
