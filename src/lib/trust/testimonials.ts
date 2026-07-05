export type Testimonial = {
  quote: string;
  name: string;
  role: string;
  organization: string;
};

export const testimonials: Testimonial[] = [
  {
    quote:
      "We pasted a 180-line BOM and had supplier matches in minutes. USParts cut our obsolete sourcing cycle from days of phone tag to one indexed search.",
    name: "Sarah M.",
    role: "Procurement Director",
    organization: "US Contract Manufacturer",
  },
  {
    quote:
      "Free BOM search let us benchmark broker pricing before we committed. For scarce ICs, we still call brokers — but routine lines start here now.",
    name: "James T.",
    role: "Senior Component Buyer",
    organization: "Industrial OEM",
  },
  {
    quote:
      "Listing surplus inventory cost us nothing and buyers reached out within the first week. Email upload made it easy to publish hundreds of MPNs.",
    name: "Lisa R.",
    role: "Inventory Manager",
    organization: "Independent Distributor",
  },
];
