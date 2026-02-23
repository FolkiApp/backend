/*
  Warnings:

  - You are about to drop the `PostImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "PostImage" DROP CONSTRAINT "PostImage_postId_fkey";

-- DropTable
DROP TABLE "PostImage";

-- CreateTable
CREATE TABLE "post_image" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "postId" INTEGER NOT NULL,

    CONSTRAINT "post_image_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "post_image_key_key" ON "post_image"("key");

-- AddForeignKey
ALTER TABLE "post_image" ADD CONSTRAINT "post_image_postId_fkey" FOREIGN KEY ("postId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
