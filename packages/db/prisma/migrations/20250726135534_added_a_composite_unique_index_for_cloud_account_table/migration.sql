/*
  Warnings:

  - A unique constraint covering the columns `[userId,provider,email]` on the table `CloudAccount` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "CloudAccount_userId_provider_email_key" ON "CloudAccount"("userId", "provider", "email");
