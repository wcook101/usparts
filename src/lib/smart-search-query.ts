import type { SmartSearchInput } from "@/lib/validations";

export type SmartSearchRefinements = {
  supplyVoltage?: string;
  channels?: string;
  packageType?: string;
  manufacturer?: string;
  notes?: string;
};

export function getSmartSearchRefinements(
  input: SmartSearchInput,
): SmartSearchRefinements | undefined {
  const refinements: SmartSearchRefinements = {};

  if (input.supplyVoltage?.trim()) {
    refinements.supplyVoltage = input.supplyVoltage.trim();
  }
  if (input.channels?.trim()) {
    refinements.channels = input.channels.trim();
  }
  if (input.packageType?.trim()) {
    refinements.packageType = input.packageType.trim();
  }
  if (input.manufacturer?.trim()) {
    refinements.manufacturer = input.manufacturer.trim();
  }
  if (input.notes?.trim()) {
    refinements.notes = input.notes.trim();
  }

  return Object.keys(refinements).length > 0 ? refinements : undefined;
}

export function buildSmartSearchExpansionPrompt(input: SmartSearchInput): string {
  const refinements = getSmartSearchRefinements(input);
  if (!refinements) {
    return input.query.trim();
  }

  const constraints: string[] = [];

  if (refinements.channels) {
    constraints.push(`channels: ${refinements.channels}`);
  }
  if (refinements.supplyVoltage) {
    constraints.push(`supply voltage: ${refinements.supplyVoltage}`);
  }
  if (refinements.packageType) {
    constraints.push(`package: ${refinements.packageType}`);
  }
  if (refinements.manufacturer) {
    constraints.push(`manufacturer preference: ${refinements.manufacturer}`);
  }
  if (refinements.notes) {
    constraints.push(refinements.notes);
  }

  return `${input.query.trim()}\nConstraints: ${constraints.join("; ")}`;
}

export function buildSmartSearchCacheKey(input: SmartSearchInput): string {
  return buildSmartSearchExpansionPrompt(input)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function formatSmartSearchRefinements(
  refinements: SmartSearchRefinements | undefined,
): string | null {
  if (!refinements) {
    return null;
  }

  const parts: string[] = [];

  if (refinements.channels) {
    parts.push(`${refinements.channels} channel`);
  }
  if (refinements.supplyVoltage) {
    parts.push(refinements.supplyVoltage);
  }
  if (refinements.packageType) {
    parts.push(refinements.packageType);
  }
  if (refinements.manufacturer) {
    parts.push(refinements.manufacturer);
  }
  if (refinements.notes) {
    parts.push(refinements.notes);
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}
