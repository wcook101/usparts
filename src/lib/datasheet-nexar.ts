import { isLikelyPdfUrl } from "@/lib/datasheet";

const NEXAR_TOKEN_URL = "https://identity.nexar.com/connect/token";
const NEXAR_GRAPHQL_URL = "https://api.nexar.com/graphql";

let cachedToken: { value: string; expiresAt: number } | null = null;

function readEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value || undefined;
}

export function isNexarConfigured(): boolean {
  return Boolean(readEnv("NEXAR_CLIENT_ID") && readEnv("NEXAR_CLIENT_SECRET"));
}

async function getNexarAccessToken(): Promise<string | null> {
  const clientId = readEnv("NEXAR_CLIENT_ID");
  const clientSecret = readEnv("NEXAR_CLIENT_SECRET");

  if (!clientId || !clientSecret) {
    return null;
  }

  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope: "supply.domain",
  });

  const response = await fetch(NEXAR_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    return null;
  }

  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

type NexarSearchResult = {
  data?: {
    supSearchMpn?: {
      results?: Array<{
        part?: {
          mpn?: string;
          bestDatasheet?: { url?: string | null } | null;
          documents?: Array<{ url?: string | null; name?: string | null }>;
        };
      }>;
    };
  };
};

function pickDatasheetFromNexarPart(
  part: NonNullable<
    NonNullable<NonNullable<NexarSearchResult["data"]>["supSearchMpn"]>["results"]
  >[number]["part"],
): string | null {
  if (!part) {
    return null;
  }

  const best = part.bestDatasheet?.url?.trim();
  if (best) {
    return best;
  }

  for (const document of part.documents ?? []) {
    const url = document.url?.trim();
    const name = document.name?.toLowerCase() ?? "";
    if (url && (isLikelyPdfUrl(url) || name.includes("datasheet"))) {
      return url;
    }
  }

  return null;
}

export async function resolveNexarDatasheetUrl(mpn: string): Promise<string | null> {
  const token = await getNexarAccessToken();
  if (!token) {
    return null;
  }

  return resolveNexarDatasheetUrlWithToken(mpn, token);
}

export async function resolveNexarDatasheetUrls(mpns: string[]): Promise<string | null> {
  const token = await getNexarAccessToken();
  if (!token) {
    return null;
  }

  for (const mpn of mpns) {
    const url = await resolveNexarDatasheetUrlWithToken(mpn, token);
    if (url) {
      return url;
    }
  }

  return null;
}

async function resolveNexarDatasheetUrlWithToken(
  mpn: string,
  token: string,
): Promise<string | null> {
  const query = `
    query SearchMpn($q: String!) {
      supSearchMpn(q: $q, limit: 3) {
        results {
          part {
            mpn
            bestDatasheet { url }
            documents { url name }
          }
        }
      }
    }
  `;

  const response = await fetch(NEXAR_GRAPHQL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      variables: { q: mpn.trim() },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as NexarSearchResult;
  const results = payload.data?.supSearchMpn?.results ?? [];

  for (const result of results) {
    const url = pickDatasheetFromNexarPart(result.part);
    if (url) {
      return url;
    }
  }

  return null;
}
