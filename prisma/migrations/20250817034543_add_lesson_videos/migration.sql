-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('UPLOADING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "lesson_videos" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "archiveIdentifier" TEXT NOT NULL,
    "archiveUrl" TEXT NOT NULL,
    "directVideoUrl" TEXT NOT NULL,
    "fileSize" BIGINT NOT NULL,
    "duration" INTEGER,
    "uploadStatus" "UploadStatus" NOT NULL DEFAULT 'UPLOADING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_videos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lesson_videos_archiveIdentifier_key" ON "lesson_videos"("archiveIdentifier");

-- CreateIndex
CREATE INDEX "lesson_videos_lessonId_idx" ON "lesson_videos"("lessonId");

-- CreateIndex
CREATE INDEX "lesson_videos_authorId_idx" ON "lesson_videos"("authorId");

-- AddForeignKey
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_videos" ADD CONSTRAINT "lesson_videos_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
