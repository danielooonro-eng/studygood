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
  let projectId: string;
  let userId: string | null;
  let question: string;

  try {
    console.log("[ask-pdf] Request started");
    
    userId = await getUserIdFromToken();
    console.log("[ask-pdf] User ID:", userId ? "authenticated" : "not authenticated");

    if (!userId) {
      console.log("[ask-pdf] Returning 401: User not authenticated");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    projectId = id;
    
    // Parse request body
    console.log("[ask-pdf] Parsing request body");
    const body = await request.json();
    question = body.question;

    // Validate question
    if (!question || typeof question !== "string") {
      console.log("[ask-pdf] Invalid question format");
      return NextResponse.json(
        { error: "Valid question is required" },
        { status: 400 }
      );
    }

    if (question.trim().length === 0) {
      console.log("[ask-pdf] Question is empty");
      return NextResponse.json(
        { error: "Question cannot be empty" },
        { status: 400 }
      );
    }

    console.log("[ask-pdf] Question:", question.substring(0, 50) + "...");

    // Verify project ownership
    console.log("[ask-pdf] Fetching project from database");
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      console.log("[ask-pdf] Project not found:", projectId);
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    if (project.userId !== userId) {
      console.log("[ask-pdf] User does not own project");
      return NextResponse.json(
        { error: "You don't have access to this project" },
        { status: 403 }
      );
    }

    // Get PDF files
    const pdfFiles = project.files?.filter((f) => f.type === "pdf") || [];
    console.log("[ask-pdf] Found PDF files:", pdfFiles.length);

    if (pdfFiles.length === 0) {
      console.log("[ask-pdf] No PDF files found");
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
        console.log(`[ask-pdf] Processing file: ${file.fileName}`);
        const text = await extractTextFromPDF(file.filePath);
        console.log(`[ask-pdf] Extracted text from ${file.fileName}, length: ${text.length}`);
        combinedText += text + "\n";
        processedFiles.push(file.fileName);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        console.error(`[ask-pdf] Error processing file ${file.fileName}:`, errMsg);
        failedFiles.push(file.fileName);
      }
    }

    if (!combinedText || combinedText.trim().length === 0) {
      console.log("[ask-pdf] No text extracted from PDFs");
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
    console.log("[ask-pdf] Cleaning text");
    const cleanedText = cleanTextForProcessing(combinedText);
    
    // Truncate to reasonable length for AI API
    console.log("[ask-pdf] Truncating text, original length:", cleanedText.length);
    const processedText = truncateText(cleanedText, 8000);
    console.log("[ask-pdf] Final text length:", processedText.length);

    // Get AI answer using Abacus AI
    console.log("[ask-pdf] Calling AI to answer question");
    const answer = await askPdfQuestion(processedText, question.trim());
    console.log("[ask-pdf] Answer generated, length:", answer.length);

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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error("[ask-pdf] Error:", {
      message: errorMessage,
      stack: errorStack,
      projectId: projectId,
      userId: userId ? "authenticated" : "not authenticated",
      question: question ? question.substring(0, 50) : "not provided",
    });
    
    return NextResponse.json(
      { 
        error: `Failed to answer question: ${errorMessage}`,
        details: {
          projectId: projectId,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 500 }
    );
  }
}
