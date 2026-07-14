export type TopAccountSeed = {
  rank: number;
  companyName: string;
  website?: string | null;
};

/** Fixed Top 25 focus list for decision-maker research. */
export const TOP_ACCOUNT_SEEDS: TopAccountSeed[] = [
  { rank: 1, companyName: "Smith", website: "smith.com" },
  { rank: 2, companyName: "NewPower Worldwide", website: "newpower.com" },
  { rank: 3, companyName: "Rand Technology", website: "randtechnology.com" },
  { rank: 4, companyName: "Velocity Electronics" },
  { rank: 5, companyName: "Sourceability", website: "sourceability.com" },
  { rank: 6, companyName: "Classic Components Corporation" },
  { rank: 7, companyName: "A2 Global Electronics + Solutions", website: "a2global.com" },
  { rank: 8, companyName: "Direct Components" },
  { rank: 9, companyName: "Freedom USA" },
  { rank: 10, companyName: "C Plus Electronics" },
  { rank: 11, companyName: "CTrends" },
  { rank: 12, companyName: "Microchip USA" },
  { rank: 13, companyName: "Component Electronics Inc." },
  { rank: 14, companyName: "ASAP Semiconductor" },
  { rank: 15, companyName: "Megastar Electroniques Inc." },
  { rank: 16, companyName: "Abacus Technologies" },
  { rank: 17, companyName: "4 Star Electronics" },
  { rank: 18, companyName: "Eagle Technology Solutions" },
  { rank: 19, companyName: "Serendipity Electronics" },
  { rank: 20, companyName: "Electronic Expediters" },
  { rank: 21, companyName: "Chip Stock LLC" },
  { rank: 22, companyName: "NetSource Technology" },
  { rank: 23, companyName: "VRG Components, Inc" },
  { rank: 24, companyName: "Inland Empire Components, Inc." },
  { rank: 25, companyName: "Baxter Electronics" },
];
