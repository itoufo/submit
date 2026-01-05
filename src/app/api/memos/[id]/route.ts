import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = createServiceClient();

    // 自分のメモかどうか確認
    const memo = await db.memo.findUnique(supabase, id);

    if (!memo || memo.userId !== user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await db.memo.delete(supabase, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete memo:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
