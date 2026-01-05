import { NextResponse } from "next/server";
import { getUser, ensureUserExists } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { generateInviteToken } from "@/lib/utils";

export async function POST() {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureUserExists(user.id, user.email!);

    const supabase = createServiceClient();

    // 既存の未使用招待トークンを無効化（仮のサポーターレコードを削除）
    await supabase
      .from("Supporter")
      .delete()
      .eq("userId", user.id)
      .eq("status", "pending")
      .eq("supporterUserId", user.id);

    // 新しい招待トークンを生成
    const token = generateInviteToken();

    // 招待レコードを作成（サポーターIDは後で更新）
    await db.supporter.create(supabase, {
      userId: user.id,
      supporterUserId: user.id, // 一時的に自分自身を設定
      inviteToken: token,
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Failed to create invite:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
