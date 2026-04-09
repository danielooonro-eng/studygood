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

    // Get PDF files
    const pdfFiles = project.files?.filter((f) => f.type === "pdf") || [];

    if (pdfFiles.length === 0) {
      return NextResponse.json(
        { error: "No PDF files found in this project" },
        { status: 400 }
      );
    }

    // Extract text from all PDFs
    let combinedText = "";
    const failedFiles: string[] = [];

    for (const file of pdfFiles) {
      try {
        const text = await extractTextFromPDF(file.filePath);
        combinedText += text + "\n";
      } catch (err) {
        console.error(`Error processing file ${file.fileName}:`, err);
        failedFiles.push(file.fileName);
      }
    }

    if (!combinedText) {
      return NextResponse.json(
        { error: "Could not extract text from PDFs" },
        { status: 400 }
      );
    }

    // Clean and prepare text for AI processing
    const cleanedText = cleanTextForProcessing(combinedText);
    
    // Truncate to reasonable length for AI API
    const processedText = truncateText(cleanedText, 8000);

    // Get AI summary using Abacus AI
    const summary = await summarizePdf(processedText);

    return NextResponse.json(
      {
        summary,
        stats: {
          totalWords: combinedText.split(/\s+/).length,
          totalCharacters: combinedText.length,
          pdfCount: pdfFiles.length,
          processedFiles: pdfFiles.length - failedFiles.length,
          failedFiles: failedFiles.length > 0 ? failedFiles : undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Summarize PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to summarize PDFs: ${errorMessage}` },
      { status: 500 }
    );
  }
}
