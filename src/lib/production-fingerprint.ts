/**
 * Non-secret production identity for admin/health dashboards.
 * Helps catch wrong-project deploys immediately.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

export type ProductionFingerprint = {
  expectedProject: string;
  expectedService: string;
  expectedDomain: string;
  projectName: string | null;
  projectId: string | null;
  serviceName: string | null;
  serviceId: string | null;
  environmentName: string | null;
  environmentId: string | null;
  /** Non-secret DB identity: host/dbname only (never password). */
  database: {
    host: string | null;
    port: string | null;
    name: string | null;
  };
  gitCommit: string | null;
  gitBranch: string | null;
  deploymentId: string | null;
  /** Image/build time when available; never a secret. */
  deploymentTime: string | null;
  checkedAt: string;
  matchesExpected: boolean;
  mismatchReasons: string[];
};

function readDeployedAt(): string | null {
  if (process.env.USP_DEPLOYED_AT) {
    return process.env.USP_DEPLOYED_AT;
  }
  try {
    return readFileSync(join(process.cwd(), "DEPLOYED_AT"), "utf8").trim() || null;
  } catch {
    return null;
  }
}

const EXPECTED_PROJECT = "elegant-light";
/** Railway project id for elegant-light (www.usparts.us). */
const EXPECTED_PROJECT_ID = "b6cca4ff-dbbd-41b1-a3ba-ce1a384f1a10";
const EXPECTED_SERVICE = "usparts";
const EXPECTED_DOMAIN = "www.usparts.us";

function parseDatabaseFingerprint(url: string | undefined) {
  if (!url) {
    return { host: null, port: null, name: null };
  }

  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname || null,
      port: parsed.port || null,
      name: parsed.pathname.replace(/^\//, "").split("?")[0] || null,
    };
  } catch {
    return { host: null, port: null, name: null };
  }
}

export function getProductionFingerprint(): ProductionFingerprint {
  const projectName =
    process.env.USP_RAILWAY_PROJECT_NAME ??
    process.env.RAILWAY_PROJECT_NAME ??
    null;
  const projectId = process.env.RAILWAY_PROJECT_ID ?? null;
  const serviceName = process.env.RAILWAY_SERVICE_NAME ?? null;
  const serviceId = process.env.RAILWAY_SERVICE_ID ?? null;
  const environmentName = process.env.RAILWAY_ENVIRONMENT_NAME ?? null;
  const environmentId = process.env.RAILWAY_ENVIRONMENT_ID ?? null;
  const gitCommit =
    process.env.RAILWAY_GIT_COMMIT_SHA ??
    process.env.VERCEL_GIT_COMMIT_SHA ??
    null;
  const gitBranch =
    process.env.RAILWAY_GIT_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? null;
  const deploymentId = process.env.RAILWAY_DEPLOYMENT_ID ?? null;

  const mismatchReasons: string[] = [];
  if (projectId && projectId !== EXPECTED_PROJECT_ID) {
    mismatchReasons.push(
      `project id is "${projectId}", expected "${EXPECTED_PROJECT_ID}" (${EXPECTED_PROJECT})`,
    );
  }
  if (projectName && projectName !== EXPECTED_PROJECT) {
    mismatchReasons.push(
      `project name is "${projectName}", expected "${EXPECTED_PROJECT}"`,
    );
  }
  if (serviceName && serviceName !== EXPECTED_SERVICE) {
    mismatchReasons.push(
      `service is "${serviceName}", expected "${EXPECTED_SERVICE}"`,
    );
  }
  if (
    projectName === "USParts" ||
    projectName?.startsWith("RETIRED") ||
    process.env.RETIRED_DO_NOT_DEPLOY === "true"
  ) {
    mismatchReasons.push("linked to retired/orphan Railway project");
  }

  return {
    expectedProject: EXPECTED_PROJECT,
    expectedService: EXPECTED_SERVICE,
    expectedDomain: EXPECTED_DOMAIN,
    projectName: projectName ?? EXPECTED_PROJECT,
    projectId,
    serviceName,
    serviceId,
    environmentName,
    environmentId,
    database: parseDatabaseFingerprint(process.env.DATABASE_URL),
    gitCommit: gitCommit ? gitCommit.slice(0, 12) : null,
    gitBranch,
    deploymentId,
    deploymentTime: readDeployedAt(),
    checkedAt: new Date().toISOString(),
    matchesExpected: mismatchReasons.length === 0,
    mismatchReasons,
  };
}
