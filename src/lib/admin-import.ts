import { db } from "@/lib/db";

export async function getCompaniesForAdminImport() {
  return db.company.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      lastImportAt: true,
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
}
