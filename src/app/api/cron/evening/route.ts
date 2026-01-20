import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { sendLineMessage, createEveningReminder } from "@/lib/line";

/**
 * 夜リマインド (21:00 JST)
 * 当日が期限で未提出のプロジェクトをLINE通知
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

    console.log(`[Evening Reminder] Found ${projects.length} projects due today`);

    // 本日の提出を一括取得（N+1 回避）
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const projectIds = projects.map((p) => p.id);
    const submissionsMap = await db.submission.findInPeriodByProjectIds(
      supabase,
      projectIds,
      todayStart.toISOString(),
      todayEnd.toISOString()
    );

    // ユーザーごとにグループ化 & 未提出チェック
    const userUnsubmittedProjects = new Map<
      string,
      Array<{ name: string; penaltyAmount: number }>
    >();

    for (const project of projects) {
      const submissions = submissionsMap.get(project.id) || [];

      // 未提出の場合のみ追加
      if (submissions.length === 0) {
        const existing = userUnsubmittedProjects.get(project.userId) || [];
        userUnsubmittedProjects.set(project.userId, [
          ...existing,
          { name: project.name, penaltyAmount: project.penaltyAmount },
        ]);
      }
    }

    // ユーザー情報を一括取得（N+1 回避）
    const userIds = Array.from(userUnsubmittedProjects.keys());
    const users = await db.user.findByIds(supabase, userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    let sentCount = 0;
    let errorCount = 0;

    // ユーザーごとに通知
    for (const [userId, projectList] of userUnsubmittedProjects) {
      // ユーザー情報取得（バッチ取得済み）
      const user = userMap.get(userId);

      if (!user) {
        console.warn(`[Evening Reminder] User not found: ${userId}`);
        continue;
      }

      // LINE連携 & 夜リマインド設定確認
      if (!user.lineUserId || !user.notifyEvening) {
        console.log(
          `[Evening Reminder] Skip user ${userId}: lineUserId=${user.lineUserId}, notifyEvening=${user.notifyEvening}`
        );
        continue;
      }

      // メッセージ作成
      const message = createEveningReminder(projectList);

      if (!message) continue;

      // LINE送信
      const success = await sendLineMessage(user.lineUserId, message);

      if (success) {
        sentCount++;
        console.log(`[Evening Reminder] Sent to user ${userId}`);
      } else {
        errorCount++;
        console.error(`[Evening Reminder] Failed to send to user ${userId}`);
      }

      // Rate limit対策
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      projectsChecked: projects.length,
      unsubmittedProjects: Array.from(userUnsubmittedProjects.values()).flat()
        .length,
      usersNotified: sentCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Evening Reminder] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
