import { normalizeMpn } from "@/lib/mpn-normalize";

const PROXY_TIMEOUT_MS = 20_000;
const MAX_BYTES = 25 * 1024 * 1024;

export async function proxyDatasheetResponse(
  upstreamUrl: string,
  disposition: "inline" | "attachment",
  filename: string,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(upstreamUrl, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "USParts-DatasheetProxy/1.0",
        Accept: "application/pdf,*/*",
      },
    });

    if (!upstream.ok || !upstream.body) {
      return Response.json(
        { error: "Datasheet could not be loaded from the manufacturer." },
        { status: 502 },
      );
    }

    const contentLength = upstream.headers.get("content-length");
    if (contentLength && Number(contentLength) > MAX_BYTES) {
      return Response.json(
        { error: "Datasheet file is too large to preview." },
        { status: 413 },
      );
    }

    const contentType =
      upstream.headers.get("content-type")?.split(";")[0]?.trim() ||
      "application/pdf";

    const safeFilename = filename.replace(/[^a-zA-Z0-9._-]+/g, "_");

    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${disposition}; filename="${safeFilename}.pdf"`,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Datasheet preview timed out. Try again in a moment." },
      { status: 504 },
    );
  } finally {
    clearTimeout(timer);
  }
}

export function decodeMpnParam(mpnParam: string): string {
  return decodeURIComponent(mpnParam).trim();
}

export function mpnParamToNormalized(mpnParam: string): string | null {
  const decoded = decodeMpnParam(mpnParam);
  const normalized = normalizeMpn(decoded);
  return normalized || null;
}

export function parseSourceIndex(searchParams: URLSearchParams): number {
  const raw = searchParams.get("index");
  const parsed = raw ? Number.parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}
