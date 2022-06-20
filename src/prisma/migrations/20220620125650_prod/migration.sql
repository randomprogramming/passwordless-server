-- AlterTable
ALTER TABLE "Authenticator" ALTER COLUMN "verificationTokenValidUntil" SET DEFAULT NOW() + interval '1 hour';
