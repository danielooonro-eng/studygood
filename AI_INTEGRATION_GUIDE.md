# StudyGood - Abacus AI Integration Guide

## Overview

StudyGood has been successfully integrated with Abacus AI to provide intelligent document and video analysis capabilities. This guide explains how to use the new AI features in the application.

## Features Implemented

### 1. PDF Summarization
- **What it does**: Automatically generates comprehensive summaries of PDF documents
- **Location**: PDF Tools section in Project Detail page
- **How to use**:
  1. Upload one or more PDF files to your project
  2. Click the "📝 Summarize PDFs" button
  3. Wait for the AI to process and generate a summary
  4. The summary appears below the button with key points and document statistics

### 2. PDF Question & Answer
- **What it does**: Answers questions about the content in your PDF documents
- **Location**: PDF Tools section → "Ask Questions About PDFs" subsection
- **How to use**:
  1. Upload PDF files to your project
  2. Type your question in the textarea (e.g., "What are the main concepts discussed?")
  3. Click the "Ask" button
  4. The AI analyzes the PDFs and provides an answer

### 3. Video Summarization
- **What it does**: Summarizes YouTube video content and local video files
- **Location**: Video Tools section in Project Detail page
- **How to use for YouTube videos**:
  1. Get your YouTube video URL
  2. The summarization endpoint accepts `videoUrl` parameter
  3. The system extracts the transcript and generates a summary
  4. Displays key points and important information

### 4. Video Question & Answer
- **What it does**: Answers questions about video content
- **Location**: Video Tools section → "Ask Questions About Videos" subsection
- **How to use for YouTube videos**:
  1. Upload video files to your project
  2. Type your question in the textarea
  3. Optionally provide a YouTube URL for transcript-based answers
  4. The AI provides contextual answers based on the video content

## File Structure

### New Files Created

#### `/src/lib/ai.ts`
Main AI integration library containing:
- `summarizePdf(pdfText)` - Summarizes PDF text using Abacus AI
- `askPdfQuestion(pdfText, question)` - Answers questions about PDF content
- `summarizeYoutubeVideo(videoUrl)` - Summarizes YouTube videos
- `askVideoQuestion(videoContent, question)` - Answers video-related questions
- Helper functions for text processing and YouTube transcript extraction

#### `/src/app/api/abacus-ai/chat/route.ts`
API endpoint that:
- Processes requests to the Abacus AI model
- Handles prompt engineering for different types of queries
- Provides fallback responses when the AI service is unavailable
- Manages error handling and logging

### Updated Files

#### `/src/app/api/projects/[id]/summarize-pdf/route.ts`
- Integrated with `summarizePdf()` function
- Returns structured response with summary and document statistics
- Handles multiple PDFs seamlessly
- Improved error handling

#### `/src/app/api/projects/[id]/ask-pdf/route.ts`
- Integrated with `askPdfQuestion()` function
- Validates questions before processing
- Returns answer with source file information
- Enhanced error messages

#### `/src/app/api/projects/[id]/summarize-video/route.ts`
- Integrated with `summarizeYoutubeVideo()` function
- Accepts optional `videoUrl` parameter
- Provides guidance for YouTube video summarization
- Handles local video files

#### `/src/app/api/projects/[id]/ask-video/route.ts`
- Integrated with `askVideoQuestion()` function
- Accepts optional `videoUrl` parameter for YouTube videos
- Provides instructions for using the feature
- Enhanced error handling

## API Endpoints

### POST /api/abacus-ai/chat
Internal endpoint for AI model calls.

**Request Body:**
```json
{
  "action": "summarize|qa",
  "context": "The text content to analyze",
  "prompt": "The instruction for the AI model"
}
```

**Response:**
```json
{
  "result": "AI-generated response",
  "action": "summarize|qa",
  "success": true
}
```

### POST /api/projects/[id]/summarize-pdf
Summarizes PDF files in a project.

**Request Body:**
```json
{
  // No body required
}
```

**Response:**
```json
{
  "summary": "The generated summary",
  "stats": {
    "totalWords": 5000,
    "totalCharacters": 30000,
    "pdfCount": 2,
    "processedFiles": 2
  }
}
```

### POST /api/projects/[id]/ask-pdf
Answers questions about PDF content.

**Request Body:**
```json
{
  "question": "What is the main topic?"
}
```

**Response:**
```json
{
  "answer": "The AI-generated answer",
  "question": "The original question",
  "sourcesUsed": 2,
  "sourceFiles": ["file1.pdf", "file2.pdf"]
}
```

### POST /api/projects/[id]/summarize-video
Summarizes video content.

**Request Body:**
```json
{
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "summary": "The generated summary",
  "videoCount": 1,
  "videoFiles": [
    {"name": "video.mp4", "size": 1024000}
  ],
  "processed": true
}
```

### POST /api/projects/[id]/ask-video
Answers questions about video content.

**Request Body:**
```json
{
  "question": "What is discussed in the video?",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

**Response:**
```json
{
  "answer": "The AI-generated answer",
  "question": "The original question",
  "videoCount": 1,
  "answeredFromUrl": true
}
```

## Configuration

### Required Environment Variables

```bash
ABACUS_API_KEY=your_api_key_here
DATABASE_URL=sqlite://./dev.db  # or your database URL
JWT_SECRET=your_secret_key
NEXT_PUBLIC_API_URL=http://localhost:3000
```

The `ABACUS_API_KEY` is automatically pre-configured in your environment.

## Using YouTube Videos

### Supported URL Formats
- Full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short URL: `https://youtu.be/VIDEO_ID`
- Embed URL: `https://www.youtube.com/embed/VIDEO_ID`

### Requirements
- The video must have captions or transcripts available
- The video must be publicly accessible
- The AI service must have internet connectivity

### How It Works
1. Extract the video ID from the YouTube URL
2. Fetch the video transcript using the YouTube Transcript API
3. Process the transcript through Abacus AI
4. Return the summary or answer

## Error Handling

The system includes comprehensive error handling:

### Common Errors and Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "No PDF files found" | No PDFs uploaded | Upload PDF files to the project |
| "Question cannot be empty" | Empty question | Provide a non-empty question |
| "Could not extract text from PDFs" | PDF is image-only | Use text-based PDFs |
| "Video transcript unavailable" | No captions on YouTube video | Choose a video with captions |
| "Unauthorized" | Not authenticated | Log in to your account |
| "You don't have access" | Project ownership issue | Use your own projects |

## Performance Tips

1. **Keep PDFs organized**: Use 1-3 PDFs per summarization for best results
2. **Ask specific questions**: More specific questions get better answers
3. **Check video captions**: Ensure YouTube videos have captions enabled
4. **Use clear language**: Write questions in clear, concise language
5. **Process in batches**: Process videos one at a time for better performance

## Fallback Behavior

If the Abacus AI service is temporarily unavailable, the system provides:
- Placeholder summaries with document structure information
- Fallback answers with guidance on available resources
- Helpful error messages and troubleshooting tips

This ensures the application continues to function gracefully even during service interruptions.

## Development Notes

### Text Processing
The system automatically:
- Cleans extra whitespace and formatting
- Truncates content to avoid API limits (8000 character max)
- Preserves word boundaries when truncating
- Handles encoding and special characters

### YouTube Transcript Extraction
The implementation uses the `youtube-transcript` npm package to:
- Extract video IDs from various YouTube URL formats
- Fetch transcripts with error handling
- Handle videos without available transcripts gracefully

## Next Steps

1. **Test the features**: Create a project and try summarizing a PDF
2. **Provide feedback**: Test all features and report any issues
3. **Customize prompts**: Adjust the AI prompts in `/src/lib/ai.ts` for better results
4. **Monitor performance**: Track API usage and optimize as needed
5. **Expand capabilities**: Add support for additional document types (Word, PowerPoint, etc.)

## Support & Documentation

- **Abacus AI Docs**: https://docs.abacus.ai/
- **YouTube Transcript API**: https://github.com/jdepoix/youtube-transcript-api
- **StudyGood Repository**: https://github.com/danielooonro-eng/studygood

## Change Log

### Version 1.0 - Abacus AI Integration
- ✅ PDF summarization
- ✅ PDF Q&A
- ✅ YouTube video summarization
- ✅ YouTube video Q&A
- ✅ Fallback responses
- ✅ Error handling and logging
- ✅ Text processing utilities

---

**Last Updated**: April 9, 2026
**Status**: Production Ready
**Maintained By**: StudyGood Development Team
