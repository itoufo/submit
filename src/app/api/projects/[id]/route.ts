import { NextRequest, NextResponse } from "next/server";
import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

// GET: プロジェクト詳細を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const project = await db.project.findUnique(supabase, id);

    if (!project || project.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // 提出一覧も取得
    const submissions = await db.submission.findMany(supabase, id);
    const judgmentLogs = await db.judgmentLog.findByProject(supabase, id);

    return NextResponse.json({
      ...project,
      submissions,
      judgmentLogs,
    });
  } catch (error) {
    console.error("Failed to get project:", error);
    return NextResponse.json(
      { error: "Failed to get project" },
      { status: 500 }
    );
  }
}

// PATCH: プロジェクトを更新
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const existing = await db.project.findUnique(supabase, id);

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, status, penaltyAmount } = body;

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (status !== undefined) {
      if (!["active", "paused", "archived"].includes(status)) {
        return NextResponse.json(
          { error: "Invalid status" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }
    if (penaltyAmount !== undefined) {
      if (penaltyAmount < 100) {
        return NextResponse.json(
          { error: "Penalty amount must be at least 100 yen" },
          { status: 400 }
        );
      }
      updateData.penaltyAmount = penaltyAmount;
    }

    const project = await db.project.update(supabase, id, updateData);

    return NextResponse.json(project);
  } catch (error) {
    console.error("Failed to update project:", error);
    return NextResponse.json(
      { error: "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE: プロジェクトを削除
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();
    const existing = await db.project.findUnique(supabase, id);

    if (!existing || existing.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.project.delete(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete project:", error);
    return NextResponse.json(
      { error: "Failed to delete project" },
      { status: 500 }
    );
  }
}
