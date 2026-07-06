import { mpnParamToNormalized } from "@/lib/datasheet-proxy";
import { resolveDatasheetsForNormalizedMpn } from "@/lib/datasheet-resolve";

type RouteContext = {
  params: Promise<{ mpn: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { mpn: mpnParam } = await context.params;
  const mpnNormalized = mpnParamToNormalized(mpnParam);

  if (!mpnNormalized) {
    return Response.json({ error: "Invalid part number." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const force = searchParams.get("force") === "1";

  const result = await resolveDatasheetsForNormalizedMpn(mpnNormalized, { force });

  return Response.json({
    mpn: result.mpn,
    mpnNormalized: result.mpnNormalized,
    manufacturer: result.manufacturer,
    datasheetUrls: result.datasheetUrls,
    source: result.source,
    resolved: result.resolved,
    matchNote: result.matchNote,
  });
}
