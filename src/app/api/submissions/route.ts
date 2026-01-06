import { NextRequest, NextResponse } from "next/server";
import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { sendLineMessage, createSubmissionConfirmation } from "@/lib/line";

// POST: 提出を作成
export async function POST(request: NextRequest) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 誓約済みチェック
    if (!user.pledgedAt) {
      return NextResponse.json(
        { error: "Pledge required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { projectId, content } = body;

    if (!projectId || !content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Project ID and content are required" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // プロジェクトの存在確認
    const project = await db.project.findUnique(supabase, projectId);
    if (!project || project.userId !== user.id) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    // 提出を作成
    const submission = await db.submission.create(supabase, {
      userId: user.id,
      projectId,
      content: content.trim(),
    });

    // LINE通知（提出確認）
    if (user.profile?.lineUserId) {
      const message = createSubmissionConfirmation(project.name, submission.sequenceNum);
      await sendLineMessage(user.profile.lineUserId, message);
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    console.error("Failed to create submission:", error);
    return NextResponse.json(
      { error: "Failed to create submission" },
      { status: 500 }
    );
  }
}

// GET: 提出一覧を取得
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const limit = searchParams.get("limit");

    const supabase = createServiceClient();

    let submissions;
    if (projectId) {
      submissions = await db.submission.findMany(supabase, projectId);
    } else {
      submissions = await db.submission.findByUser(
        supabase,
        user.id,
        limit ? parseInt(limit) : undefined
      );
    }

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Failed to get submissions:", error);
    return NextResponse.json(
      { error: "Failed to get submissions" },
      { status: 500 }
    );
  }
}
