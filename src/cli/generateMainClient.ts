import { PrismaClient } from "@prisma/client";

const privateKey = "MAIN_PRIVATE_API_KEY";
const publicKey = "MAIN_PUBLIC_API_KEY";

async function main() {
  const prisma = new PrismaClient();
  const fidoOptions = await prisma.fidoOptions.create({
    data: {
      cryptoParams: [-7, -257],
    },
  });
  await prisma.client.create({
    data: {
      email: "main@gmail.com",
      privateApiKey: privateKey,
      publicApiKey: publicKey,
      fidoOptionsId: fidoOptions.id,
    },
  });

  console.log("Main account created");
  console.log("Private key:");
  console.log(privateKey);
  console.log("Public key:");
  console.log(publicKey);

  prisma.$disconnect();
}

main();
