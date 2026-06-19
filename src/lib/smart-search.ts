import { readEnv } from "@/lib/email";
import { bulkSearchListings, type BulkSearchResult } from "@/lib/listings";
import { normalizeMpn } from "@/lib/mpn-normalize";
import { db } from "@/lib/db";
import type { SmartSearchInput } from "@/lib/validations";

export const MAX_SMART_SEARCH_SUGGESTIONS = 20;
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type SmartSearchResult = {
  query: string;
  suggestedMpns: string[];
  cached: boolean;
  expansionMs: number;
  search: BulkSearchResult;
};

export function isSmartSearchEnabled(): boolean {
  if (process.env.SMART_SEARCH_ENABLED === "false") {
    return false;
  }

  return Boolean(readEnv("OPENAI_API_KEY"));
}

function normalizeQueryKey(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, " ");
}

type ExpansionResponse = {
  mpns?: unknown;
};

async function expandQueryWithLlm(query: string): Promise<string[]> {
  const apiKey = readEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("Smart search is not configured");
  }

  const model = readEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
  const startedAt = Date.now();

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You are an electronic components expert helping buyers find surplus inventory.",
            "Given a part description or equivalence request, return JSON: {\"mpns\":[\"LM358\",\"LM358N\"]}",
            `Return ${MAX_SMART_SEARCH_SUGGESTIONS} or fewer real manufacturer part numbers.`,
            "Prefer common industry base numbers and widely stocked variants.",
            'For requests like "equivalent to 74HC00", include direct substitutes and common alternates.',
            "Return only JSON with an mpns string array. No prose.",
          ].join(" "),
        },
        {
          role: "user",
          content: query,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(
      `AI expansion failed (${response.status})${errorBody ? `: ${errorBody.slice(0, 200)}` : ""}`,
    );
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("AI expansion returned an empty response");
  }

  let parsed: ExpansionResponse;
  try {
    parsed = JSON.parse(content) as ExpansionResponse;
  } catch {
    throw new Error("AI expansion returned invalid JSON");
  }

  if (!Array.isArray(parsed.mpns)) {
    throw new Error("AI expansion did not return part numbers");
  }

  const mpns: string[] = [];
  const seen = new Set<string>();

  for (const raw of parsed.mpns) {
    if (typeof raw !== "string") {
      continue;
    }

    const normalized = normalizeMpn(raw);
    if (!normalized || seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    mpns.push(normalized);

    if (mpns.length >= MAX_SMART_SEARCH_SUGGESTIONS) {
      break;
    }
  }

  if (mpns.length === 0) {
    throw new Error("AI could not suggest any part numbers for that description");
  }

  console.info(
    `Smart search expansion for "${query}" returned ${mpns.length} MPNs in ${Date.now() - startedAt}ms`,
  );

  return mpns;
}

async function getCachedExpansion(queryKey: string): Promise<string[] | null> {
  const cached = await db.searchExpansionCache.findUnique({
    where: { queryKey },
  });

  if (!cached) {
    return null;
  }

  if (cached.expiresAt.getTime() <= Date.now()) {
    await db.searchExpansionCache.delete({ where: { queryKey } }).catch(() => undefined);
    return null;
  }

  return cached.suggestedMpns;
}

async function cacheExpansion(
  queryKey: string,
  queryText: string,
  suggestedMpns: string[],
): Promise<void> {
  const expiresAt = new Date(Date.now() + CACHE_TTL_MS);

  await db.searchExpansionCache.upsert({
    where: { queryKey },
    create: {
      queryKey,
      queryText,
      suggestedMpns,
      expiresAt,
    },
    update: {
      queryText,
      suggestedMpns,
      expiresAt,
    },
  });
}

export async function smartSearchListings(
  input: SmartSearchInput,
): Promise<SmartSearchResult> {
  if (!isSmartSearchEnabled()) {
    throw new Error("Smart search is not configured");
  }

  const query = input.query.trim();
  const queryKey = normalizeQueryKey(query);
  const expansionStartedAt = Date.now();

  let suggestedMpns = await getCachedExpansion(queryKey);
  let cached = true;

  if (!suggestedMpns) {
    cached = false;
    suggestedMpns = await expandQueryWithLlm(query);
    await cacheExpansion(queryKey, query, suggestedMpns);
  }

  const expansionMs = Date.now() - expansionStartedAt;
  const search = await bulkSearchListings({
    mpns: suggestedMpns.join("\n"),
    manufacturer: input.manufacturer,
    category: input.category,
  });

  return {
    query,
    suggestedMpns,
    cached,
    expansionMs,
    search,
  };
}
