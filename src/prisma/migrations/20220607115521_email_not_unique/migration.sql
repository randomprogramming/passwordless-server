/*
  Warnings:

  - A unique constraint covering the columns `[email,clientId]` on the table `Account` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Account_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "Account_email_clientId_key" ON "Account"("email", "clientId");
