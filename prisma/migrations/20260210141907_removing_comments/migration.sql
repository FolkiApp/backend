/*
  Warnings:

  - You are about to drop the column `parentPostId` on the `post` table. All the data in the column will be lost.
  - Added the required column `commentsCount` to the `post` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "post" DROP CONSTRAINT "post_parentPostId_fkey";

-- DropIndex
DROP INDEX "post_parentPostId_idx";

-- DropIndex
DROP INDEX "post_userId_idx";

-- AlterTable
ALTER TABLE "post" DROP COLUMN "parentPostId",
ADD COLUMN     "commentsCount" INTEGER NOT NULL;
