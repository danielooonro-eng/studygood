import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import { extractTextFromPDF } from "@/lib/pdf";

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

    // TODO: Integrate with Abacus.AI for actual summarization
    // const client = abacusai.ApiClient();
    // const summary = await client.summarizeText(combinedText);

    // Placeholder summary
    const summary = `
# Document Summary

This is a placeholder summary. To enable AI-powered summarization, integrate with Abacus.AI API.

## Key Points:
- Your document has been analyzed
- The system would extract main concepts and themes
- A comprehensive summary would be generated highlighting the most important information

## Document Statistics:
- Total words: ${combinedText.split(/\s+/).length}
- Total characters: ${combinedText.length}
- Number of PDF files: ${pdfFiles.length}

## How to Enable AI Summarization:
1. Connect to Abacus.AI API
2. Configure the summarization model
3. Process your PDFs through the model
4. Receive intelligent, concise summaries

For more information, visit the Abacus.AI documentation.`;

    return NextResponse.json({ summary }, { status: 200 });
  } catch (error) {
    console.error("Summarize PDF error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
