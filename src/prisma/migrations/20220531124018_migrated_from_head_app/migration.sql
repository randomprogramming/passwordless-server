/*
  Warnings:

  - Added the required column `clientId` to the `Account` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttestationTypeEnum" AS ENUM ('direct', 'indirect', 'none');

-- CreateEnum
CREATE TYPE "UserVerificationTypeEnum" AS ENUM ('required', 'preferred', 'discouraged');

-- AlterTable
ALTER TABLE "Account" ADD COLUMN     "clientId" TEXT NOT NULL,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "FidoOptions" (
    "id" TEXT NOT NULL,
    "attestation" "AttestationTypeEnum" NOT NULL DEFAULT E'direct',
    "authenticatorAttachment" TEXT,
    "authenticatorRequireResidentKey" BOOLEAN,
    "authenticatorUserVerification" "UserVerificationTypeEnum",
    "challengeSize" INTEGER NOT NULL DEFAULT 64,
    "cryptoParams" INTEGER[],
    "rpIcon" TEXT,
    "rpId" TEXT,
    "rpName" TEXT,
    "timeout" INTEGER NOT NULL DEFAULT 60000,

    CONSTRAINT "FidoOptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "fidoOptionsId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "roles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicApiKey" TEXT NOT NULL,
    "privateApiKey" TEXT NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Client_fidoOptionsId_key" ON "Client"("fidoOptionsId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_email_key" ON "Client"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Client_publicApiKey_key" ON "Client"("publicApiKey");

-- CreateIndex
CREATE UNIQUE INDEX "Client_privateApiKey_key" ON "Client"("privateApiKey");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_fidoOptionsId_fkey" FOREIGN KEY ("fidoOptionsId") REFERENCES "FidoOptions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
