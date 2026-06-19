import { db } from "@/lib/db";
import { getEmailProvider } from "@/lib/email";
import { formatInventoryLocation } from "@/lib/format";
import { getSmartSearchBudgetStatus } from "@/lib/smart-search-budget";
import { isSmartSearchEnabled } from "@/lib/smart-search";

export async function getAdminOverview() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    companyCount,
    userCount,
    activeListingCount,
    orderCount,
    quoteCount,
    recentCompanies,
    recentUsersWithoutCompany,
    companiesLast7Days,
    usersLast7Days,
    ordersLast7Days,
    quotesLast7Days,
    databaseHealthy,
    smartSearchBudget,
  ] = await Promise.all([
    db.company.count(),
    db.user.count(),
    db.partListing.count({ where: { isActive: true } }),
    db.order.count(),
    db.quoteRequest.count(),
    db.company.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: {
        owner: {
          select: {
            email: true,
            name: true,
            createdAt: true,
          },
        },
        inventoryLocations: {
          select: {
            label: true,
            city: true,
            state: true,
            country: true,
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            listings: true,
            members: true,
          },
        },
      },
    }),
    db.user.findMany({
      where: {
        company: null,
        memberships: { none: {} },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    }),
    db.company.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.order.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.quoteRequest.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    db.$queryRaw`SELECT 1`
      .then(() => true)
      .catch(() => false),
    isSmartSearchEnabled()
      ? getSmartSearchBudgetStatus().catch(() => null)
      : Promise.resolve(null),
  ]);

  return {
    health: {
      database: databaseHealthy,
      emailProvider: getEmailProvider(),
      appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "not set",
      smartSearchEnabled: isSmartSearchEnabled(),
      smartSearchBudget,
    },
    stats: {
      companies: companyCount,
      users: userCount,
      activeListings: activeListingCount,
      orders: orderCount,
      quotes: quoteCount,
      companiesLast7Days,
      usersLast7Days,
      ordersLast7Days,
      quotesLast7Days,
    },
    recentCompanies: recentCompanies.map((company) => ({
      id: company.id,
      name: company.name,
      email: company.email,
      website: company.website,
      createdAt: company.createdAt.toISOString(),
      ownerEmail: company.owner?.email ?? "—",
      ownerName: company.owner?.name ?? null,
      ownerSignedUpAt: company.owner?.createdAt.toISOString() ?? null,
      listingCount: company._count.listings,
      memberCount: company._count.members,
      locations: company.inventoryLocations.map((location) =>
        formatInventoryLocation(location),
      ),
      lastImportAt: company.lastImportAt?.toISOString() ?? null,
    })),
    recentUsersWithoutCompany: recentUsersWithoutCompany.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.toISOString(),
    })),
  };
}

export type AdminOverview = Awaited<ReturnType<typeof getAdminOverview>>;
