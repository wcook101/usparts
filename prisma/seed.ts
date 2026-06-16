import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { createPrismaClient } from "../src/lib/db";

const db: PrismaClient = createPrismaClient();

async function main() {
  await db.partListing.deleteMany();
  await db.inventoryLocation.deleteMany();
  await db.company.deleteMany();

  const apex = await db.company.create({
    data: {
      name: "Apex Components",
      slug: "apex-components",
      email: "sales@apexcomponents.example",
      emailDomain: "apexcomponents.example",
      description:
        "Authorized distributor for semiconductors, passives, and industrial ICs.",
      website: "https://example.com",
      phone: "(555) 201-4400",
      city: "Austin",
      state: "TX",
      country: "US",
      inventoryLocations: {
        create: [
          { label: "Main warehouse", city: "Austin", state: "TX", country: "US" },
        ],
      },
    },
    include: { inventoryLocations: true },
  });

  const midwest = await db.company.create({
    data: {
      name: "Midwest Surplus Electronics",
      slug: "midwest-surplus-electronics",
      email: "inventory@midwestsurplus.example",
      emailDomain: "midwestsurplus.example",
      description:
        "Excess inventory and hard-to-find legacy parts for MRO and production support.",
      phone: "(555) 882-1190",
      city: "Chicago",
      state: "IL",
      country: "US",
      inventoryLocations: {
        create: [
          { label: "Chicago warehouse", city: "Chicago", state: "IL", country: "US" },
        ],
      },
    },
    include: { inventoryLocations: true },
  });

  const apexLocationId = apex.inventoryLocations[0].id;
  const midwestLocationId = midwest.inventoryLocations[0].id;

  await db.partListing.createMany({
    data: [
      {
        companyId: apex.id,
        inventoryLocationId: apexLocationId,
        mpn: "STM32F407VGT6",
        manufacturer: "STMicroelectronics",
        description:
          "32-bit ARM Cortex-M4 MCU, LQFP-100, 1MB Flash, industrial temperature range.",
        category: "INTEGRATED_CIRCUIT",
        quantity: 2400,
        price: 8.45,
        condition: "NEW",
        leadTimeDays: 3,
      },
      {
        companyId: apex.id,
        inventoryLocationId: apexLocationId,
        mpn: "LM358DR",
        manufacturer: "Texas Instruments",
        description: "Dual operational amplifier, SOIC-8, general-purpose signal conditioning.",
        category: "INTEGRATED_CIRCUIT",
        quantity: 18000,
        price: 0.19,
        condition: "NEW",
        leadTimeDays: 1,
      },
      {
        companyId: midwest.id,
        inventoryLocationId: midwestLocationId,
        mpn: "1N4148",
        manufacturer: "onsemi",
        description: "Small signal switching diode, DO-35, 100V reverse voltage.",
        category: "SEMICONDUCTOR",
        quantity: 50000,
        price: 0.03,
        condition: "NEW",
        leadTimeDays: 2,
      },
      {
        companyId: midwest.id,
        inventoryLocationId: midwestLocationId,
        mpn: "ESP32-WROOM-32E",
        manufacturer: "Espressif",
        description:
          "Wi-Fi + Bluetooth module with integrated antenna, suitable for IoT designs.",
        category: "RF_WIRELESS",
        quantity: 920,
        price: 3.75,
        condition: "NEW",
        leadTimeDays: 5,
      },
      {
        companyId: apex.id,
        inventoryLocationId: apexLocationId,
        mpn: "NE555P",
        manufacturer: "Texas Instruments",
        description: "Classic timer IC, PDIP-8, widely used in timing and oscillator circuits.",
        category: "INTEGRATED_CIRCUIT",
        quantity: 6400,
        price: 0.42,
        condition: "REFURBISHED",
        leadTimeDays: 4,
      },
      {
        companyId: midwest.id,
        inventoryLocationId: midwestLocationId,
        mpn: "CRCW080510K0FKEA",
        manufacturer: "Vishay",
        description: null,
        category: "PASSIVE",
        quantity: 120000,
        price: 0.008,
        condition: "NEW",
        leadTimeDays: 1,
      },
    ],
  });
}

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await db.$disconnect();
    process.exit(1);
  });
