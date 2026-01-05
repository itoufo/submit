import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const supabase = createServiceClient();

    // 自分のものか確認
    const suggestion = await db.projectSuggestion.findUnique(supabase, id);

    if (!suggestion || suggestion.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // ステータスを更新
    const updated = await db.projectSuggestion.update(supabase, id, { status });

    // 承認された場合はプロジェクトを作成
    if (status === "accepted") {
      await db.project.create(supabase, {
        userId: user.id,
        suggestionId: id,
        title: suggestion.title,
        description: suggestion.description,
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update suggestion:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
