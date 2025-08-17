import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/utils/authOptions";
import prisma from "@/lib/prisma";
import { spawn } from "child_process";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

export const maxSize = 750 * 1024 * 1024; // 750MB

// Environment-based logging
const isDevelopment = process.env.NODE_ENV === 'development';

const log = {
  debug: (msg: string) => isDevelopment && console.log(msg),
  info: (msg: string) => console.log(msg),
  error: (msg: string) => console.error(msg)
};

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: lessonId } = await params;

  const data = await req.formData();
  const file = data.get("file") as File;
  const title = String(data.get("title") || "");
  const description = String(data.get("description") || "");

  // Essential validation logging
  log.info(`📤 Starting video upload: ${file?.name} (${Math.round((file?.size || 0) / 1024 / 1024)}MB)`);

  if (!file || file.type !== "video/mp4") {
    return NextResponse.json({ error: "Only MP4 allowed." }, { status: 400 });
  }
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: "File must be less than 750MB." },
      { status: 400 }
    );
  }
  if (!title.trim()) {
    return NextResponse.json({ error: "Title required." }, { status: 400 });
  }

  try {
    // Get system temp directory (cross-platform)
    const tempDir = tmpdir();

    // Ensure temp directory exists
    if (!existsSync(tempDir)) {
      mkdirSync(tempDir, { recursive: true });
    }

    // Create file path using proper path joining - sanitize filename more aggressively
    const fileName = `${Date.now()}_${file.name.replace(
      /[^a-zA-Z0-9.-]/g,
      "_"
    )}`;
    const tmpPath = join(tempDir, fileName);

    // Write file to temp directory
    const buffer = Buffer.from(await file.arrayBuffer());
    writeFileSync(tmpPath, buffer);

    log.debug(`✅ File saved to: ${tmpPath}`);

    // Save DB entry as UPLOADING first
    const video = await prisma.lessonVideo.create({
      data: {
        lessonId,
        authorId: session.user.id,
        title,
        description,
        fileSize: BigInt(file.size),
        uploadStatus: "UPLOADING",
        archiveIdentifier: `temp_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}`,
        archiveUrl: "",
        directVideoUrl: "",
      },
    });

    log.info(`📝 Video record created: ${video.id}`);

    // Try to run Python script with better error handling
    try {
      // Multiple Python command attempts for better compatibility
      const pythonCommands = process.platform === "win32" 
        ? ["python", "py", "python3"] 
        : ["python3", "python"];

      let pythonProcess;
      let commandFound = false;
      let stderrData = '';

      for (const pythonCmd of pythonCommands) {
        try {
          // Properly escape arguments for Windows shell
          const escapedTmpPath = process.platform === "win32" 
            ? `"${tmpPath}"` 
            : tmpPath;
          
          const escapedTitle = process.platform === "win32"
            ? `"${title.replace(/"/g, '\\"')}"` // Escape quotes in title
            : title;
            
          const escapedDescription = process.platform === "win32"
            ? `"${description.replace(/"/g, '\\"')}"` // Escape quotes in description
            : description;

          const args = [
            join(process.cwd(), "scripts", "upload_to_ia.py"),
            "--filepath",
            escapedTmpPath,
            "--videoid",
            video.id,
            "--title",
            escapedTitle,
            "--description",
            escapedDescription,
          ];

          log.debug(`🐍 Starting Python upload with: ${pythonCmd}`);

          pythonProcess = spawn(pythonCmd, args, {
            detached: true,
            stdio: ["ignore", "pipe", "pipe"],
            shell: true, // Required for proper quote handling on Windows
            env: {
              ...process.env,
              NODE_ENV: process.env.NODE_ENV, // Pass environment to Python
            }
          });

          commandFound = true;
          log.info(`🚀 Upload process started for video: ${video.id}`);
          break;
        } catch (cmdError) {
          log.debug(`❌ Failed to start with ${pythonCmd}: ${cmdError instanceof Error ? cmdError.message : String(cmdError)}`);
          continue;
        }
      }

      if (!commandFound || !pythonProcess) {
        throw new Error("No Python command found. Please install Python and add it to PATH.");
      }

      // Collect stderr for error reporting (but not stdout to reduce noise)
      pythonProcess.stderr?.on("data", (data) => {
        const error = data.toString().trim();
        stderrData += error + '\n';
        // Only log critical errors in production
        if (!isDevelopment && (error.includes('ERROR') || error.includes('FAILED'))) {
          log.error(`🐍 Upload Error: ${error}`);
        }
      });

      pythonProcess.on("close", (code) => {
        log.debug(`🐍 Python script exited with code: ${code}`);
        
        // FIXED: Handle exit code 120 as success (it's a cleanup issue, not a failure)
        if (code !== 0 && code !== 120) {
          log.error(`❌ Upload failed for video ${video.id}: exit code ${code}`);
          
          // Extract specific error types from stderr
          let errorType = "Upload failed";
          if (stderrData.includes("Authentication")) {
            errorType = "Internet Archive authentication failed";
          } else if (stderrData.includes("ConnectionError")) {
            errorType = "Network connection error";
          } else if (stderrData.includes("ModuleNotFoundError")) {
            errorType = "Missing Python module";
          }
          
          log.error(`❌ Error type: ${errorType}`);
          
          prisma.lessonVideo
            .update({
              where: { id: video.id },
              data: { uploadStatus: "FAILED" },
            })
            .catch(console.error);
        } else if (code === 120) {
          log.info(`✅ Upload completed for video ${video.id} (exit code 120 - cleanup issue)`);
        } else {
          log.info(`✅ Upload completed successfully for video ${video.id}`);
        }
      });

      pythonProcess.on("error", (error) => {
        log.error(`❌ Failed to start upload process for video ${video.id}: ${error.message}`);
        
        // Update video status to FAILED
        prisma.lessonVideo
          .update({
            where: { id: video.id },
            data: { uploadStatus: "FAILED" },
          })
          .catch(console.error);
      });

    } catch (scriptError) {
      log.error(`❌ Error spawning Python script: ${scriptError}`);

      // Update video status to FAILED
      await prisma.lessonVideo.update({
        where: { id: video.id },
        data: { uploadStatus: "FAILED" },
      });

      return NextResponse.json(
        { 
          error: "Failed to start upload process. Please ensure Python is installed and accessible.",
          details: scriptError instanceof Error ? scriptError.message : String(scriptError)
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, videoId: video.id });
  } catch (error) {
    log.error(`❌ Upload error: ${error}`);
    return NextResponse.json(
      { error: "Failed to process upload" },
      { status: 500 }
    );
  }
}
