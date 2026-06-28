import type { SupplierOutreachStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { normalizeEmail } from "@/lib/auth/ownership";

const ACTIVE_STATUSES: SupplierOutreachStatus[] = [
  "CONTACTED",
  "FOLLOW_UP",
  "REGISTERED",
  "INVENTORY_LIVE",
];

const CLOSED_STATUSES: SupplierOutreachStatus[] = ["DECLINED", "ARCHIVED"];

export type SupplierOutreachRecord = {
  id: string;
  companyName: string;
  contactName: string | null;
  contactEmail: string | null;
  website: string | null;
  status: SupplierOutreachStatus;
  contactedAt: string;
  lastFollowUpAt: string | null;
  notes: string | null;
  companyId: string | null;
  addedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  company: {
    id: string;
    name: string;
    email: string;
    lastImportAt: string | null;
    listingCount: number;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type SupplierOutreachSummary = {
  total: number;
  awaitingResponse: number;
  registered: number;
  inventoryLive: number;
  closed: number;
};

function normalizeOptionalEmail(email: string | null | undefined): string | null {
  if (!email?.trim()) {
    return null;
  }

  return normalizeEmail(email);
}

function serializeOutreach(
  record: Awaited<ReturnType<typeof fetchOutreachRecords>>[number],
): SupplierOutreachRecord {
  return {
    id: record.id,
    companyName: record.companyName,
    contactName: record.contactName,
    contactEmail: record.contactEmail,
    website: record.website,
    status: record.status,
    contactedAt: record.contactedAt.toISOString(),
    lastFollowUpAt: record.lastFollowUpAt?.toISOString() ?? null,
    notes: record.notes,
    companyId: record.companyId,
    addedBy: {
      id: record.addedBy.id,
      email: record.addedBy.email,
      name: record.addedBy.name,
    },
    company: record.company
      ? {
          id: record.company.id,
          name: record.company.name,
          email: record.company.email,
          lastImportAt: record.company.lastImportAt?.toISOString() ?? null,
          listingCount: record.company._count.listings,
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function fetchOutreachRecords() {
  return db.supplierOutreach.findMany({
    orderBy: [{ contactedAt: "desc" }, { createdAt: "desc" }],
    include: {
      addedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          lastImportAt: true,
          _count: {
            select: {
              listings: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });
}

function deriveStatusFromCompany(input: {
  status: SupplierOutreachStatus;
  company: {
    lastImportAt: Date | null;
    _count: { listings: number };
  } | null;
}): SupplierOutreachStatus | null {
  if (!input.company || CLOSED_STATUSES.includes(input.status)) {
    return null;
  }

  const hasInventory =
    input.company.lastImportAt !== null || input.company._count.listings > 0;

  if (hasInventory && input.status !== "INVENTORY_LIVE") {
    return "INVENTORY_LIVE";
  }

  if (!hasInventory && (input.status === "CONTACTED" || input.status === "FOLLOW_UP")) {
    return "REGISTERED";
  }

  return null;
}

async function syncOutreachRecords() {
  const records = await db.supplierOutreach.findMany({
    include: {
      company: {
        select: {
          id: true,
          email: true,
          lastImportAt: true,
          _count: {
            select: {
              listings: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });

  const companiesByEmail = new Map<
    string,
    {
      id: string;
      lastImportAt: Date | null;
      listingCount: number;
    }
  >();

  const emailsToLookup = records
    .filter((record) => record.contactEmail && !record.companyId)
    .map((record) => normalizeEmail(record.contactEmail!));

  if (emailsToLookup.length > 0) {
    const companies = await db.company.findMany({
      where: {
        email: {
          in: emailsToLookup,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
        email: true,
        lastImportAt: true,
        _count: {
          select: {
            listings: {
              where: { isActive: true },
            },
          },
        },
      },
    });

    for (const company of companies) {
      companiesByEmail.set(normalizeEmail(company.email), {
        id: company.id,
        lastImportAt: company.lastImportAt,
        listingCount: company._count.listings,
      });
    }
  }

  for (const record of records) {
    const updates: {
      companyId?: string;
      status?: SupplierOutreachStatus;
    } = {};

    if (!record.companyId && record.contactEmail) {
      const matchedCompany = companiesByEmail.get(normalizeEmail(record.contactEmail));
      if (matchedCompany) {
        updates.companyId = matchedCompany.id;
        record.company = {
          id: matchedCompany.id,
          email: record.contactEmail,
          lastImportAt: matchedCompany.lastImportAt,
          _count: { listings: matchedCompany.listingCount },
        };
      }
    }

    const nextStatus = deriveStatusFromCompany({
      status: record.status,
      company: record.company
        ? {
            lastImportAt: record.company.lastImportAt,
            _count: { listings: record.company._count.listings },
          }
        : null,
    });

    if (nextStatus) {
      updates.status = nextStatus;
    }

    if (Object.keys(updates).length > 0) {
      await db.supplierOutreach.update({
        where: { id: record.id },
        data: updates,
      });
    }
  }
}

function buildSummary(records: SupplierOutreachRecord[]): SupplierOutreachSummary {
  return {
    total: records.length,
    awaitingResponse: records.filter((record) =>
      ["CONTACTED", "FOLLOW_UP"].includes(record.status),
    ).length,
    registered: records.filter((record) => record.status === "REGISTERED").length,
    inventoryLive: records.filter((record) => record.status === "INVENTORY_LIVE").length,
    closed: records.filter((record) => CLOSED_STATUSES.includes(record.status)).length,
  };
}

export async function listSupplierOutreach(): Promise<{
  records: SupplierOutreachRecord[];
  summary: SupplierOutreachSummary;
}> {
  await syncOutreachRecords();
  const records = await fetchOutreachRecords();
  const serialized = records.map(serializeOutreach);

  return {
    records: serialized,
    summary: buildSummary(serialized),
  };
}

export async function createSupplierOutreach(input: {
  companyName: string;
  contactName?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  status?: SupplierOutreachStatus;
  contactedAt?: Date;
  notes?: string | null;
  addedById: string;
}) {
  const contactEmail = normalizeOptionalEmail(input.contactEmail);
  let companyId: string | null = null;

  if (contactEmail) {
    const company = await db.company.findFirst({
      where: { email: { equals: contactEmail, mode: "insensitive" } },
      select: { id: true },
    });
    companyId = company?.id ?? null;
  }

  const record = await db.supplierOutreach.create({
    data: {
      companyName: input.companyName.trim(),
      contactName: input.contactName?.trim() || null,
      contactEmail,
      website: input.website?.trim() || null,
      status: input.status ?? "CONTACTED",
      contactedAt: input.contactedAt ?? new Date(),
      notes: input.notes?.trim() || null,
      companyId,
      addedById: input.addedById,
    },
    include: {
      addedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          lastImportAt: true,
          _count: {
            select: {
              listings: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });

  const nextStatus = deriveStatusFromCompany({
    status: record.status,
    company: record.company,
  });

  if (nextStatus) {
    const updated = await db.supplierOutreach.update({
      where: { id: record.id },
      data: { status: nextStatus },
      include: {
        addedBy: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
            email: true,
            lastImportAt: true,
            _count: {
              select: {
                listings: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    return serializeOutreach(updated);
  }

  return serializeOutreach(record);
}

export async function updateSupplierOutreach(
  id: string,
  input: {
    companyName?: string;
    contactName?: string | null;
    contactEmail?: string | null;
    website?: string | null;
    status?: SupplierOutreachStatus;
    contactedAt?: Date;
    lastFollowUpAt?: Date | null;
    notes?: string | null;
    companyId?: string | null;
  },
) {
  const existing = await db.supplierOutreach.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Outreach record not found");
  }

  const contactEmail =
    input.contactEmail === undefined
      ? undefined
      : normalizeOptionalEmail(input.contactEmail);

  let companyId = input.companyId;
  if (contactEmail && companyId === undefined) {
    const company = await db.company.findFirst({
      where: { email: { equals: contactEmail, mode: "insensitive" } },
      select: { id: true },
    });
    companyId = company?.id ?? null;
  }

  const record = await db.supplierOutreach.update({
    where: { id },
    data: {
      ...(input.companyName !== undefined ? { companyName: input.companyName.trim() } : {}),
      ...(input.contactName !== undefined
        ? { contactName: input.contactName?.trim() || null }
        : {}),
      ...(contactEmail !== undefined ? { contactEmail } : {}),
      ...(input.website !== undefined ? { website: input.website?.trim() || null } : {}),
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.contactedAt !== undefined ? { contactedAt: input.contactedAt } : {}),
      ...(input.lastFollowUpAt !== undefined ? { lastFollowUpAt: input.lastFollowUpAt } : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      ...(companyId !== undefined ? { companyId } : {}),
    },
    include: {
      addedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      company: {
        select: {
          id: true,
          name: true,
          email: true,
          lastImportAt: true,
          _count: {
            select: {
              listings: {
                where: { isActive: true },
              },
            },
          },
        },
      },
    },
  });

  return serializeOutreach(record);
}

export async function deleteSupplierOutreach(id: string) {
  const existing = await db.supplierOutreach.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Outreach record not found");
  }

  await db.supplierOutreach.delete({ where: { id } });
}

export { ACTIVE_STATUSES, CLOSED_STATUSES };
