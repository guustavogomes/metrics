import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PUBLICATIONS_ARRAY } from "../lib/constants/publications";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting seed...");

  // Criar usuário admin padrão
  const adminEmail = "admin@metrics.com";
  const adminPassword = "admin123";

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!adminUser) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        name: "Admin",
        password: hashedPassword,
      },
    });
    console.log("✅ Admin user created:", adminEmail);
  } else {
    console.log("ℹ️  Admin user already exists");
  }

  // Cadastrar publicações
  console.log("\n📚 Seeding publications...");

  for (const pub of PUBLICATIONS_ARRAY) {
    const existing = await prisma.publication.findUnique({
      where: { beehiivId: pub.id },
    });

    if (!existing) {
      await prisma.publication.create({
        data: {
          beehiivId: pub.id,
          name: pub.name,
          description: `Newsletter ${pub.name}`,
          userId: adminUser.id,
        },
      });
      console.log(`  ✅ Created: ${pub.name}`);
    } else {
      console.log(`  ℹ️  Already exists: ${pub.name}`);
    }
  }

  console.log("\n🎉 Seed completed successfully!");
  console.log(`\nAdmin credentials:\n  Email: ${adminEmail}\n  Password: ${adminPassword}`);
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
