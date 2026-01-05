import { NextRequest, NextResponse } from "next/server";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function GET() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createServiceClient();
    const memos = await db.memo.findMany(supabase, user.id);

    return NextResponse.json(memos);
  } catch (error) {
    console.error("Failed to fetch memos:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ユーザーが存在するか確認
    await ensureUserExists(user.id, user.email!);

    const body = await request.json();
    const { content, tags, type = "text" } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const memo = await db.memo.create(supabase, {
      userId: user.id,
      content: content.trim(),
      tags: tags || null,
      type,
    });

    return NextResponse.json(memo);
  } catch (error) {
    console.error("Failed to create memo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
