import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { ListingForm } from "@/components/ListingForm";
import { getSessionUser, userCanManageInventory } from "@/lib/auth";
import { getSessionCompany } from "@/lib/auth/resource-access";
import { db } from "@/lib/db";
import { getListingById } from "@/lib/listings";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const listing = await getListingById(id);
  return {
    title: listing ? `Edit ${listing.mpn}` : "Edit Listing",
  };
}

export default async function EditListingPage({ params }: PageProps) {
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

  const { id } = await params;

  const [listing, company] = await Promise.all([
    getListingById(id),
    db.company.findUnique({
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
    }),
  ]);

  if (!listing || listing.companyId !== sessionCompany.id || !company) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <Link
        href="/company/listings"
        className="text-sm font-medium text-blue-600 hover:text-blue-700"
      >
        Back to listings
      </Link>

      <div className="mt-6 rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-sm backdrop-blur-sm">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Edit listing
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Updating <strong>{listing.mpn}</strong> for {company.name}.
        </p>

        <div className="mt-8">
          <ListingForm
            companies={[company]}
            listing={{
              id: listing.id,
              inventoryLocationId: listing.inventoryLocationId,
              mpn: listing.mpn,
              manufacturer: listing.manufacturer,
              description: listing.description,
              category: listing.category,
              quantity: listing.quantity,
              price: listing.price?.toString() ?? "",
              currency: listing.currency,
              condition: listing.condition,
              dateCode: listing.dateCode,
              leadTimeDays: listing.leadTimeDays,
              datasheetUrl: listing.datasheetUrl,
            }}
          />
        </div>
      </div>
    </div>
  );
}
