import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Database...");

  const passHash = await bcrypt.hash("Adm@123", 10);

  const user = await prisma.user.create({

    data: {
      name: "adm",
      email: "adm@gmail.com",
      password: passHash,
      phone: "16992455837",
      permission: true
    }
  });

  console.log("User created:", user);
  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
