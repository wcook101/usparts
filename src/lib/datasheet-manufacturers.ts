import { isLikelyPdfUrl } from "@/lib/datasheet";

const FETCH_TIMEOUT_MS = 8000;

type ManufacturerPattern = {
  test: (manufacturer: string) => boolean;
  candidates: (mpn: string) => string[];
};

const MANUFACTURER_PATTERNS: ManufacturerPattern[] = [
  {
    test: (name) => /texas instruments|\bti\b/i.test(name),
    candidates: (mpn) => [
      `https://www.ti.com/lit/ds/symlink/${mpn}.pdf`,
      `https://www.ti.com/lit/ds/symlink/${mpn.toLowerCase()}.pdf`,
    ],
  },
  {
    test: (name) => /stmicro|stmicroelectronics|\bst\b/i.test(name),
    candidates: (mpn) => [
      `https://www.st.com/resource/en/datasheet/${mpn.toLowerCase()}.pdf`,
    ],
  },
  {
    test: (name) => /on semiconductor|onsemi/i.test(name),
    candidates: (mpn) => [
      `https://www.onsemi.com/download/datasheet/pdf/${mpn}-d.pdf`,
      `https://www.onsemi.com/download/datasheet/pdf/${mpn}.pdf`,
    ],
  },
  {
    test: (name) => /microchip|atmel/i.test(name),
    candidates: (mpn) => [
      `https://ww1.microchip.com/downloads/en/DeviceDoc/${mpn}.pdf`,
      `https://ww1.microchip.com/downloads/aemDocuments/documents/OTH/ProductDocuments/DataSheets/${mpn}.pdf`,
    ],
  },
  {
    test: (name) => /analog devices|\badi\b/i.test(name),
    candidates: (mpn) => [
      `https://www.analog.com/media/en/technical-documentation/data-sheets/${mpn}.pdf`,
      `https://www.analog.com/media/en/technical-documentation/data-sheets/${mpn.toLowerCase()}.pdf`,
    ],
  },
  {
    test: (name) => /nxp|freescale/i.test(name),
    candidates: (mpn) => [
      `https://www.nxp.com/docs/en/data-sheet/${mpn}.pdf`,
      `https://www.nxp.com/docs/en/data-sheet/${mpn.toUpperCase()}.pdf`,
    ],
  },
  {
    test: (name) => /infineon/i.test(name),
    candidates: (mpn) => [
      `https://www.infineon.com/dgdl/${mpn}.pdf`,
      `https://www.infineon.com/dgdl/Infineon-${mpn}-DataSheet-v02_00-EN.pdf`,
    ],
  },
  {
    test: (name) => /vishay/i.test(name),
    candidates: (mpn) => [
      `https://www.vishay.com/docs/${mpn.slice(0, 4)}/${mpn}.pdf`,
    ],
  },
  {
    test: (name) => /maxim|maxim integrated/i.test(name),
    candidates: (mpn) => [
      `https://www.analog.com/media/en/technical-documentation/data-sheets/${mpn}.pdf`,
    ],
  },
];

function withTimeout(signal: AbortSignal, timeoutMs: number): AbortSignal {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const abort = () => {
    clearTimeout(timer);
    controller.abort();
  };

  signal.addEventListener("abort", abort, { once: true });

  return controller.signal;
}

export async function urlLooksReachable(url: string): Promise<boolean> {
  const controller = new AbortController();
  const signal = withTimeout(controller.signal, FETCH_TIMEOUT_MS);

  try {
    const head = await fetch(url, {
      method: "HEAD",
      signal,
      redirect: "follow",
      headers: {
        "User-Agent": "USParts-DatasheetBot/1.0",
      },
    });

    if (head.ok) {
      const contentType = head.headers.get("content-type") ?? "";
      return (
        contentType.includes("pdf") ||
        contentType.includes("octet-stream") ||
        isLikelyPdfUrl(url)
      );
    }

    if (head.status === 405 || head.status === 403) {
      const getResponse = await fetch(url, {
        method: "GET",
        signal,
        redirect: "follow",
        headers: {
          Range: "bytes=0-1023",
          "User-Agent": "USParts-DatasheetBot/1.0",
        },
      });

      const contentType = getResponse.headers.get("content-type") ?? "";
      return (
        getResponse.ok &&
        (contentType.includes("pdf") ||
          contentType.includes("octet-stream") ||
          isLikelyPdfUrl(url))
      );
    }

    return false;
  } catch {
    return false;
  } finally {
    controller.abort();
  }
}

export function buildManufacturerDatasheetCandidates(
  mpn: string,
  manufacturer: string | null,
): string[] {
  const normalizedMpn = mpn.trim().toUpperCase();
  const urls = new Set<string>();
  const manufacturerNames = expandManufacturerAliases(manufacturer);

  for (const name of manufacturerNames) {
    for (const pattern of MANUFACTURER_PATTERNS) {
      if (pattern.test(name)) {
        for (const candidate of pattern.candidates(normalizedMpn)) {
          urls.add(candidate);
        }
      }
    }
  }

  return [...urls];
}

function expandManufacturerAliases(manufacturer: string | null): string[] {
  if (!manufacturer?.trim()) {
    return [];
  }

  const base = manufacturer.trim();
  const names = new Set<string>([base]);

  if (/^nsc$/i.test(base) || /national semiconductor|nat\.?\s*semi/i.test(base)) {
    names.add("Texas Instruments");
    names.add("National Semiconductor");
  }

  if (/signetics|fairchild/i.test(base)) {
    names.add("Texas Instruments");
    names.add("ON Semiconductor");
  }

  return [...names];
}

export async function resolveManufacturerDatasheetUrl(
  mpn: string,
  manufacturer: string | null,
): Promise<string | null> {
  const candidates = buildManufacturerDatasheetCandidates(mpn, manufacturer);

  for (const candidate of candidates) {
    if (await urlLooksReachable(candidate)) {
      return candidate;
    }
  }

  return null;
}

export async function resolveManufacturerDatasheetUrls(
  mpns: string[],
  manufacturer: string | null,
): Promise<string | null> {
  for (const mpn of mpns) {
    const url = await resolveManufacturerDatasheetUrl(mpn, manufacturer);
    if (url) {
      return url;
    }
  }

  return null;
}
