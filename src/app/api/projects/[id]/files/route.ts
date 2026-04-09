import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const ALLOWED_TYPES = ["application/pdf", "video/mp4", "video/quicktime"];

// POST /api/projects/[id]/files - Upload file
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

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF and video files are allowed" },
        { status: 400 }
      );
    }

    // Determine file type
    let fileType = "pdf";
    if (file.type.startsWith("video/")) {
      fileType = "video";
    }

    // Create directory if not exists
    const uploadDir = path.join(process.cwd(), "public", "uploads", id);
    await fs.mkdir(uploadDir, { recursive: true });

    // Save file
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = path.join(uploadDir, fileName);
    const buffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(buffer));

    // Save to database
    const projectFile = await prisma.projectFile.create({
      data: {
        projectId: id,
        type: fileType,
        fileName: file.name,
        filePath: `/uploads/${id}/${fileName}`,
        fileSize: file.size,
      },
    });

    return NextResponse.json(projectFile, { status: 201 });
  } catch (error) {
    console.error("Upload file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
