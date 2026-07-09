import { z } from "zod";
import { isValidWebsiteUrl, normalizeWebsiteUrl } from "@/lib/format";
import { MAX_IMPORT_ROWS } from "@/lib/import-limits";

const optionalWebsiteField = z
  .string()
  .trim()
  .optional()
  .transform((value) => normalizeWebsiteUrl(value ?? ""))
  .refine(isValidWebsiteUrl, {
    message: "Enter a valid website address (e.g. aplusindustry.com)",
  });

export const searchQuerySchema = z.object({
  q: z.string().trim().optional(),
  manufacturer: z.string().trim().optional(),
  category: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const MAX_BULK_SEARCH_PARTS = 500;
export const MAX_BULK_RFQ_LISTINGS = 100;
export const BULK_RFQ_COOLDOWN_MINUTES = 15;
export const BULK_RFQ_COOLDOWN_MS = BULK_RFQ_COOLDOWN_MINUTES * 60 * 1000;

export const bulkSearchSchema = z.object({
  mpns: z.string().trim().min(1).max(50_000),
  manufacturer: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

export const smartSearchSchema = z.object({
  query: z.string().trim().min(2).max(500),
  supplyVoltage: z.string().trim().max(80).optional(),
  channels: z.string().trim().max(40).optional(),
  packageType: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(120).optional(),
  notes: z.string().trim().max(300).optional(),
  category: z.string().trim().optional(),
});

export type SmartSearchInput = z.infer<typeof smartSearchSchema>;

export const createListingSchema = z.object({
  companyId: z.string().min(1).optional(),
  mpn: z.string().trim().min(1).max(120),
  manufacturer: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z.enum([
    "SEMICONDUCTOR",
    "PASSIVE",
    "CONNECTOR",
    "INTEGRATED_CIRCUIT",
    "POWER",
    "SENSOR",
    "MEMORY",
    "DISPLAY",
    "RF_WIRELESS",
    "OTHER",
  ]),
  quantity: z.coerce.number().int().min(0),
  price: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().positive().optional(),
  ),
  currency: z.string().trim().length(3).default("USD"),
  condition: z.enum(["NEW", "REFURBISHED", "USED"]).default("NEW"),
  dateCode: z.string().trim().max(40).optional().or(z.literal("")),
  leadTimeDays: z.coerce.number().int().min(0).optional(),
  inventoryLocationId: z.string().trim().min(1),
  datasheetUrl: optionalWebsiteField,
});

const inventoryLocationSchema = z.object({
  label: z.string().trim().max(80).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().min(1).max(80).default("US"),
});

export const createCompanySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .transform((value) => (value === "" ? undefined : value))
    .pipe(z.string().email().optional()),
  description: z.string().trim().max(2000).optional(),
  website: optionalWebsiteField,
  phone: z.string().trim().max(40).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().max(40).optional(),
  country: z.string().trim().max(80).default("US"),
  inventoryLocations: z
    .array(inventoryLocationSchema)
    .min(1, "Add at least one inventory storage location"),
});

/** Admin creates a supplier company on their behalf (email required). */
export const adminCreateCompanySchema = createCompanySchema
  .omit({ email: true })
  .extend({
    email: z.string().trim().email(),
    ownerEmail: z
      .string()
      .trim()
      .transform((value) => (value === "" ? undefined : value))
      .pipe(z.string().email().optional()),
  });

export type SearchQuery = z.infer<typeof searchQuerySchema>;
export type BulkSearchInput = z.infer<typeof bulkSearchSchema>;
export type CreateListingInput = z.infer<typeof createListingSchema>;
export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type AdminCreateCompanyInput = z.infer<typeof adminCreateCompanySchema>;

export const createOrderSchema = z.object({
  listingId: z.string().min(1),
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email(),
  buyerCompany: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const importModeSchema = z.enum(["append", "replace"]);

export type ImportMode = z.infer<typeof importModeSchema>;

export const importInventoryRequestSchema = z.object({
  companyId: z.string().min(1).optional(),
  defaultInventoryLocationId: z.string().min(1),
  mode: importModeSchema.default("append"),
  columnMap: z.record(z.string(), z.string()).optional(),
  excludedColumns: z.array(z.string()).optional(),
  parts: z.array(z.record(z.string(), z.unknown())).min(1).max(MAX_IMPORT_ROWS),
});

export type ImportInventoryRequest = z.infer<typeof importInventoryRequestSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2).max(120).optional().or(z.literal("")),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
  inviteToken: z.string().trim().min(1).optional(),
  acceptedTerms: z.literal(true, {
    error: "You must agree to the Terms of Service and Privacy Policy",
  }),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1).max(128),
  inviteToken: z.string().trim().min(1).optional(),
});

export const createCompanyInviteSchema = z.object({
  email: z.string().trim().email(),
  role: z.enum(["ADMIN", "MEMBER"]).default("MEMBER"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export const createQuoteSchema = z.object({
  listingId: z.string().min(1),
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email(),
  buyerCompany: z.string().trim().max(120).optional().or(z.literal("")),
  quantity: z.coerce.number().int().min(1),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type CreateQuoteInput = z.infer<typeof createQuoteSchema>;

export const bulkRfqItemSchema = z.object({
  listingId: z.string().min(1),
  quantity: z.coerce.number().int().min(1),
});

export type BulkRfqItem = z.infer<typeof bulkRfqItemSchema>;

export const createBulkRfqSchema = z.object({
  items: z.array(bulkRfqItemSchema).min(1).max(MAX_BULK_RFQ_LISTINGS),
  buyerName: z.string().trim().min(2).max(120),
  buyerEmail: z.string().trim().email(),
  buyerCompany: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(1000).optional().or(z.literal("")),
  turnstileToken: z.string().trim().optional(),
  website: z.string().max(0).optional(),
});

export type CreateBulkRfqInput = z.infer<typeof createBulkRfqSchema>;

export const createPartAliasSchema = z.object({
  fromMpn: z.string().trim().min(1).max(120),
  toMpn: z.string().trim().min(1).max(120),
  manufacturer: z.string().trim().max(120).optional().or(z.literal("")),
  confidence: z.coerce.number().min(0).max(1).optional(),
});

export type CreatePartAliasInput = z.infer<typeof createPartAliasSchema>;

export const supplierOutreachStatusSchema = z.enum([
  "CONTACTED",
  "FOLLOW_UP",
  "REGISTERED",
  "INVENTORY_LIVE",
  "DECLINED",
  "ARCHIVED",
]);

export const createSupplierOutreachSchema = z.object({
  companyName: z.string().trim().min(1).max(120),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  website: optionalWebsiteField.optional(),
  status: supplierOutreachStatusSchema.optional(),
  contactedAt: z.string().datetime().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const updateSupplierOutreachSchema = z.object({
  companyName: z.string().trim().min(1).max(120).optional(),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  contactEmail: z.string().trim().email().optional().or(z.literal("")),
  website: optionalWebsiteField.optional(),
  status: supplierOutreachStatusSchema.optional(),
  contactedAt: z.string().datetime().optional(),
  lastFollowUpAt: z.string().datetime().nullable().optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  companyId: z.string().trim().min(1).nullable().optional(),
});

export type CreateSupplierOutreachInput = z.infer<typeof createSupplierOutreachSchema>;
export type UpdateSupplierOutreachInput = z.infer<typeof updateSupplierOutreachSchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(120),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8).max(128),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const orderStatusSchema = z.enum([
  "PENDING",
  "CONFIRMED",
  "CANCELLED",
  "FULFILLED",
]);

export const updateOrderStatusSchema = z.object({
  status: orderStatusSchema,
});

export const updateQuoteStatusSchema = z.object({
  status: orderStatusSchema,
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type UpdateQuoteStatusInput = z.infer<typeof updateQuoteStatusSchema>;

export const updateListingSchema = z.object({
  mpn: z.string().trim().min(1).max(120).optional(),
  manufacturer: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  category: z
    .enum([
      "SEMICONDUCTOR",
      "PASSIVE",
      "CONNECTOR",
      "INTEGRATED_CIRCUIT",
      "POWER",
      "SENSOR",
      "MEMORY",
      "DISPLAY",
      "RF_WIRELESS",
      "OTHER",
    ])
    .optional(),
  quantity: z.coerce.number().int().min(0).optional(),
  price: z.preprocess(
    (value) => (value === "" || value == null ? undefined : value),
    z.coerce.number().positive().optional().nullable(),
  ),
  currency: z.string().trim().length(3).optional(),
  condition: z.enum(["NEW", "REFURBISHED", "USED"]).optional(),
  dateCode: z.string().trim().max(40).optional().or(z.literal("")),
  leadTimeDays: z.coerce.number().int().min(0).optional().nullable(),
  inventoryLocationId: z.string().trim().min(1).optional(),
  datasheetUrl: optionalWebsiteField.optional(),
  isActive: z.boolean().optional(),
});

export type UpdateListingInput = z.infer<typeof updateListingSchema>;

export const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().optional(),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  website: optionalWebsiteField.optional(),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  state: z.string().trim().max(40).optional().or(z.literal("")),
  country: z.string().trim().max(80).optional(),
});

export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;

export const supportContactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  company: z.string().trim().max(120).optional().or(z.literal("")),
  message: z.string().trim().min(10).max(5000),
});

export type SupportContactInput = z.infer<typeof supportContactSchema>;
