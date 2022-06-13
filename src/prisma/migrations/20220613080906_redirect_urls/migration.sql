-- AlterTable
ALTER TABLE "Authenticator" ALTER COLUMN "verificationTokenValidUntil" SET DEFAULT NOW() + interval '1 hour';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "authenticatorAddedRedirectUrl" TEXT,
ADD COLUMN     "authenticatorFailedRedirectUrl" TEXT;
