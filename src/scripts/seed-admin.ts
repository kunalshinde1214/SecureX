import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = "kunalshinde1214@gmail.com";
  const passwordText = "Shinde@4431";

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (existingAdmin) {
    console.log(`Admin user ${adminEmail} already exists!`);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(passwordText, 10);

  // Create admin user
  await prisma.user.create({
    data: {
      email: adminEmail,
      name: "Super Admin",
      password: hashedPassword,
      role: "ADMIN"
    }
  });

  console.log(`Successfully seeded admin user: ${adminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
