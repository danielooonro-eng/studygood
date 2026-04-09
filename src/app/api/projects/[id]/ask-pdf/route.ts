import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf";
import { askPdfQuestion, cleanTextForProcessing, truncateText } from "@/lib/ai";

// POST /api/projects/[id]/ask-pdf - Ask question about PDF
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

    // Get AI answer using Abacus AI
    const answer = await askPdfQuestion(processedText, question.trim());

    return NextResponse.json(
      {
        answer,
        question: question.trim(),
        sourcesUsed: pdfFiles.length,
        sourceFiles: pdfFiles.map((f) => f.fileName),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Ask PDF error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to answer question: ${errorMessage}` },
      { status: 500 }
    );
  }
}
