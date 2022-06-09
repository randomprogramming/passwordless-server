/*
  Warnings:

  - You are about to drop the column `authCounter` on the `Account` table. All the data in the column will be lost.
  - You are about to drop the column `credentialPublicKey` on the `Account` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Account" DROP COLUMN "authCounter",
DROP COLUMN "credentialPublicKey";

-- AlterTable
ALTER TABLE "FidoOptions" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Authenticator" (
    "id" TEXT NOT NULL,
    "credentialId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "transports" TEXT[],
    "credentialPublicKey" TEXT NOT NULL,
    "authCounter" INTEGER NOT NULL DEFAULT 0,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Authenticator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_credentialId_accountId_key" ON "Authenticator"("credentialId", "accountId");

-- AddForeignKey
ALTER TABLE "Authenticator" ADD CONSTRAINT "Authenticator_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
