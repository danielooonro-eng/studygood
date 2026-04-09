import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

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
    const { question } = await request.json();

    if (!question) {
      return NextResponse.json(
        { error: "Question is required" },
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

    // TODO: Integrate with Abacus.AI for video Q&A
    // Extract video transcript/metadata and process with AI

    const answer = `Based on the video content in your project, I would analyze the transcript and video information to answer your question: "${question}".

This is a placeholder response. To enable AI-powered video Q&A, integrate with Abacus.AI API and YouTube transcript extraction in the /src/lib/youtube.ts file.

The system would:
1. Extract video transcript from YouTube videos
2. Process the content through the AI model
3. Provide contextual answers based on the video content`;

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("Ask video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
