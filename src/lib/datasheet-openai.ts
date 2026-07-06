import { readEnv } from "@/lib/email";
import { isLikelyPdfUrl, normalizeDatasheetUrl } from "@/lib/datasheet";
import { urlLooksReachable } from "@/lib/datasheet-manufacturers";

const ALLOWED_HOSTS = [
  "ti.com",
  "analog.com",
  "st.com",
  "onsemi.com",
  "nxp.com",
  "infineon.com",
  "microchip.com",
  "vishay.com",
];

export function isOpenAiDatasheetLookupEnabled(): boolean {
  if (process.env.DATASHEET_OPENAI_LOOKUP === "false") {
    return false;
  }

  return Boolean(readEnv("OPENAI_API_KEY"));
}

function isAllowedDatasheetHost(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return ALLOWED_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`),
    );
  } catch {
    return false;
  }
}

type OpenAiDatasheetResponse = {
  url?: string | null;
  matchType?: "exact" | "family" | null;
  note?: string | null;
};

export type OpenAiDatasheetMatch = {
  url: string;
  matchType: "exact" | "family";
  note: string | null;
};

export async function resolveOpenAiDatasheetUrl(
  mpn: string,
  manufacturer: string | null,
): Promise<OpenAiDatasheetMatch | null> {
  const apiKey = readEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return null;
  }

  const model = readEnv("OPENAI_MODEL") ?? "gpt-4o-mini";
  const manufacturerLabel = manufacturer?.trim() || "unknown";

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: [
            "You help electronics buyers find official manufacturer datasheet PDF URLs.",
            'Return JSON only: {"url": string|null, "matchType": "exact"|"family"|null, "note": string|null}.',
            "url must be a direct https PDF on ti.com, analog.com, st.com, onsemi.com, nxp.com, infineon.com, microchip.com, or vishay.com.",
            "Prefer exact military or commercial datasheet PDFs for the requested part number.",
            "For US military 5962- or JM38510 numbers, map to the correct TI/National Semiconductor family datasheet only when you are confident.",
            "If you are not confident, return url null.",
          ].join(" "),
        },
        {
          role: "user",
          content: `Find the official datasheet PDF URL for MPN ${mpn} (manufacturer: ${manufacturerLabel}).`,
        },
      ],
    }),
  });

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    return null;
  }

  let parsed: OpenAiDatasheetResponse;
  try {
    parsed = JSON.parse(content) as OpenAiDatasheetResponse;
  } catch {
    return null;
  }

  const rawUrl = parsed.url?.trim();
  if (!rawUrl) {
    return null;
  }

  const normalizedUrl = normalizeDatasheetUrl(rawUrl);
  if (
    !normalizedUrl ||
    !isAllowedDatasheetHost(normalizedUrl) ||
    !isLikelyPdfUrl(normalizedUrl)
  ) {
    return null;
  }

  if (!(await urlLooksReachable(normalizedUrl))) {
    return null;
  }

  return {
    url: normalizedUrl,
    matchType: parsed.matchType === "family" ? "family" : "exact",
    note: parsed.note?.trim() || null,
  };
}
