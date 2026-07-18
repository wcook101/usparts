import "dotenv/config";
import {
  aggregateSearchIntelDay,
  aggregateSearchIntelRange,
  easternDayDate,
} from "@/lib/search-intel/aggregate";
import { startOfTodayEastern } from "@/lib/datetime";

async function main() {
  const backfill = process.argv.includes("--backfill");
  const includeToday = process.argv.includes("--include-today");

  if (backfill) {
    const results = await aggregateSearchIntelRange({ includeToday });
    console.log(
      `Search intel backfill complete: ${results.length} day(s).`,
    );
    for (const row of results) {
      console.log(
        `  ${row.day}: total=${row.searchesTotal} human=${row.searchesHuman} ranks=${row.ranksWritten}`,
      );
    }
    return;
  }

  const todayStart = startOfTodayEastern();
  const target = includeToday
    ? todayStart
    : new Date(todayStart.getTime() - 12 * 60 * 60 * 1000);
  const result = await aggregateSearchIntelDay(easternDayDate(target));
  console.log(
    `Search intel rollup ${result.day}: total=${result.searchesTotal} human=${result.searchesHuman} ranks=${result.ranksWritten}`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { db } = await import("@/lib/db");
    await db.$disconnect();
  });
