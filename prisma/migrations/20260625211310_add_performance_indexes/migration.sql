-- CreateTable
CREATE TABLE "notification" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification" (
    "notificationId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,

    CONSTRAINT "user_notification_pkey" PRIMARY KEY ("notificationId","userId")
);

-- CreateIndex
CREATE INDEX "user_notification_notificationId_idx" ON "user_notification"("notificationId");

-- CreateIndex
CREATE INDEX "user_notification_userId_idx" ON "user_notification"("userId");

-- CreateIndex
CREATE INDEX "activity_subjectClassId_type_finishDate_idx" ON "activity"("subjectClassId", "type", "finishDate");

-- CreateIndex
CREATE INDEX "activity_finishDate_deletedAt_idx" ON "activity"("finishDate", "deletedAt");

-- CreateIndex
CREATE INDEX "course_universityId_name_idx" ON "course"("universityId", "name");

-- CreateIndex
CREATE INDEX "post_parentId_idx" ON "post"("parentId");

-- CreateIndex
CREATE INDEX "subject_class_universityId_year_semester_idx" ON "subject_class"("universityId", "year" DESC, "semester" DESC);

-- CreateIndex
CREATE INDEX "user_absence_userId_date_idx" ON "user_absence"("userId", "date" DESC);

-- CreateIndex
CREATE INDEX "user_subject_subjectClassId_deletedAt_idx" ON "user_subject"("subjectClassId", "deletedAt");

-- AddForeignKey
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "notification"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notification" ADD CONSTRAINT "user_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
