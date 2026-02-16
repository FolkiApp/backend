-- AlterTable
ALTER TABLE "post" ADD COLUMN     "parentId" INTEGER,
ADD COLUMN     "universityId" INTEGER,
ALTER COLUMN "commentsCount" SET DEFAULT 0;

-- CreateIndex
CREATE INDEX "post_universityId_idx" ON "post"("universityId");

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_universityId_fkey" FOREIGN KEY ("universityId") REFERENCES "university"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post" ADD CONSTRAINT "post_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "post"("id") ON DELETE CASCADE ON UPDATE CASCADE;
