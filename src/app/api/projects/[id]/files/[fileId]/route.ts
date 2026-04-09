import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";
import fs from "fs/promises";
import path from "path";

// DELETE /api/projects/[id]/files/[fileId] - Delete file
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const userId = await getUserIdFromToken();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, fileId } = await params;

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

    // Find and delete file
    const projectFile = await prisma.projectFile.findUnique({
      where: { id: fileId },
    });

    if (!projectFile) {
      return NextResponse.json(
        { error: "File not found" },
        { status: 404 }
      );
    }

    if (projectFile.projectId !== id) {
      return NextResponse.json(
        { error: "File does not belong to this project" },
        { status: 403 }
      );
    }

    // Delete physical file
    try {
      const filePath = path.join(process.cwd(), "public", projectFile.filePath);
      await fs.unlink(filePath);
    } catch (err) {
      console.error("Error deleting physical file:", err);
    }

    // Delete from database
    await prisma.projectFile.delete({
      where: { id: fileId },
    });

    return NextResponse.json(
      { message: "File deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete file error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
