import type { CustomerCrmStatus } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth/ownership";

const CLOSED_STATUSES: CustomerCrmStatus[] = ["LOST", "ARCHIVED"];
const PIPELINE_STATUSES: CustomerCrmStatus[] = [
  "LEAD",
  "CONTACTED",
  "NURTURING",
];

export type CustomerLeadRecord = {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  phone: string | null;
  source: string | null;
  status: CustomerCrmStatus;
  contactedAt: string;
  lastFollowUpAt: string | null;
  lastEmailedAt: string | null;
  emailCount: number;
  notes: string | null;
  userId: string | null;
  addedBy: {
    id: string;
    email: string;
    name: string | null;
  };
  user: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

export type CustomerCrmSummary = {
  total: number;
  pipeline: number;
  signedUp: number;
  active: number;
  closed: number;
};

function serializeLead(
  record: Awaited<ReturnType<typeof fetchLeads>>[number],
): CustomerLeadRecord {
  return {
    id: record.id,
    name: record.name,
    email: record.email,
    companyName: record.companyName,
    phone: record.phone,
    source: record.source,
    status: record.status,
    contactedAt: record.contactedAt.toISOString(),
    lastFollowUpAt: record.lastFollowUpAt?.toISOString() ?? null,
    lastEmailedAt: record.lastEmailedAt?.toISOString() ?? null,
    emailCount: record.emailCount,
    notes: record.notes,
    userId: record.userId,
    addedBy: {
      id: record.addedBy.id,
      email: record.addedBy.email,
      name: record.addedBy.name,
    },
    user: record.user
      ? {
          id: record.user.id,
          email: record.user.email,
          name: record.user.name,
          createdAt: record.user.createdAt.toISOString(),
        }
      : null,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

async function fetchLeads() {
  return db.customerLead.findMany({
    orderBy: [{ contactedAt: "desc" }, { createdAt: "desc" }],
    include: {
      addedBy: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      },
    },
  });
}

async function syncLeadsWithUsers() {
  const openLeads = await db.customerLead.findMany({
    where: {
      userId: null,
      status: { notIn: CLOSED_STATUSES },
    },
    select: {
      id: true,
      email: true,
      status: true,
    },
  });

  for (const lead of openLeads) {
    const user = await db.user.findUnique({
      where: { email: normalizeEmail(lead.email) },
      select: { id: true },
    });

    if (!user) {
      continue;
    }

    const alreadyLinked = await db.customerLead.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (alreadyLinked) {
      continue;
    }

    const nextStatus: CustomerCrmStatus =
      lead.status === "LEAD" ||
      lead.status === "CONTACTED" ||
      lead.status === "NURTURING"
        ? "SIGNED_UP"
        : lead.status;

    await db.customerLead.update({
      where: { id: lead.id },
      data: {
        userId: user.id,
        status: nextStatus,
      },
    });
  }
}

function buildSummary(records: CustomerLeadRecord[]): CustomerCrmSummary {
  return {
    total: records.length,
    pipeline: records.filter((record) =>
      PIPELINE_STATUSES.includes(record.status),
    ).length,
    signedUp: records.filter((record) => record.status === "SIGNED_UP").length,
    active: records.filter((record) => record.status === "ACTIVE").length,
    closed: records.filter((record) =>
      CLOSED_STATUSES.includes(record.status),
    ).length,
  };
}

export async function listCustomerLeads() {
  await syncLeadsWithUsers();
  const records = (await fetchLeads()).map(serializeLead);
  return {
    records,
    summary: buildSummary(records),
  };
}

export async function createCustomerLead(input: {
  name?: string | null;
  email: string;
  companyName?: string | null;
  phone?: string | null;
  source?: string | null;
  status?: CustomerCrmStatus;
  contactedAt?: Date;
  notes?: string | null;
  addedById: string;
}) {
  const email = normalizeEmail(input.email);
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  });

  let status = input.status ?? "LEAD";
  let userId: string | null = null;

  if (existingUser) {
    const linked = await db.customerLead.findUnique({
      where: { userId: existingUser.id },
      select: { id: true },
    });
    if (!linked) {
      userId = existingUser.id;
      if (status === "LEAD" || status === "CONTACTED" || status === "NURTURING") {
        status = "SIGNED_UP";
      }
    }
  }

  const created = await db.customerLead.create({
    data: {
      name: input.name?.trim() || null,
      email,
      companyName: input.companyName?.trim() || null,
      phone: input.phone?.trim() || null,
      source: input.source?.trim() || null,
      status,
      contactedAt: input.contactedAt ?? new Date(),
      notes: input.notes?.trim() || null,
      userId,
      addedById: input.addedById,
    },
    include: {
      addedBy: {
        select: { id: true, email: true, name: true },
      },
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
  });

  return serializeLead(created);
}

export async function updateCustomerLead(
  id: string,
  input: {
    name?: string | null;
    email?: string;
    companyName?: string | null;
    phone?: string | null;
    source?: string | null;
    status?: CustomerCrmStatus;
    contactedAt?: Date;
    lastFollowUpAt?: Date | null;
    notes?: string | null;
  },
) {
  const existing = await db.customerLead.findUnique({ where: { id } });
  if (!existing) {
    throw new Error("Customer lead not found");
  }

  let userId = existing.userId;
  let status = input.status ?? existing.status;
  const email =
    input.email !== undefined ? normalizeEmail(input.email) : existing.email;

  if (!userId && email) {
    const user = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (user) {
      const linked = await db.customerLead.findUnique({
        where: { userId: user.id },
        select: { id: true },
      });
      if (!linked || linked.id === id) {
        userId = user.id;
        if (
          status === "LEAD" ||
          status === "CONTACTED" ||
          status === "NURTURING"
        ) {
          status = "SIGNED_UP";
        }
      }
    }
  }

  const updated = await db.customerLead.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name?.trim() || null } : {}),
      ...(input.email !== undefined ? { email } : {}),
      ...(input.companyName !== undefined
        ? { companyName: input.companyName?.trim() || null }
        : {}),
      ...(input.phone !== undefined ? { phone: input.phone?.trim() || null } : {}),
      ...(input.source !== undefined
        ? { source: input.source?.trim() || null }
        : {}),
      status,
      ...(input.contactedAt !== undefined ? { contactedAt: input.contactedAt } : {}),
      ...(input.lastFollowUpAt !== undefined
        ? { lastFollowUpAt: input.lastFollowUpAt }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes?.trim() || null } : {}),
      userId,
    },
    include: {
      addedBy: {
        select: { id: true, email: true, name: true },
      },
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
  });

  return serializeLead(updated);
}

export async function deleteCustomerLead(id: string) {
  await db.customerLead.delete({ where: { id } });
}

export async function linkCustomerLeadOnSignup(input: {
  userId: string;
  email: string;
  name?: string | null;
}) {
  const email = normalizeEmail(input.email);
  const leads = await db.customerLead.findMany({
    where: {
      email,
      userId: null,
      status: { notIn: CLOSED_STATUSES },
    },
    orderBy: { createdAt: "asc" },
  });

  if (leads.length === 0) {
    return;
  }

  const alreadyLinked = await db.customerLead.findUnique({
    where: { userId: input.userId },
    select: { id: true },
  });

  if (alreadyLinked) {
    return;
  }

  const [primary, ...rest] = leads;

  await db.customerLead.update({
    where: { id: primary.id },
    data: {
      userId: input.userId,
      status:
        primary.status === "LEAD" ||
        primary.status === "CONTACTED" ||
        primary.status === "NURTURING"
          ? "SIGNED_UP"
          : primary.status,
      ...(input.name && !primary.name ? { name: input.name } : {}),
    },
  });

  for (const duplicate of rest) {
    await db.customerLead.update({
      where: { id: duplicate.id },
      data: { status: "ARCHIVED" },
    });
  }
}

export async function sendCustomerLeadEmail(input: {
  id: string;
  subject: string;
  message: string;
}) {
  const lead = await db.customerLead.findUnique({ where: { id: input.id } });
  if (!lead) {
    throw new Error("Customer lead not found");
  }

  const subject = input.subject.trim();
  const message = input.message.trim();
  if (!subject || !message) {
    throw new Error("Subject and message are required");
  }

  const greeting = lead.name ? `Hi ${lead.name},` : "Hi,";
  const text = `${greeting}\n\n${message}\n\n— US Parts\nhttps://www.usparts.us`;
  const html = `<p>${greeting}</p><p>${message.replace(/\n/g, "<br />")}</p><p>— US Parts<br /><a href="https://www.usparts.us">www.usparts.us</a></p>`;

  await sendEmail({
    to: lead.email,
    subject,
    text,
    html,
  });

  const nextStatus: CustomerCrmStatus =
    lead.status === "LEAD" ? "CONTACTED" : lead.status;

  const updated = await db.customerLead.update({
    where: { id: lead.id },
    data: {
      lastEmailedAt: new Date(),
      lastFollowUpAt: new Date(),
      emailCount: { increment: 1 },
      status: nextStatus,
      notes: lead.notes
        ? `${lead.notes.trim()}\n\n[Email ${new Date().toISOString().slice(0, 10)}] ${subject}`
        : `[Email ${new Date().toISOString().slice(0, 10)}] ${subject}`,
    },
    include: {
      addedBy: {
        select: { id: true, email: true, name: true },
      },
      user: {
        select: { id: true, email: true, name: true, createdAt: true },
      },
    },
  });

  return serializeLead(updated);
}
