import { authErrorResponse, requireAuth } from "@/lib/auth";
import { isAuthError } from "@/lib/auth/errors";
import {
  mpnParamToNormalized,
  parseSourceIndex,
  proxyDatasheetResponse,
} from "@/lib/datasheet-proxy";
import { getAuthorizedDatasheetUrl } from "@/lib/datasheet-resolve";

type RouteContext = {
  params: Promise<{ mpn: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAuth();
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }
    throw error;
  }

  const { mpn: mpnParam } = await context.params;
  const mpnNormalized = mpnParamToNormalized(mpnParam);

  if (!mpnNormalized) {
    return Response.json({ error: "Invalid part number." }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const index = parseSourceIndex(searchParams);

  const authorized = await getAuthorizedDatasheetUrl({ mpnNormalized, index });
  if (!authorized) {
    return Response.json({ error: "No datasheet is available for this part." }, { status: 404 });
  }

  return proxyDatasheetResponse(authorized.url, "attachment", authorized.mpn);
}
