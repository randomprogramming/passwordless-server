/*
  Warnings:

  - A unique constraint covering the columns `[verificationToken,accountId]` on the table `Authenticator` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Authenticator" ADD COLUMN     "verificationToken" TEXT,
ADD COLUMN     "verificationTokenValidUntil" TIMESTAMP(3) DEFAULT NOW() + interval '1 hour';

-- CreateIndex
CREATE UNIQUE INDEX "Authenticator_verificationToken_accountId_key" ON "Authenticator"("verificationToken", "accountId");
