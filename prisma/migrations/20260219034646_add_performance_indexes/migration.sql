-- CreateIndex
CREATE INDEX "subject_class_subjectId_year_semester_universityId_idx" ON "subject_class"("subjectId", "year", "semester", "universityId");

-- CreateIndex
CREATE INDEX "user_subject_userId_subjectClassId_idx" ON "user_subject"("userId", "subjectClassId");
