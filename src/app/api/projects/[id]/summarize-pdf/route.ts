import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf";
import { summarizePdf, cleanTextForProcessing, truncateText } from "@/lib/ai";

// POST /api/projects/[id]/summarize-pdf - Summarize PDF content
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let projectId: string;
  let userId: string | null;

  try {
    console.log("[summarize-pdf] Request started");
    
    userId = await getUserIdFromToken();
    console.log("[summarize-pdf] User ID:", userId ? "authenticated" : "not authenticated");

    if (!userId) {
      console.log("[summarize-pdf] Returning 401: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    projectId = id;
    console.log("[summarize-pdf] Project ID:", projectId);

    // Verify project ownership
    console.log("[summarize-pdf] Fetching project from database");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      console.log("[summarize-pdf] Project not found:", projectId);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      console.log("[summarize-pdf] User does not own project:", { projectId, userId, ownerUserId: project.userId });
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get PDF files
    const pdfFiles = project.files?.filter((f) => f.type === "pdf") || [];
    console.log("[summarize-pdf] Found PDF files:", pdfFiles.length);

    if (pdfFiles.length === 0) {
      console.log("[summarize-pdf] No PDF files found");
      return NextResponse.json(
        { error: "No PDF files found in this project" },
        { status: 400 }
      );
    }

    // Extract text from all PDFs
    let combinedText = "";
    const failedFiles: string[] = [];
    const processedFiles: string[] = [];

    for (const file of pdfFiles) {
      try {
        console.log(`[summarize-pdf] Processing file: ${file.fileName}`);
        const text = await extractTextFromPDF(file.filePath);
        console.log(`[summarize-pdf] Extracted text from ${file.fileName}, length: ${text.length}`);
        combinedText += text + "\n";
        processedFiles.push(file.fileName);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[summarize-pdf] Error processing file ${file.fileName}:`, errMsg);
        failedFiles.push(file.fileName);
      }
    }

    if (!combinedText || combinedText.trim().length === 0) {
      console.log("[summarize-pdf] No text extracted from PDFs");
      return NextResponse.json(
        { 
          error: "Could not extract text from PDFs",
          details: {
            processedFiles: processedFiles.length,
            failedFiles: failedFiles,
          }
        },
        { status: 400 }
      );
    }

    // Clean and prepare text for AI processing
    console.log("[summarize-pdf] Cleaning text");
    const cleanedText = cleanTextForProcessing(combinedText);
    
    // Truncate to reasonable length for AI API
    console.log("[summarize-pdf] Truncating text, original length:", cleanedText.length);
    const processedText = truncateText(cleanedText, 8000);
    console.log("[summarize-pdf] Final text length:", processedText.length);

    // Get AI summary using Abacus AI
    console.log("[summarize-pdf] Calling AI to summarize");
    const summary = await summarizePdf(processedText);
    console.log("[summarize-pdf] Summary generated, length:", summary.length);

    return NextResponse.json(
      {
        summary,
        stats: {
          totalWords: combinedText.split(/\s+/).length,
          totalCharacters: combinedText.length,
          pdfCount: pdfFiles.length,
          processedFiles: processedFiles.length,
          failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error("[summarize-pdf] Error:", {
      message: errorMessage,
      stack: errorStack,
      projectId: projectId,
      userId: userId ? "authenticated" : "not authenticated",
    });
    
    return NextResponse.json(
      { 
        error: `Failed to summarize PDFs: ${errorMessage}`,
        details: {
          projectId: projectId,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
