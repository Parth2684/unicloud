/*
  Warnings:

  - Added the required column `email` to the `CloudAccount` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "CloudAccount" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;
