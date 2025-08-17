import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import { spawn } from "child_process";
import { join } from "path";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  try {
    // Verify the lesson belongs to the teacher
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        videos: {
          where: { uploadStatus: 'COMPLETED' }
        }
      }
    });

    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    if (lesson.authorId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete videos from this lesson" }, { status: 403 });
    }

    if (lesson.videos.length === 0) {
      return NextResponse.json({ error: "No videos to delete" }, { status: 400 });
    }

    console.log(`🗑️ Starting bulk deletion of ${lesson.videos.length} videos for lesson ${lessonId}`);

    // STEP 1: Delete from Internet Archive (in parallel)
    const iaDeletePromises = lesson.videos.map(video => {
      return new Promise((resolve) => {
        console.log(`🗑️ Deleting from IA: ${video.archiveIdentifier}`);
        
        const deleteScript = join(process.cwd(), "scripts", "delete_from_ia.py");
        
        const pythonProcess = spawn("python", [
          deleteScript,
          "--identifier",
          video.archiveIdentifier
        ], {
          stdio: ["ignore", "pipe", "pipe"],
          shell: true,
        });

        pythonProcess.stdout?.on("data", (data) => {
          console.log(`IA Delete stdout: ${data.toString().trim()}`);
        });

        pythonProcess.stderr?.on("data", (data) => {
          console.error(`IA Delete stderr: ${data.toString().trim()}`);
        });

        pythonProcess.on("close", (code) => {
          if (code === 0) {
            console.log(`✅ Successfully deleted ${video.archiveIdentifier} from IA`);
          } else {
            console.error(`❌ Failed to delete ${video.archiveIdentifier} from IA (exit code: ${code})`);
          }
          resolve(code);
        });

        pythonProcess.on("error", (error) => {
          console.error(`❌ Error deleting ${video.archiveIdentifier} from IA:`, error);
          resolve(1);
        });
      });
    });

    // STEP 2: Delete from database (don't wait for IA deletion to complete)
    const deleteResult = await prisma.lessonVideo.deleteMany({
      where: {
        lessonId: lessonId,
        uploadStatus: 'COMPLETED'
      }
    });

    console.log(`✅ Deleted ${deleteResult.count} videos from database`);

    // Start IA deletion in background (don't await)
    Promise.all(iaDeletePromises).then(() => {
      console.log(`✅ Completed Internet Archive deletion for lesson ${lessonId}`);
    }).catch(error => {
      console.error(`❌ Some Internet Archive deletions failed:`, error);
    });

    return NextResponse.json({ 
      success: true, 
      deletedCount: deleteResult.count,
      message: `Successfully deleted ${deleteResult.count} videos from database. Internet Archive deletion in progress.`
    });

  } catch (error) {
    console.error("Error deleting all videos:", error);
    return NextResponse.json(
      { error: "Failed to delete videos" },
      { status: 500 }
    );
  }
}
