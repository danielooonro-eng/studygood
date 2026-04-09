import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf";

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
    for (const file of pdfFiles) {
      try {
        const text = await extractTextFromPDF(file.filePath);
        combinedText += text + "\n";
      } catch (err) {
        console.error(`Error processing file ${file.fileName}:`, err);
      }
    }

    if (!combinedText) {
      return NextResponse.json(
        { error: "Could not extract text from PDFs" },
        { status: 400 }
      );
    }

    // TODO: Integrate with Abacus.AI for actual Q&A
    // For now, return a placeholder response
    // const client = abacusai.ApiClient();
    // const answer = await client.answerQuestion(combinedText, question);

    // Placeholder response with mock answer
    const answer = `Based on the documents in your project, I would analyze the content to answer your question: "${question}". 

This is a placeholder response. To enable AI-powered Q&A, integrate with Abacus.AI API in the /src/lib/ai.ts file.

The system would extract key information from your PDFs and provide accurate, contextual answers.`;

    return NextResponse.json({ answer }, { status: 200 });
  } catch (error) {
    console.error("Ask PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
