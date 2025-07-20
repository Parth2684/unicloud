-- CreateEnum
CREATE TYPE "CloudProvider" AS ENUM ('GOOGLE', 'MEGA', 'DROPBOX', 'ONEDRIVE');

-- CreateEnum
CREATE TYPE "QuotaPlanType" AS ENUM ('FREE', 'BRONZE', 'SILVER', 'GOLD', 'DIAMOND');

-- CreateEnum
CREATE TYPE "OperationType" AS ENUM ('COPY', 'MOVE', 'TORRENT', 'DIRECT_LINK');

-- CreateEnum
CREATE TYPE "StatusType" AS ENUM ('Processing', 'Successful', 'Failed');

-- CreateTable
CREATE TABLE "CloudAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "provider" "CloudProvider" NOT NULL,

    CONSTRAINT "CloudAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addOnQuota" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usedQuota" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingQuota" DOUBLE PRECISION NOT NULL,
    "freeQuota" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "quotaType" "QuotaPlanType" NOT NULL DEFAULT 'FREE',

    CONSTRAINT "Quota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sourceCloudId" TEXT,
    "targetCloudId" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" DOUBLE PRECISION NOT NULL,
    "errorMesage" TEXT,
    "sourceLink" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "operation" "OperationType" NOT NULL,
    "status" "StatusType" NOT NULL DEFAULT 'Processing',

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quota_userId_key" ON "Quota"("userId");

-- AddForeignKey
ALTER TABLE "CloudAccount" ADD CONSTRAINT "CloudAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quota" ADD CONSTRAINT "Quota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
