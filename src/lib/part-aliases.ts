import { db } from "@/lib/db";
import { normalizeMpn } from "@/lib/mpn-normalize";

export type AliasTarget = {
  inventoryMpn: string;
  manufacturer: string | null;
  confidence: number;
};

/** Map each missed normalized MPN to inventory MPNs to search via aliases. */
export async function lookupAliasTargets(
  missedNormalized: string[],
): Promise<Map<string, AliasTarget[]>> {
  const uniqueMisses = [...new Set(missedNormalized.filter(Boolean))];
  if (uniqueMisses.length === 0) {
    return new Map();
  }

  const aliases = await db.partAlias.findMany({
    where: {
      OR: [{ fromMpn: { in: uniqueMisses } }, { toMpn: { in: uniqueMisses } }],
    },
    orderBy: [{ confidence: "desc" }, { createdAt: "asc" }],
  });

  const result = new Map<string, AliasTarget[]>();

  for (const miss of uniqueMisses) {
    const targets: AliasTarget[] = [];
    const seen = new Set<string>();

    for (const alias of aliases) {
      let inventoryMpn: string | null = null;

      if (alias.fromMpn === miss) {
        inventoryMpn = alias.toMpn;
      } else if (alias.toMpn === miss) {
        inventoryMpn = alias.fromMpn;
      }

      if (!inventoryMpn || inventoryMpn === miss) {
        continue;
      }

      const key = `${inventoryMpn}::${alias.manufacturer ?? ""}`;
      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      targets.push({
        inventoryMpn,
        manufacturer: alias.manufacturer,
        confidence: alias.confidence,
      });
    }

    if (targets.length > 0) {
      result.set(miss, targets);
    }
  }

  return result;
}

export function aliasMatchesListing(
  listing: { mpnNormalized: string; manufacturer: string },
  target: AliasTarget,
): boolean {
  if (listing.mpnNormalized !== target.inventoryMpn) {
    return false;
  }

  if (!target.manufacturer?.trim()) {
    return true;
  }

  const aliasMfr = target.manufacturer.trim().toLowerCase();
  const listingMfr = listing.manufacturer.trim().toLowerCase();
  return listingMfr === aliasMfr || listingMfr.includes(aliasMfr) || aliasMfr.includes(listingMfr);
}

export type CreatePartAliasInput = {
  fromMpn: string;
  toMpn: string;
  manufacturer?: string | null;
  source?: string;
  confidence?: number;
};

export async function createPartAlias(input: CreatePartAliasInput) {
  const fromMpn = normalizeMpn(input.fromMpn);
  const toMpn = normalizeMpn(input.toMpn);

  if (!fromMpn || !toMpn) {
    throw new Error("Both part numbers are required");
  }

  if (fromMpn === toMpn) {
    throw new Error("Part numbers must be different");
  }

  return db.partAlias.create({
    data: {
      fromMpn,
      toMpn,
      manufacturer: input.manufacturer?.trim() || null,
      source: input.source ?? "manual_admin",
      confidence: input.confidence ?? 1.0,
    },
  });
}

export async function listPartAliases(limit = 200) {
  return db.partAlias.findMany({
    orderBy: [{ fromMpn: "asc" }, { toMpn: "asc" }],
    take: limit,
  });
}

export async function deletePartAlias(id: string) {
  return db.partAlias.delete({ where: { id } });
}
