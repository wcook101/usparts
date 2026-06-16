import { db } from "@/lib/db";
import type { UpdateCompanyInput } from "@/lib/validations";

export async function getCompanyById(companyId: string) {
  return db.company.findUnique({
    where: { id: companyId },
    include: {
      inventoryLocations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export async function updateCompanyProfile(
  companyId: string,
  input: UpdateCompanyInput,
) {
  const data: {
    name?: string;
    description?: string | null;
    website?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string;
  } = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }
  if (input.description !== undefined) {
    data.description = input.description || null;
  }
  if (input.website !== undefined) {
    data.website = input.website || null;
  }
  if (input.phone !== undefined) {
    data.phone = input.phone || null;
  }
  if (input.city !== undefined) {
    data.city = input.city || null;
  }
  if (input.state !== undefined) {
    data.state = input.state || null;
  }
  if (input.country !== undefined) {
    data.country = input.country;
  }

  return db.company.update({
    where: { id: companyId },
    data,
    include: {
      inventoryLocations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}
