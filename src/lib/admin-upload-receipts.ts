import { db } from "@/lib/db";

export async function getUploadReceiptsForAdmin(limit = 100) {
  const records = await db.uploadReceipt.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      company: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return records.map((record) => ({
    id: record.id,
    fileName: record.fileName,
    recipients: record.recipients,
    status: record.status,
    message: record.message,
    createdCount: record.createdCount,
    updatedCount: record.updatedCount,
    createdAt: record.createdAt.toISOString(),
    companyName: record.company.name,
    companyEmail: record.company.email,
  }));
}
