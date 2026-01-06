import { NextRequest, NextResponse } from "next/server";
import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

// POST: プロジェクトを作成
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
    const { name, description, frequency, judgmentDay, customDays, penaltyAmount } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Project name is required" },
        { status: 400 }
      );
    }

    if (penaltyAmount !== undefined && penaltyAmount < 100) {
      return NextResponse.json(
        { error: "Penalty amount must be at least 100 yen" },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const project = await db.project.create(supabase, {
      userId: user.id,
      name: name.trim(),
      description: description?.trim() || null,
      frequency: frequency || "weekly",
      judgmentDay: judgmentDay ?? 0,
      customDays: customDays || null,
      penaltyAmount: penaltyAmount ?? 1000,
    });

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project:", error);
    return NextResponse.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}

// GET: プロジェクト一覧を取得
export async function GET(request: NextRequest) {
  try {
    const user = await getUserWithProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;

    const supabase = createServiceClient();
    const projects = await db.project.findMany(supabase, user.id, status);

    return NextResponse.json(projects);
  } catch (error) {
    console.error("Failed to get projects:", error);
    return NextResponse.json(
      { error: "Failed to get projects" },
      { status: 500 }
    );
  }
}
