import { NextResponse } from "next/server";
import { isPlatformAdmin, requirePlatformAdmin } from "@/lib/admin";
import { AuthError } from "@/lib/auth/errors";
import { ensureOwnerMembership } from "@/lib/auth/membership";
import { normalizeEmail } from "@/lib/auth/ownership";
import { db } from "@/lib/db";
import { getEmailDomain } from "@/lib/email-domain";
import { slugify } from "@/lib/format";
import { adminCreateCompanySchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    await requirePlatformAdmin();

    const body = await request.json().catch(() => null);
    const parsed = adminCreateCompanySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid company data", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const companyEmail = normalizeEmail(data.email);
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

    let ownerId: string | null = null;
    const ownerLookupEmail = normalizeEmail(data.ownerEmail ?? data.email);

    if (isPlatformAdmin(ownerLookupEmail)) {
      return NextResponse.json(
        {
          error:
            "Platform admin accounts cannot own a supplier company. Use the supplier's email instead.",
        },
        { status: 400 },
      );
    }

    const existingUser = await db.user.findFirst({
      where: { email: { equals: ownerLookupEmail, mode: "insensitive" } },
    });

    if (existingUser) {
      const alreadyOwns = await db.company.findUnique({
        where: { ownerId: existingUser.id },
      });

      if (alreadyOwns) {
        return NextResponse.json(
          {
            error: `${existingUser.email} already owns ${alreadyOwns.name}. Leave owner blank or use a different account email.`,
          },
          { status: 409 },
        );
      }

      const membership = await db.companyMember.findFirst({
        where: { userId: existingUser.id },
        include: { company: true },
      });

      if (membership) {
        return NextResponse.json(
          {
            error: `${existingUser.email} is already on the ${membership.company.name} team.`,
          },
          { status: 409 },
        );
      }

      ownerId = existingUser.id;
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
        ownerId,
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

    if (ownerId) {
      await ensureOwnerMembership(ownerId, company);
    }

    return NextResponse.json(
      {
        company,
        ownerAssigned: Boolean(ownerId),
        ownerEmail: ownerId ? ownerLookupEmail : null,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error("Failed to create company as admin:", error);
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 500 },
    );
  }
}
