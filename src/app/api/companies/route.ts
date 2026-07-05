import { NextResponse } from "next/server";
import { isPlatformAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { slugify } from "@/lib/format";
import { getEmailDomain } from "@/lib/email-domain";
import {
  authErrorResponse,
  ensureOwnerMembership,
  isAuthError,
  linkUnownedCompanyByEmail,
  requireAuth,
} from "@/lib/auth";
import { normalizeEmail } from "@/lib/auth/ownership";
import { createCompanySchema } from "@/lib/validations";

export async function GET() {
  const companies = await db.company.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { listings: { where: { isActive: true } } } },
    },
  });

  return NextResponse.json(companies);
}

export async function POST(request: Request) {
  try {
    const user = await requireAuth();
    const adminCreatingSupplier = isPlatformAdmin(user.email);

    if (!adminCreatingSupplier) {
      if (user.company) {
        return NextResponse.json(
          { error: "Your account already has a registered company" },
          { status: 409 },
        );
      }

      if (user.membership) {
        return NextResponse.json(
          {
            error: `Your account is already on the ${user.membership.company.name} team`,
          },
          { status: 409 },
        );
      }

      const existingUnowned = await linkUnownedCompanyByEmail(user.id, user.email);
      if (existingUnowned) {
        return NextResponse.json(existingUnowned, { status: 200 });
      }
    }

    const body = await request.json();
    const parsed = createCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid company data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const companyEmail = normalizeEmail(data.email ?? user.email);
    const emailDomain = getEmailDomain(companyEmail);

    if (!emailDomain) {
      return NextResponse.json(
        { error: "Enter a valid business email address" },
        { status: 400 },
      );
    }

    const emailTaken = await db.company.findFirst({
      where: { email: { equals: companyEmail, mode: "insensitive" } },
    });

    if (emailTaken) {
      return NextResponse.json(
        { error: "A company with this business email is already registered" },
        { status: 409 },
      );
    }

    const baseSlug = slugify(data.name);
    let slug = baseSlug;
    let suffix = 1;

    while (await db.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const primaryLocation = data.inventoryLocations[0];

    const company = await db.company.create({
      data: {
        ownerId: adminCreatingSupplier ? null : user.id,
        name: data.name,
        slug,
        email: companyEmail,
        emailDomain,
        description: data.description || null,
        website: data.website || null,
        phone: data.phone || null,
        city: data.city || primaryLocation.city,
        state: data.state || primaryLocation.state || null,
        country: data.country || primaryLocation.country,
        inventoryLocations: {
          create: data.inventoryLocations.map((location) => ({
            label: location.label || null,
            city: location.city,
            state: location.state || null,
            country: location.country,
          })),
        },
      },
      include: { inventoryLocations: true },
    });

    if (!adminCreatingSupplier) {
      await ensureOwnerMembership(user.id, company);
    }

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    if (isAuthError(error)) {
      return authErrorResponse(error);
    }

    console.error("Failed to create company:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 },
    );
  }
}
