-- Replace the Internet Archive columns on lesson_videos with Vercel Blob storage.
--
-- Context: at the time of writing, all 7 rows in lesson_videos are FAILED
-- placeholders from the broken upload flow. None carried real Internet Archive
-- data (archiveUrl and directVideoUrl were empty strings on every row, and
-- archiveIdentifier held a generated `temp_...` value). They are deleted here
-- because blobUrl/blobPathname are NOT NULL and there is no value to backfill
-- them with -- these rows reference no stored object.
--
-- Verify before applying:
--   SELECT "uploadStatus", count(*) FROM lesson_videos GROUP BY 1;
--   SELECT count(*) FROM lesson_videos WHERE "archiveUrl" <> '';

DELETE FROM "lesson_videos";

-- DropIndex
DROP INDEX IF EXISTS "lesson_videos_archiveIdentifier_key";

-- AlterTable
ALTER TABLE "lesson_videos"
  DROP COLUMN "archiveIdentifier",
  DROP COLUMN "archiveUrl",
  DROP COLUMN "directVideoUrl",
  ADD COLUMN "blobUrl" TEXT NOT NULL,
  ADD COLUMN "blobPathname" TEXT NOT NULL;
