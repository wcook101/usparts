import {
  decodeMpnParam,
  mpnParamToNormalized,
} from "@/lib/datasheet-proxy";
import { getPrimaryManufacturerForMpn } from "@/lib/datasheet-catalog";
import { resolveDatasheetsForMpn } from "@/lib/datasheet-resolve";

type RouteContext = {
  params: Promise<{ mpn: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { mpn: mpnParam } = await context.params;
  const mpnNormalized = mpnParamToNormalized(mpnParam);

  if (!mpnNormalized) {
    return Response.json({ error: "Invalid part number." }, { status: 400 });
  }

  const decodedMpn = decodeMpnParam(mpnParam);
  const manufacturer =
    (await getPrimaryManufacturerForMpn(mpnNormalized)) ?? null;

  const result = await resolveDatasheetsForMpn({
    mpn: decodedMpn,
    manufacturer,
  });

  return Response.json({
    mpn: result.mpn,
    mpnNormalized: result.mpnNormalized,
    manufacturer: result.manufacturer,
    datasheetUrls: result.datasheetUrls,
    source: result.source,
    resolved: result.resolved,
  });
}
