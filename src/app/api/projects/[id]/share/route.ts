import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserIdFromToken } from "@/lib/auth";

// POST /api/projects/[id]/share - Share project with another user
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
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

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

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    if (targetUser.id === userId) {
      return NextResponse.json(
        { error: "You cannot share a project with yourself" },
        { status: 400 }
      );
    }

    // Check if already shared
    const existingShare = await prisma.sharedProject.findUnique({
      where: {
        projectId_sharedWithUserId: {
          projectId: id,
          sharedWithUserId: targetUser.id,
        },
      },
    });

    if (existingShare) {
      return NextResponse.json(
        { error: "Project already shared with this user" },
        { status: 409 }
      );
    }

    // Create share
    const sharedProject = await prisma.sharedProject.create({
      data: {
        projectId: id,
        sharedWithUserId: targetUser.id,
      },
      include: {
        sharedWithUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(sharedProject, { status: 201 });
  } catch (error) {
    console.error("Share project error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET /api/projects/[id]/share - Get shared users
export async function GET(
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

    // Get shared users
    const sharedWith = await prisma.sharedProject.findMany({
      where: { projectId: id },
      include: {
        sharedWithUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(sharedWith, { status: 200 });
  } catch (error) {
    console.error("Get shared users error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
