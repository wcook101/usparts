export type ManufacturerProfile = {
  slug: string;
  name: string;
  /** Primary value for /search?manufacturer= */
  searchTerm: string;
  /** Substring matches against listing.manufacturer */
  aliases: string[];
  /** Case-insensitive exact matches (e.g. TI, ADI, NSC) */
  exactAliases?: string[];
  description: string;
  website: string;
  productFamilies: string[];
};

export const MANUFACTURER_PROFILES: ManufacturerProfile[] = [
  {
    slug: "texas-instruments",
    name: "Texas Instruments",
    searchTerm: "Texas Instruments",
    aliases: ["Texas Instruments", "National Semiconductor", "National Semi", "Nat Semi"],
    exactAliases: ["TI", "NSC"],
    description:
      "Texas Instruments (TI) is a leading analog and embedded processing semiconductor company. USParts aggregates surplus and in-stock TI parts — including legacy National Semiconductor lines — from US distributors for BOM search, quoting, and procurement.",
    website: "https://www.ti.com",
    productFamilies: ["LM3xx op-amps", "TPS power management", "SN74 logic", "MSP430 MCUs", "OPA precision amps"],
  },
  {
    slug: "analog-devices",
    name: "Analog Devices",
    searchTerm: "Analog Devices",
    aliases: ["Analog Devices", "Maxim Integrated", "Maxim"],
    exactAliases: ["ADI"],
    description:
      "Analog Devices (ADI) designs high-performance analog, mixed-signal, and power ICs. Search US supplier inventory for ADI and Maxim parts — amplifiers, data converters, sensors, and power management — on USParts.",
    website: "https://www.analog.com",
    productFamilies: ["AD8xxx ADCs", "ADA amplifiers", "LTC power", "MAXIM supervisors", "iCoupler isolators"],
  },
  {
    slug: "microchip",
    name: "Microchip",
    searchTerm: "Microchip",
    aliases: ["Microchip", "Microchip Technology", "Atmel"],
    description:
      "Microchip Technology supplies MCUs, analog, memory, and connectivity semiconductors — including the former Atmel AVR and SAM portfolios. Find Microchip surplus stock from US suppliers on USParts.",
    website: "https://www.microchip.com",
    productFamilies: ["PIC microcontrollers", "AVR", "SAM ARM MCUs", "MCP analog", "SST flash"],
  },
  {
    slug: "stmicroelectronics",
    name: "STMicroelectronics",
    searchTerm: "STMicroelectronics",
    aliases: ["STMicroelectronics", "STMicro", "ST Micro", "ST Microelectronics"],
    exactAliases: ["ST"],
    description:
      "STMicroelectronics (ST) manufactures MCUs, power discretes, sensors, and automotive-grade semiconductors. Browse US in-stock STM32, regulators, and interface ICs from verified suppliers.",
    website: "https://www.st.com",
    productFamilies: ["STM32 MCUs", "L78xx regulators", "LM358", "VNH motor drivers", "MEMS sensors"],
  },
  {
    slug: "on-semiconductor",
    name: "ON Semiconductor",
    searchTerm: "ON Semiconductor",
    aliases: ["ON Semiconductor", "ONSEMI", "onsemi", "Fairchild", "Fairchild Semiconductor"],
    description:
      "onsemi (ON Semiconductor) provides power, sensing, and analog solutions for automotive, industrial, and computing. Source ON Semi and Fairchild legacy parts from US inventory on USParts.",
    website: "https://www.onsemi.com",
    productFamilies: ["NCP regulators", "FAN drivers", "MOSFETs", "image sensors", "logic"],
  },
  {
    slug: "nxp",
    name: "NXP",
    searchTerm: "NXP",
    aliases: ["NXP", "NXP Semiconductors", "Freescale", "Freescale Semiconductor"],
    description:
      "NXP Semiconductors offers automotive, industrial, and IoT chips — including legacy Freescale MCUs and interfaces. Compare US supplier stock for NXP parts by MPN on USParts.",
    website: "https://www.nxp.com",
    productFamilies: ["Kinetis MCUs", "LPC ARM", "CAN transceivers", "i.MX applications processors", "RFID"],
  },
  {
    slug: "infineon",
    name: "Infineon",
    searchTerm: "Infineon",
    aliases: ["Infineon", "Infineon Technologies", "Cypress", "International Rectifier", "IR"],
    description:
      "Infineon Technologies is a major supplier of power semiconductors, MCUs, and automotive chips. Search surplus Infineon, Cypress, and IR inventory from US distributors on USParts.",
    website: "https://www.infineon.com",
    productFamilies: ["CoolMOS", "AURIX MCUs", "IR MOSFETs", "Cypress USB", "XMC MCUs"],
  },
  {
    slug: "vishay",
    name: "Vishay",
    searchTerm: "Vishay",
    aliases: ["Vishay", "Vishay Intertechnology", "Siliconix"],
    description:
      "Vishay Intertechnology manufactures discrete semiconductors, passives, and optoelectronics. Find Vishay resistors, diodes, MOSFETs, and sensors in US supplier listings.",
    website: "https://www.vishay.com",
    productFamilies: ["Si MOSFETs", "TVS diodes", "thin-film resistors", "optoisolators", "inductors"],
  },
  {
    slug: "intel",
    name: "Intel",
    searchTerm: "Intel",
    aliases: ["Intel", "Altera"],
    description:
      "Intel supplies processors, FPGAs (Altera), and networking silicon. Search US surplus Intel and Altera programmable logic, chipsets, and embedded parts on USParts.",
    website: "https://www.intel.com",
    productFamilies: ["Core processors", "Altera FPGAs", "Cyclone", "Stratix", "embedded controllers"],
  },
  {
    slug: "amd",
    name: "AMD",
    searchTerm: "AMD",
    aliases: ["AMD", "Advanced Micro Devices", "Xilinx"],
    description:
      "AMD designs high-performance CPUs, GPUs, and adaptive SoCs — including Xilinx FPGAs. Compare US supplier stock for AMD and Xilinx parts by MPN.",
    website: "https://www.amd.com",
    productFamilies: ["Ryzen", "EPYC", "Xilinx FPGAs", "Artix", "Spartan", "Virtex"],
  },
  {
    slug: "micron",
    name: "Micron",
    searchTerm: "Micron",
    aliases: ["Micron", "Micron Technology", "Crucial"],
    description:
      "Micron Technology is a leading memory manufacturer — DRAM, NAND flash, and NOR. Source Micron memory ICs and modules from US surplus inventory on USParts.",
    website: "https://www.micron.com",
    productFamilies: ["DDR SDRAM", "NAND flash", "NOR flash", "eMMC", "SSDs"],
  },
  {
    slug: "rohm",
    name: "ROHM",
    searchTerm: "ROHM",
    aliases: ["ROHM", "Rohm Semiconductor"],
    description:
      "ROHM Semiconductor provides power, analog, and sensor ICs plus discrete components. Browse US in-stock ROHM regulators, LED drivers, and MOSFETs.",
    website: "https://www.rohm.com",
    productFamilies: ["BD regulators", "LED drivers", "MOSFETs", "audio ICs", "sensor modules"],
  },
];

const profileBySlug = new Map(
  MANUFACTURER_PROFILES.map((profile) => [profile.slug, profile]),
);

export function getManufacturerProfile(slug: string): ManufacturerProfile | null {
  return profileBySlug.get(slug.trim().toLowerCase()) ?? null;
}

export function getAllManufacturerProfiles(): ManufacturerProfile[] {
  return MANUFACTURER_PROFILES;
}

export function getManufacturerPagePath(slug: string): string {
  return `/manufacturers/${encodeURIComponent(slug.trim().toLowerCase())}`;
}

export function getManufacturerSearchPath(profile: ManufacturerProfile): string {
  return `/search?manufacturer=${encodeURIComponent(profile.searchTerm)}`;
}
