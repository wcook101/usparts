import "dotenv/config";
import {
  backfillDatasheetsFromListings,
  resolveDatasheetsForNormalizedMpn,
} from "@/lib/datasheet-resolve";
import { db } from "@/lib/db";

async function main() {
  const enrich = process.argv.includes("--enrich");
  const limitArg = process.argv.find((arg) => arg.startsWith("--limit="));
  const limit = limitArg ? Number.parseInt(limitArg.split("=")[1] ?? "0", 10) : 0;

  const fromListings = await backfillDatasheetsFromListings();
  console.log(`Backfilled ${fromListings} datasheet URLs from supplier listings.`);

  if (!enrich) {
    console.log("Run with --enrich to look up missing datasheets from manufacturers/Nexar.");
    return;
  }

  const missingGroups = await db.partListing.groupBy({
    by: ["mpnNormalized"],
    where: {
      isActive: true,
      mpnNormalized: {
        notIn: (
          await db.partDatasheet.findMany({
            select: { mpnNormalized: true },
          })
        ).map((row) => row.mpnNormalized),
      },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    ...(limit > 0 ? { take: limit } : {}),
  });

  console.log(`Enriching up to ${missingGroups.length} parts without catalog datasheets...`);

  let resolved = 0;
  for (const group of missingGroups) {
    const listing = await db.partListing.findFirst({
      where: { isActive: true, mpnNormalized: group.mpnNormalized },
      select: { mpn: true },
      orderBy: { updatedAt: "desc" },
    });

    if (!listing) {
      continue;
    }

    const result = await resolveDatasheetsForNormalizedMpn(group.mpnNormalized, {
      force: true,
    });

    if (result.datasheetUrls.length > 0) {
      resolved += 1;
      console.log(`  ✓ ${listing.mpn} (${result.source})`);
    }

    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  console.log(`Resolved ${resolved} new datasheet URLs.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
