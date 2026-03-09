/*
  Warnings:

  - You are about to drop the column `category` on the `participants` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `tournaments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "matches" ADD COLUMN     "arm" TEXT,
ADD COLUMN     "bestOf" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "resultType" TEXT,
ADD COLUMN     "seriesResults" TEXT;

-- AlterTable
ALTER TABLE "participants" DROP COLUMN "category",
ADD COLUMN     "categoryId" TEXT,
ADD COLUMN     "weight" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "tournaments" DROP COLUMN "category",
ADD COLUMN     "bestOf" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weightClass" TEXT,
    "arm" TEXT NOT NULL DEFAULT 'right',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tournamentId" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "tournaments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
