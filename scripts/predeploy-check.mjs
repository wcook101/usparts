#!/usr/bin/env node
/**
 * Abort deploys unless the linked Railway context is production www.usparts.us.
 *
 * Usage:
 *   node scripts/predeploy-check.mjs
 *   npm run predeploy
 *
 * Override only for intentional emergencies:
 *   ALLOW_WRONG_RAILWAY_PROJECT=1 node scripts/predeploy-check.mjs
 */

import { execSync } from "node:child_process";

const EXPECTED = {
  project: "elegant-light",
  service: "usparts",
  domain: "www.usparts.us",
};

function fail(message) {
  console.error(`\n❌ Pre-deploy check failed: ${message}\n`);
  console.error(
    `Expected Railway project "${EXPECTED.project}", service "${EXPECTED.service}", domain "${EXPECTED.domain}".`,
  );
  console.error(
    "Link with: railway link --project elegant-light --environment production --service usparts\n",
  );
  process.exit(1);
}

function run(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch (error) {
    fail(
      `could not run \`${command}\`: ${error?.stderr || error?.message || error}`,
    );
  }
}

if (process.env.ALLOW_WRONG_RAILWAY_PROJECT === "1") {
  console.warn(
    "⚠ ALLOW_WRONG_RAILWAY_PROJECT=1 set — skipping Railway project guard.",
  );
  process.exit(0);
}

const statusRaw = run("railway status --json");
let status;
try {
  status = JSON.parse(statusRaw);
} catch {
  fail("railway status --json did not return valid JSON");
}

const projectName = status?.name;
if (projectName !== EXPECTED.project) {
  fail(`linked project is "${projectName ?? "unknown"}"`);
}

const services = (status?.services?.edges ?? []).map((edge) => edge?.node);
const usparts = services.find((service) => service?.name === EXPECTED.service);
if (!usparts) {
  fail(`service "${EXPECTED.service}" not found in linked project`);
}

let domainsRaw = "";
try {
  domainsRaw = execSync(
    `railway domain list --service ${EXPECTED.service} --json`,
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  ).trim();
} catch (error) {
  fail(
    `could not list domains for ${EXPECTED.service}: ${error?.stderr || error?.message || error}`,
  );
}

let domains;
try {
  domains = JSON.parse(domainsRaw);
} catch {
  fail("railway domain list --json did not return valid JSON");
}

const domainList = Array.isArray(domains)
  ? domains
  : (domains?.domains ?? []);
const hasWww = domainList.some(
  (item) => item?.domain === EXPECTED.domain || item === EXPECTED.domain,
);

if (!hasWww) {
  fail(
    `custom domain "${EXPECTED.domain}" is not attached to service "${EXPECTED.service}"`,
  );
}

console.log(
  `✓ Pre-deploy OK: project=${EXPECTED.project} service=${EXPECTED.service} domain=${EXPECTED.domain}`,
);
