import * as pdfjsLib from "pdfjs-dist";
import fs from "fs";
import path from "path";

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Read the file from the public directory
    const absolutePath = path.join(process.cwd(), "public", filePath);
    const fileData = fs.readFileSync(absolutePath);

    // Load PDF
    const pdf = await pdfjsLib.getDocument({ data: fileData }).promise;

    let extractedText = "";

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map((item) => {
          if ("str" in item) {
            return item.str;
          }
          return "";
        })
        .join(" ");

      extractedText += pageText + "\n";
    }

    return extractedText;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
