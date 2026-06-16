import "dotenv/config";
import { hashPassword, linkUnownedCompanyByEmail } from "../src/lib/auth";
import { db } from "../src/lib/db";

async function main() {
  const [userEmail, companyId] = process.argv.slice(2);

  if (userEmail && companyId) {
    const password = process.env.LINK_USER_PASSWORD;
    let user = await db.user.findUnique({
      where: { email: userEmail.toLowerCase() },
    });

    if (!user) {
      if (!password || password.length < 8) {
        console.error(
          "User not found. Set LINK_USER_PASSWORD (8+ chars) to create the account.",
        );
        process.exit(1);
      }

      user = await db.user.create({
        data: {
          email: userEmail.toLowerCase(),
          passwordHash: await hashPassword(password),
        },
      });
      console.log(`Created user ${user.email}`);
    }

    const linked = await linkUnownedCompanyByEmail(user.id, user.email);
    if (linked && linked.id === companyId) {
      console.log(`Linked ${linked.name} to ${user.email}`);
      return;
    }

    const company = await db.company.findUnique({ where: { id: companyId } });
    if (!company) {
      console.error(`Company not found: ${companyId}`);
      process.exit(1);
    }

    if (company.ownerId && company.ownerId !== user.id) {
      console.error("Company is already linked to another user.");
      process.exit(1);
    }

    await db.company.update({
      where: { id: companyId },
      data: {
        ownerId: user.id,
        emailDomain: company.email.split("@")[1]?.toLowerCase() ?? company.emailDomain,
      },
    });

    await linkUnownedCompanyByEmail(user.id, user.email);

    console.log(`Linked ${company.name} to ${user.email}`);
    return;
  }

  const unowned = await db.company.findMany({
    where: { ownerId: null },
    select: { id: true, name: true, email: true },
  });

  let linkedCount = 0;

  for (const company of unowned) {
    const user = await db.user.findFirst({
      where: { email: { equals: company.email, mode: "insensitive" } },
    });

    if (!user) continue;

    const existing = await db.company.findUnique({
      where: { ownerId: user.id },
    });

    if (existing) continue;

    await db.company.update({
      where: { id: company.id },
      data: { ownerId: user.id },
    });

    console.log(`Linked ${company.name} -> ${user.email}`);
    linkedCount += 1;
  }

  console.log(`Done. Linked ${linkedCount} companies by matching email.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
