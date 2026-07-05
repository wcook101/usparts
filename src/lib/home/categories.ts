import type { PartCategory } from "@/generated/prisma/client";
import { CATEGORY_LABELS } from "@/lib/format";

export type BrowseCategory = {
  category: PartCategory;
  label: string;
  description: string;
  href: string;
};

const categoryDescriptions: Record<PartCategory, string> = {
  SEMICONDUCTOR: "Transistors, diodes, and discrete semiconductors",
  INTEGRATED_CIRCUIT: "MCUs, analog ICs, logic, and mixed-signal devices",
  PASSIVE: "Resistors, capacitors, inductors, and filters",
  CONNECTOR: "Headers, terminals, and interconnect components",
  POWER: "Regulators, converters, and power management",
  MEMORY: "Flash, DRAM, EEPROM, and storage ICs",
  SENSOR: "Environmental, motion, and measurement sensors",
  RF_WIRELESS: "RF modules, antennas, and wireless ICs",
  DISPLAY: "LCD, OLED, and display driver components",
  OTHER: "Miscellaneous electronic components and modules",
};

export const browseCategories: BrowseCategory[] = (
  Object.keys(CATEGORY_LABELS) as PartCategory[]
).map((category) => ({
  category,
  label: CATEGORY_LABELS[category],
  description: categoryDescriptions[category],
  href: `/search?category=${encodeURIComponent(category)}`,
}));

export function getBrowseCategory(category: PartCategory): BrowseCategory {
  return browseCategories.find((item) => item.category === category)!;
}
