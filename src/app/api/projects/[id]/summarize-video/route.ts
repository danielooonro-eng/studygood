import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

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

    // TODO: Integrate with Abacus.AI for video summarization
    // Extract video transcript and process with AI

    const summary = `
# Video Summary

This is a placeholder summary. To enable AI-powered video summarization, integrate with Abacus.AI API.

## Video Information:
- Number of videos: ${videoFiles.length}
- Video files:
${videoFiles.map((f) => `  - ${f.fileName}`).join("\n")}

## How Summarization Works:
1. Extract transcript from video files
2. Process through AI summarization model
3. Generate key points and highlights
4. Create timeline-based summary

## Key Features to Enable:
- Automatic transcript extraction
- Multi-language support
- Timestamp-based summaries
- Key moment detection

## Placeholder Content:
The system would analyze your videos and extract:
- Main topics discussed
- Important timestamps
- Key takeaways
- Relevant sections for study`;

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("Summarize video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
