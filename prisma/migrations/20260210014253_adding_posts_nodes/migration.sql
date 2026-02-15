/*
  Warnings:

  - You are about to drop the column `commentsCount` on the `post` table. All the data in the column will be lost.
  - You are about to drop the `comment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_postId_fkey";

-- DropForeignKey
ALTER TABLE "comment" DROP CONSTRAINT "comment_userId_fkey";

-- AlterTable
ALTER TABLE "post" DROP COLUMN "commentsCount",
ADD COLUMN     "parentPostId" INTEGER;

-- DropTable
DROP TABLE "comment";

-- CreateIndex
CREATE INDEX "post_userId_idx" ON "post"("userId");

-- CreateIndex
CREATE INDEX "post_parentPostId_idx" ON "post"("parentPostId");

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_parentPostId_fkey" FOREIGN KEY ("parentPostId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
