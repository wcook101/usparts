import Link from "next/link";
import { redirect } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo/page-metadata";

export const dynamic = "force-dynamic";

export const metadata = pageMetadata.supplierNewListing;

export default async function NewListingPage() {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login?next=/company/listings/new");
  }

  if (!userCanManageInventory(user)) {
    redirect("/company/dashboard");
  }

  const sessionCompany = getSessionCompany(user);
  if (!sessionCompany) {
    redirect("/company");
  }

  const company = await db.company.findUnique({
    where: { id: sessionCompany.id },
    select: {
      id: true,
      name: true,
      inventoryLocations: {
        select: {
          id: true,
          label: true,
          city: true,
          state: true,
          country: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!company) {
    redirect("/company");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/company/dashboard"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to supplier dashboard
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Publish a part listing
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Adding inventory for <strong>{company.name}</strong>.
        </p>

        <div className="mt-8">
          <ListingForm companies={[company]} />
        </div>
      </div>
    </div>
  );
}
