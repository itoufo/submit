import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { sendLineMessage, createMorningReminder } from "@/lib/line";

/**
 * 朝リマインド (9:00 JST)
 * 当日が期限のプロジェクトをLINE通知
 */
export async function GET(request: Request) {
  // Vercel Cron Secret で認証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 本日の終わりまでが期限のプロジェクトを取得
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const projects = await db.project.findActiveForJudgment(
      supabase,
      today.toISOString()
    );

    console.log(`[Morning Reminder] Found ${projects.length} projects due today`);

    // ユーザーごとにグループ化
    const userProjects = new Map<string, typeof projects>();
    for (const project of projects) {
      const existing = userProjects.get(project.userId) || [];
      userProjects.set(project.userId, [...existing, project]);
    }

    // ユーザー情報を一括取得（N+1 回避）
    const userIds = Array.from(userProjects.keys());
    const users = await db.user.findByIds(supabase, userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    let sentCount = 0;
    let errorCount = 0;

    // ユーザーごとに通知
    for (const [userId, userProjectList] of userProjects) {
      // ユーザー情報取得（バッチ取得済み）
      const user = userMap.get(userId);

      if (!user) {
        console.warn(`[Morning Reminder] User not found: ${userId}`);
        continue;
      }

      // LINE連携 & 朝リマインド設定確認
      if (!user.lineUserId || !user.notifyMorning) {
        console.log(
          `[Morning Reminder] Skip user ${userId}: lineUserId=${user.lineUserId}, notifyMorning=${user.notifyMorning}`
        );
        continue;
      }

      // メッセージ作成
      const message = createMorningReminder(
        userProjectList.map((p) => ({ name: p.name }))
      );

      if (!message) continue;

      // LINE送信
      const success = await sendLineMessage(user.lineUserId, message);

      if (success) {
        sentCount++;
        console.log(`[Morning Reminder] Sent to user ${userId}`);
      } else {
        errorCount++;
        console.error(`[Morning Reminder] Failed to send to user ${userId}`);
      }

      // Rate limit対策
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      projectsFound: projects.length,
      usersNotified: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Morning Reminder] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
