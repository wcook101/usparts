import { readEnv } from "@/lib/email";
import { db } from "@/lib/db";

export const DEFAULT_SMART_SEARCH_MONTHLY_BUDGET_USD = 50;

const MODEL_PRICING_PER_MILLION: Record<string, { input: number; output: number }> = {
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gpt-4o": { input: 2.5, output: 10 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1": { input: 2.0, output: 8.0 },
};

export const SMART_SEARCH_PUBLIC_UNAVAILABLE_MESSAGE =
  "Describe-a-part search is temporarily unavailable. Try part number search, or try again later.";

export const SMART_SEARCH_PROVIDER_UNAVAILABLE_MESSAGE =
  "Describe-a-part search is temporarily unavailable. Try part number search instead.";

export class SmartSearchBudgetExceededError extends Error {
  budgetUsd: number;
  spentUsd: number;
  monthKey: string;

  constructor(budgetUsd: number, spentUsd: number, monthKey: string) {
    super(SMART_SEARCH_PUBLIC_UNAVAILABLE_MESSAGE);
    this.name = "SmartSearchBudgetExceededError";
    this.budgetUsd = budgetUsd;
    this.spentUsd = spentUsd;
    this.monthKey = monthKey;
  }
}

export function getSmartSearchMonthlyBudgetUsd(): number {
  const raw = readEnv("SMART_SEARCH_MONTHLY_BUDGET_USD");
  if (!raw) {
    return DEFAULT_SMART_SEARCH_MONTHLY_BUDGET_USD;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_SMART_SEARCH_MONTHLY_BUDGET_USD;
  }

  return parsed;
}

export function getCurrentSmartSearchMonthKey(date = new Date()): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function estimateSmartSearchCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const pricing =
    MODEL_PRICING_PER_MILLION[model] ?? MODEL_PRICING_PER_MILLION["gpt-4o-mini"];

  return (
    (promptTokens * pricing.input + completionTokens * pricing.output) / 1_000_000
  );
}

export type SmartSearchBudgetStatus = {
  monthKey: string;
  budgetUsd: number;
  spentUsd: number;
  remainingUsd: number;
  apiRequestCount: number;
  cachedHitCount: number;
  budgetExceeded: boolean;
};

export async function getSmartSearchBudgetStatus(): Promise<SmartSearchBudgetStatus> {
  const monthKey = getCurrentSmartSearchMonthKey();
  const budgetUsd = getSmartSearchMonthlyBudgetUsd();
  const usage = await db.smartSearchUsageMonth.findUnique({
    where: { monthKey },
  });

  const spentUsd = Number(usage?.estimatedCostUsd ?? 0);
  const remainingUsd = Math.max(0, budgetUsd - spentUsd);

  return {
    monthKey,
    budgetUsd,
    spentUsd,
    remainingUsd,
    apiRequestCount: usage?.apiRequestCount ?? 0,
    cachedHitCount: usage?.cachedHitCount ?? 0,
    budgetExceeded: spentUsd >= budgetUsd,
  };
}

export async function assertSmartSearchWithinBudget(): Promise<void> {
  const status = await getSmartSearchBudgetStatus();
  if (status.budgetExceeded) {
    throw new SmartSearchBudgetExceededError(
      status.budgetUsd,
      status.spentUsd,
      status.monthKey,
    );
  }
}

export async function recordSmartSearchApiUsage(input: {
  model: string;
  promptTokens: number;
  completionTokens: number;
}): Promise<void> {
  const monthKey = getCurrentSmartSearchMonthKey();
  const costUsd = estimateSmartSearchCostUsd(
    input.model,
    input.promptTokens,
    input.completionTokens,
  );

  await db.smartSearchUsageMonth.upsert({
    where: { monthKey },
    create: {
      monthKey,
      apiRequestCount: 1,
      promptTokens: input.promptTokens,
      completionTokens: input.completionTokens,
      estimatedCostUsd: costUsd,
    },
    update: {
      apiRequestCount: { increment: 1 },
      promptTokens: { increment: input.promptTokens },
      completionTokens: { increment: input.completionTokens },
      estimatedCostUsd: { increment: costUsd },
    },
  });
}

export async function recordSmartSearchCacheHit(): Promise<void> {
  const monthKey = getCurrentSmartSearchMonthKey();

  await db.smartSearchUsageMonth.upsert({
    where: { monthKey },
    create: {
      monthKey,
      cachedHitCount: 1,
    },
    update: {
      cachedHitCount: { increment: 1 },
    },
  });
}
