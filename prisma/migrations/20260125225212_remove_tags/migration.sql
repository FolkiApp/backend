/*
  Warnings:

  - You are about to drop the `postTag` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `tags` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "postTag" DROP CONSTRAINT "postTag_postId_fkey";

-- DropForeignKey
ALTER TABLE "postTag" DROP CONSTRAINT "postTag_tagId_fkey";

-- DropTable
DROP TABLE "postTag";

-- DropTable
DROP TABLE "tags";
