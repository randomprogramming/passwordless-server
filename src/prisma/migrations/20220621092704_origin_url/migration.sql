-- AlterTable
ALTER TABLE "Authenticator" ALTER COLUMN "verificationTokenValidUntil" SET DEFAULT NOW() + interval '1 hour';

-- AlterTable
ALTER TABLE "FidoOptions" ADD COLUMN     "origin" TEXT,
ADD COLUMN     "url" TEXT;
