#!/usr/bin/env node
/**
 * Runs on Railway as a pre-deploy command.
 * Aborts if this deployment is not the production elegant-light / usparts service.
 */

const EXPECTED_PROJECT_ID = "b6cca4ff-dbbd-41b1-a3ba-ce1a384f1a10";
const EXPECTED_PROJECT = "elegant-light";
const EXPECTED_SERVICE = "usparts";

if (process.env.ALLOW_WRONG_RAILWAY_PROJECT === "1") {
  console.warn("ALLOW_WRONG_RAILWAY_PROJECT=1 — skipping runtime project guard.");
  process.exit(0);
}

const projectId = process.env.RAILWAY_PROJECT_ID ?? "";
const serviceName = process.env.RAILWAY_SERVICE_NAME ?? "";
const projectName = process.env.USP_RAILWAY_PROJECT_NAME ?? "";

const errors = [];
if (projectId && projectId !== EXPECTED_PROJECT_ID) {
  errors.push(
    `RAILWAY_PROJECT_ID=${projectId} (expected ${EXPECTED_PROJECT_ID} / ${EXPECTED_PROJECT})`,
  );
}
if (serviceName && serviceName !== EXPECTED_SERVICE) {
  errors.push(
    `RAILWAY_SERVICE_NAME=${serviceName} (expected ${EXPECTED_SERVICE})`,
  );
}
if (process.env.RETIRED_DO_NOT_DEPLOY === "true") {
  errors.push("RETIRED_DO_NOT_DEPLOY=true on this service");
}
if (projectName && projectName !== EXPECTED_PROJECT) {
  errors.push(
    `USP_RAILWAY_PROJECT_NAME=${projectName} (expected ${EXPECTED_PROJECT})`,
  );
}

if (errors.length > 0) {
  console.error("\n❌ Railway pre-deploy guard failed:");
  for (const error of errors) console.error(`  - ${error}`);
  console.error(
    `\nProduction is only ${EXPECTED_PROJECT} / ${EXPECTED_SERVICE} / www.usparts.us\n`,
  );
  process.exit(1);
}

console.log(
  `✓ Runtime pre-deploy OK: project=${projectId || EXPECTED_PROJECT} service=${serviceName || EXPECTED_SERVICE}`,
);
