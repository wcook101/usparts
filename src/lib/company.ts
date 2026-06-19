import { db } from "@/lib/db";
import { getEmailDomain } from "@/lib/email-domain";
import { normalizeEmail } from "@/lib/auth/ownership";
import { ensureCompanyEmailDomain } from "@/lib/auth/membership";
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
    email?: string;
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
  if (input.email !== undefined) {
    const companyEmail = normalizeEmail(input.email);
    const emailTaken = await db.company.findFirst({
      where: {
        email: { equals: companyEmail, mode: "insensitive" },
        NOT: { id: companyId },
      },
    });

    if (emailTaken) {
      throw new Error("Another company already uses this business email");
    }

    data.email = companyEmail;
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

  const updated = await db.company.update({
    where: { id: companyId },
    data,
    include: {
      inventoryLocations: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (input.email !== undefined) {
    await ensureCompanyEmailDomain(updated.id, updated.email);
    return db.company.findUniqueOrThrow({
      where: { id: companyId },
      include: {
        inventoryLocations: {
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  return updated;
}
