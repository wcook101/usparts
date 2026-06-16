import "dotenv/config";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const databaseUrl = process.env.DATABASE_URL;

async function checkHealth() {
  const response = await fetch(`${baseUrl}/api/health`);
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }

  const data = await response.json();
  if (data.status !== "ok") {
    throw new Error(`Unexpected health response: ${JSON.stringify(data)}`);
  }
}

async function checkSearch() {
  const response = await fetch(`${baseUrl}/api/search?q=STM32`);
  if (!response.ok) {
    throw new Error(`Search check failed: ${response.status}`);
  }

  const data = await response.json();
  if (!Array.isArray(data.listings)) {
    throw new Error("Search response missing listings array");
  }
}

async function main() {
  console.log("USParts dev verification");
  console.log(`App URL: ${baseUrl}`);
  console.log(`Database: ${databaseUrl ? "configured" : "missing DATABASE_URL"}`);

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  await checkHealth();
  console.log("✓ Health endpoint");

  await checkSearch();
  console.log("✓ Search endpoint");

  console.log("\nDev environment looks good.");
}

main().catch((error) => {
  console.error("\nVerification failed:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
