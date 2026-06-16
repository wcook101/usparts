import { cpSync, existsSync } from "node:fs";
import { join } from "node:path";

const standaloneDir = join(process.cwd(), ".next", "standalone");

if (!existsSync(standaloneDir)) {
  console.log("No standalone output — skipping asset copy.");
  process.exit(0);
}

cpSync(join(process.cwd(), "public"), join(standaloneDir, "public"), {
  recursive: true,
});
cpSync(
  join(process.cwd(), ".next", "static"),
  join(standaloneDir, ".next", "static"),
  { recursive: true },
);

console.log("Copied public/ and .next/static into standalone bundle.");
