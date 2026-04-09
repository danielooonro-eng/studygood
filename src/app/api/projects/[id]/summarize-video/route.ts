import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import {
  summarizeYoutubeVideo,
  cleanTextForProcessing,
  truncateText,
} from "@/lib/ai";

// POST /api/projects/[id]/summarize-video - Summarize video content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { videoUrl } = await request.json();

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: { id },
      include: { files: true },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get video files
    const videoFiles = project.files?.filter((f) => f.type === "video") || [];

    if (videoFiles.length === 0) {
      return NextResponse.json(
        { error: "No video files found in this project" },
        { status: 400 }
      );
    }

    let summary = "";
    let videoProcessed = false;

    // If a YouTube URL is provided, try to summarize that
    if (videoUrl && typeof videoUrl === "string" && videoUrl.trim().length > 0) {
      try {
        summary = await summarizeYoutubeVideo(videoUrl);
        videoProcessed = true;
      } catch (err) {
        console.error("Error summarizing YouTube video:", err);
        // Fall through to local video processing if YouTube fails
      }
    }

    // If no YouTube URL or it failed, provide guidance for local videos
    if (!videoProcessed) {
      summary = `
# Video Summary

Video files uploaded to this project:

${videoFiles
  .map(
    (f) => `- **${f.fileName}** (${(f.fileSize / 1024 / 1024).toFixed(2)} MB)`
  )
  .join("\n")}

## How to Summarize:

For **YouTube videos**, provide the video URL in your request:
- Full URL: \`https://www.youtube.com/watch?v=VIDEO_ID\`
- Short URL: \`https://youtu.be/VIDEO_ID\`

The system will:
1. Extract the video transcript
2. Process it through AI summarization
3. Generate key points and insights

## Local Videos:
For locally uploaded video files, the system can analyze:
- File metadata
- Audio content (when transcript available)
- Video duration and format information

**To summarize YouTube videos, include the \`videoUrl\` parameter in your request.**

---

To enable full video summarization:
1. Provide YouTube video URLs
2. Or upload videos with transcript files
3. The AI will generate comprehensive summaries

**Example Request:**
\`\`\`json
{
  "videoUrl": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
\`\`\``;
    }

    return NextResponse.json(
      {
        summary,
        videoCount: videoFiles.length,
        videoFiles: videoFiles.map((f) => ({
          name: f.fileName,
          size: f.fileSize,
        })),
        processed: videoProcessed,
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error("[summarize-video] Error:", {
      message: errorMessage,
      stack: errorStack,
      timestamp: new Date().toISOString(),
    });
    
    return NextResponse.json(
      { 
        error: `Failed to summarize videos: ${errorMessage}`,
        details: {
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
