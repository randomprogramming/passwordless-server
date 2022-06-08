/*
  Warnings:

  - Made the column `authenticatorUserVerification` on table `FidoOptions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "FidoOptions" ALTER COLUMN "authenticatorUserVerification" SET NOT NULL,
ALTER COLUMN "authenticatorUserVerification" SET DEFAULT E'preferred';
