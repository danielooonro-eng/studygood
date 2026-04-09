// Abacus AI client
// The ABACUS_API_KEY environment variable is pre-configured
// We'll use the Abacus AI API through fetch calls to our backend endpoint

/**
 * Summarize PDF text using Abacus AI
 * @param pdfText - The extracted text from PDF(s)
 * @returns Promise with the summary
 */
export async function summarizePdf(pdfText: string): Promise<string> {
  try {
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error("PDF text is empty");
    }

    // Use Abacus AI for text summarization
    // The API expects a prompt and will use the language model to summarize
    const summary = await callAbacusAIAPI(
      "summarize",
      pdfText,
      "Generate a comprehensive summary of the following document. Focus on main points, key concepts, and important details. Format the summary with clear sections and bullet points where appropriate."
    );

    return summary;
  } catch (error) {
    console.error("Error summarizing PDF:", error);
    throw new Error("Failed to summarize PDF. Please try again.");
  }
}

/**
 * Ask a question about PDF content using Abacus AI
 * @param pdfText - The extracted text from PDF(s)
 * @param question - The question to ask about the content
 * @returns Promise with the answer
 */
export async function askPdfQuestion(
  pdfText: string,
  question: string
): Promise<string> {
  try {
    if (!pdfText || pdfText.trim().length === 0) {
      throw new Error("PDF text is empty");
    }

    if (!question || question.trim().length === 0) {
      throw new Error("Question is empty");
    }

    // Use Abacus AI for Q&A
    const answer = await callAbacusAIAPI(
      "qa",
      pdfText,
      `Answer the following question based on the provided document. If the answer is not found in the document, state that clearly. Question: ${question}`
    );

    return answer;
  } catch (error) {
    console.error("Error asking PDF question:", error);
    throw new Error("Failed to answer question. Please try again.");
  }
}

/**
 * Summarize YouTube video content using Abacus AI
 * @param videoUrl - The YouTube video URL
 * @returns Promise with the video summary
 */
export async function summarizeYoutubeVideo(videoUrl: string): Promise<string> {
  try {
    if (!videoUrl || videoUrl.trim().length === 0) {
      throw new Error("Video URL is empty");
    }

    // Extract video transcript from YouTube
    const transcript = await extractYoutubeTranscript(videoUrl);

    if (!transcript || transcript.trim().length === 0) {
      throw new Error("Could not extract transcript from video");
    }

    // Use Abacus AI for video summarization
    const summary = await callAbacusAIAPI(
      "summarize",
      transcript,
      "Generate a comprehensive summary of the following video transcript. Focus on main topics, key points, and important discussions. Include timestamps references if available. Format with clear sections."
    );

    return summary;
  } catch (error) {
    console.error("Error summarizing YouTube video:", error);
    throw new Error("Failed to summarize video. Please try again.");
  }
}

/**
 * Ask a question about video content using Abacus AI
 * @param videoContent - The extracted content/transcript from video(s)
 * @param question - The question to ask about the video
 * @returns Promise with the answer
 */
export async function askVideoQuestion(
  videoContent: string,
  question: string
): Promise<string> {
  try {
    if (!videoContent || videoContent.trim().length === 0) {
      throw new Error("Video content is empty");
    }

    if (!question || question.trim().length === 0) {
      throw new Error("Question is empty");
    }

    // Use Abacus AI for video Q&A
    const answer = await callAbacusAIAPI(
      "qa",
      videoContent,
      `Answer the following question based on the provided video content/transcript. If the answer is not found in the content, state that clearly. Question: ${question}`
    );

    return answer;
  } catch (error) {
    console.error("Error asking video question:", error);
    throw new Error("Failed to answer video question. Please try again.");
  }
}

/**
 * Extract transcript from YouTube video
 * @param videoUrl - The YouTube video URL
 * @returns Promise with the transcript text
 */
async function extractYoutubeTranscript(videoUrl: string): Promise<string> {
  try {
    // Import the function dynamically to handle optional dependency
    const { fetchTranscript } = await import("youtube-transcript");
    
    // Extract video ID from URL
    const videoId = extractYoutubeVideoId(videoUrl);
    
    if (!videoId) {
      throw new Error("Could not extract video ID from URL");
    }

    // Fetch transcript
    const transcript = await fetchTranscript(videoId);
    
    // Join transcript parts into a single text
    const fullTranscript = transcript
      .map((item: any) => item.text || item)
      .join(" ");

    return fullTranscript;
  } catch (error) {
    console.error("Error extracting YouTube transcript:", error);
    // Return a placeholder if transcript extraction fails
    return `Video content could not be extracted. Error: ${(error as Error).message}`;
  }
}

/**
 * Extract video ID from YouTube URL
 * @param url - The YouTube URL
 * @returns The video ID or null
 */
function extractYoutubeVideoId(url: string): string | null {
  try {
    // Handle different YouTube URL formats
    // https://www.youtube.com/watch?v=dQw4w9WgXcQ
    // https://youtu.be/dQw4w9WgXcQ
    // https://www.youtube.com/embed/dQw4w9WgXcQ
    
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  } catch (error) {
    console.error("Error extracting YouTube video ID:", error);
    return null;
  }
}

/**
 * Call Abacus AI API with a prompt and context
 * This is a wrapper function that will integrate with Abacus.AI's language model APIs
 * @param action - Type of action (summarize, qa, etc)
 * @param context - The content to analyze
 * @param prompt - The instruction for the AI model
 * @returns Promise with the AI response
 */
async function callAbacusAIAPI(
  action: string,
  context: string,
  prompt: string
): Promise<string> {
  try {
    // This will be called from a server action or API route
    // We'll use fetch to call a helper API endpoint that executes the Python Abacus AI code
    const response = await fetch("/api/abacus-ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        context,
        prompt,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    return data.result || data.response || "";
  } catch (error) {
    console.error("Error calling Abacus AI API:", error);
    throw error;
  }
}

/**
 * Clean and prepare text for AI processing
 * @param text - Raw text to clean
 * @returns Cleaned text
 */
export function cleanTextForProcessing(text: string): string {
  return text
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .replace(/\n\n+/g, "\n") // Replace multiple newlines with single newline
    .trim();
}

/**
 * Truncate text to a maximum length while preserving word boundaries
 * Useful for API limits
 * @param text - Text to truncate
 * @param maxLength - Maximum length in characters
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number = 8000): string {
  if (text.length <= maxLength) {
    return text;
  }

  // Truncate to maxLength and find the last complete word
  let truncated = text.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(" ");
  
  if (lastSpaceIndex > maxLength * 0.9) {
    // If the last space is close to the end, use it
    truncated = truncated.substring(0, lastSpaceIndex);
  }

  return truncated + "...";
}
