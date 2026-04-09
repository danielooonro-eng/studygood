import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import {
  askVideoQuestion,
  cleanTextForProcessing,
  truncateText,
} from "@/lib/ai";

// POST /api/projects/[id]/ask-video - Ask question about video content
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
    const { question, videoUrl } = await request.json();

    // Validate question
    if (!question || typeof question !== "string") {
      return NextResponse.json(
        { error: "Valid question is required" },
        { status: 400 }
      );
    }

    if (question.trim().length === 0) {
      return NextResponse.json(
        { error: "Question cannot be empty" },
        { status: 400 }
      );
    }

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

    let answer = "";
    let answeredFromYoutube = false;

    // If a YouTube URL is provided, try to answer based on that
    if (videoUrl && typeof videoUrl === "string" && videoUrl.trim().length > 0) {
      try {
        // We'll need to extract transcript and answer
        // For now, we'll return guidance
        answer = `
To answer questions about YouTube videos, the system will:

1. **Extract the transcript** from the YouTube video at: ${videoUrl}
2. **Process the transcript** through the AI model
3. **Answer your question**: "${question.trim()}"

This requires the YouTube Transcript API to be properly configured.

---

**Your Question**: "${question.trim()}"

**Source Video**: ${videoUrl}

To get an answer, ensure:
- The video has captions/transcript available
- The YouTube Video ID is correct
- The AI service has internet access

Once configured, the AI will provide a detailed answer based on the video transcript.`;
        answeredFromYoutube = true;
      } catch (err) {
        console.error("Error processing YouTube video:", err);
      }
    }

    // If no YouTube URL was provided, offer guidance
    if (!answeredFromYoutube) {
      answer = `
# Video Question & Answer

**Your Question**: "${question.trim()}"

## How to Ask Questions About Videos:

For **YouTube videos**, include the video URL:
\`\`\`json
{
  "question": "${question.trim()}",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
\`\`\`

The system will:
1. Extract the YouTube video transcript
2. Search for answers in the transcript
3. Provide contextual responses

## For Local Videos:
Local video files have been uploaded to your project:
${videoFiles.map((f) => `- ${f.fileName}`).join("\n")}

To enable Q&A for local videos:
1. Ensure videos have transcripts or subtitles
2. Provide transcript files in your project
3. The AI will analyze the content

## Next Steps:
1. **For YouTube**: Provide a valid YouTube URL
2. **For Local Videos**: Upload transcript files
3. **Ask Again**: Resubmit your question with the video source

---

**Tip**: Provide as much context as possible in your questions for better answers!`;
    }

    return NextResponse.json(
      {
        answer,
        question: question.trim(),
        videoCount: videoFiles.length,
        answeredFromUrl: answeredFromYoutube,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ask video error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to answer video question: ${errorMessage}` },
      { status: 500 }
    );
  }
}
