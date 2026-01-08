import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import {
  sendLineMessage,
  createJudgmentSuccess,
  createJudgmentFailed,
} from "@/lib/line";

/**
 * 期限超過判定 (0:30 JST)
 * 期限を過ぎたプロジェクトを判定し、ペナルティ処理
 */
export async function GET(request: Request) {
  // Vercel Cron Secret で認証
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    // 現在時刻より前が期限のプロジェクトを取得
    const now = new Date();
    const projects = await db.project.findActiveForJudgment(
      supabase,
      now.toISOString()
    );

    console.log(`[Judgment] Found ${projects.length} projects to judge`);

    let submittedCount = 0;
    let missedCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      try {
        // 判定期間の提出をチェック
        const judgmentDate = new Date(project.nextJudgmentDate!);
        const periodStart = new Date(judgmentDate);
        periodStart.setDate(periodStart.getDate() - 7); // 1週間前から（頻度によって調整が必要）

        const submissions = await db.submission.findInPeriod(
          supabase,
          project.id,
          periodStart.toISOString(),
          judgmentDate.toISOString()
        );

        const submitted = submissions.length > 0;

        // 判定ログを作成
        await db.judgmentLog.create(supabase, {
          userId: project.userId,
          projectId: project.id,
          judgmentDate: judgmentDate.toISOString(),
          submitted,
          penaltyExecuted: !submitted,
          penaltyAmount: submitted ? null : project.penaltyAmount,
        });

        if (submitted) {
          submittedCount++;

          // 提出済み通知
          const user = await db.user.findUnique(supabase, project.userId);
          if (user?.lineUserId) {
            const message = createJudgmentSuccess(project.name);
            await sendLineMessage(user.lineUserId, message);
          }
        } else {
          missedCount++;

          // 未提出: ペナルティ処理
          await db.project.incrementMissedCount(
            supabase,
            project.id,
            project.penaltyAmount
          );

          // ペナルティログ作成
          await db.penaltyLog.create(supabase, {
            userId: project.userId,
            amount: project.penaltyAmount,
            reason: `${project.name} の提出期限超過`,
          });

          // 未提出通知
          const user = await db.user.findUnique(supabase, project.userId);
          if (user?.lineUserId && user.notifyUrgent) {
            const message = createJudgmentFailed(
              project.name,
              project.penaltyAmount
            );
            await sendLineMessage(user.lineUserId, message);
          }
        }

        // 次回判定日を更新
        await db.project.updateNextJudgmentDate(supabase, project.id);

        console.log(
          `[Judgment] Project ${project.id}: ${submitted ? "PASS" : "FAIL"}`
        );
      } catch (error) {
        errorCount++;
        console.error(`[Judgment] Error processing project ${project.id}:`, error);
      }

      // Rate limit対策
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return NextResponse.json({
      success: true,
      projectsJudged: projects.length,
      submitted: submittedCount,
      missed: missedCount,
      errors: errorCount,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Judgment] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
