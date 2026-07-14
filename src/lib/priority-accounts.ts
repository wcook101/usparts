import type { PriorityAccountStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { TOP_ACCOUNT_SEEDS } from "@/lib/top-accounts";

export type PriorityAccountRecord = {
  id: string;
  rank: number;
  companyName: string;
  website: string | null;
  decisionMakerName: string | null;
  decisionMakerTitle: string | null;
  decisionMakerEmail: string | null;
  phone: string | null;
  linkedInUrl: string | null;
  researchNotes: string | null;
  status: PriorityAccountStatus;
  lastResearchedAt: string | null;
  updatedBy: {
    id: string;
    email: string;
    name: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type PriorityAccountSummary = {
  total: number;
  needsResearch: number;
  researching: number;
  emailFound: number;
  readyOrContacted: number;
};

function serialize(
  record: Awaited<ReturnType<typeof fetchAccounts>>[number],
): PriorityAccountRecord {
  return {
    id: record.id,
    rank: record.rank,
    companyName: record.companyName,
    website: record.website,
    decisionMakerName: record.decisionMakerName,
    decisionMakerTitle: record.decisionMakerTitle,
    decisionMakerEmail: record.decisionMakerEmail,
    phone: record.phone,
    linkedInUrl: record.linkedInUrl,
    researchNotes: record.researchNotes,
    status: record.status,
    lastResearchedAt: record.lastResearchedAt?.toISOString() ?? null,
    updatedBy: record.updatedBy
      ? {
          id: record.updatedBy.id,
          email: record.updatedBy.email,
          name: record.updatedBy.name,
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function fetchAccounts() {
  return db.priorityAccount.findMany({
    orderBy: { rank: "asc" },
    include: {
      updatedBy: {
        select: { id: true, email: true, name: true },
      },
    },
  });
}

async function ensureTopAccountsSeeded() {
  const count = await db.priorityAccount.count();
  if (count > 0) {
    return;
  }

  await db.priorityAccount.createMany({
    data: TOP_ACCOUNT_SEEDS.map((seed) => ({
      rank: seed.rank,
      companyName: seed.companyName,
      website: seed.website ?? null,
      status: "NEEDS_RESEARCH",
    })),
  });
}

function buildSummary(records: PriorityAccountRecord[]): PriorityAccountSummary {
  return {
    total: records.length,
    needsResearch: records.filter((r) => r.status === "NEEDS_RESEARCH").length,
    researching: records.filter((r) => r.status === "RESEARCHING").length,
    emailFound: records.filter(
      (r) => r.status === "EMAIL_FOUND" || Boolean(r.decisionMakerEmail),
    ).length,
    readyOrContacted: records.filter(
      (r) =>
        r.status === "READY_TO_CONTACT" ||
        r.status === "CONTACTED" ||
        r.status === "WON",
    ).length,
  };
}

export async function listPriorityAccounts() {
  await ensureTopAccountsSeeded();
  const records = (await fetchAccounts()).map(serialize);
  return {
    records,
    summary: buildSummary(records),
  };
}

export async function updatePriorityAccount(
  id: string,
  input: {
    website?: string | null;
    decisionMakerName?: string | null;
    decisionMakerTitle?: string | null;
    decisionMakerEmail?: string | null;
    phone?: string | null;
    linkedInUrl?: string | null;
    researchNotes?: string | null;
    status?: PriorityAccountStatus;
    updatedById: string;
  },
) {
  const existing = await db.priorityAccount.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Priority account not found");
  }

  let status = input.status ?? existing.status;
  const nextEmail =
    input.decisionMakerEmail !== undefined
      ? input.decisionMakerEmail?.trim().toLowerCase() || null
      : existing.decisionMakerEmail;

  // Auto-advance when an email is first captured.
  if (
    nextEmail &&
    !existing.decisionMakerEmail &&
    (status === "NEEDS_RESEARCH" || status === "RESEARCHING")
  ) {
    status = "EMAIL_FOUND";
  }

  const updated = await db.priorityAccount.update({
    where: { id },
    data: {
      ...(input.website !== undefined
        ? { website: input.website?.trim() || null }
        : {}),
      ...(input.decisionMakerName !== undefined
        ? { decisionMakerName: input.decisionMakerName?.trim() || null }
        : {}),
      ...(input.decisionMakerTitle !== undefined
        ? { decisionMakerTitle: input.decisionMakerTitle?.trim() || null }
        : {}),
      ...(input.decisionMakerEmail !== undefined
        ? { decisionMakerEmail: nextEmail }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.linkedInUrl !== undefined
        ? { linkedInUrl: input.linkedInUrl?.trim() || null }
        : {}),
      ...(input.researchNotes !== undefined
        ? { researchNotes: input.researchNotes?.trim() || null }
        : {}),
      status,
      lastResearchedAt: new Date(),
      updatedById: input.updatedById,
    },
    include: {
      updatedBy: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return serialize(updated);
}
