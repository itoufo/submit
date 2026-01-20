import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import {
  sendLineMessage,
  createJudgmentSuccess,
  createJudgmentFailed,
} from "@/lib/line";

function getPeriodStart(lastJudgmentDate: string | null, projectCreatedAt: string): Date {
  if (lastJudgmentDate) {
    const start = new Date(lastJudgmentDate);
    start.setDate(start.getDate() + 1);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  const start = new Date(projectCreatedAt);
  start.setHours(0, 0, 0, 0);
  return start;
}

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

    // バッチ取得: 最新判定ログ（N+1 回避）
    const projectIds = projects.map((p) => p.id);
    const latestJudgmentsMap = await db.judgmentLog.findLatestByProjectIds(
      supabase,
      projectIds
    );

    // バッチ取得: ユーザー情報（N+1 回避）
    const userIds = [...new Set(projects.map((p) => p.userId))];
    const users = await db.user.findByIds(supabase, userIds);
    const userMap = new Map(users.map((u) => [u.id, u]));

    let submittedCount = 0;
    let missedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const project of projects) {
      try {
        if (!project.nextJudgmentDate) {
          console.warn(`[Judgment] Skip project without nextJudgmentDate: ${project.id}`);
          continue;
        }

        const periodEnd = new Date(project.nextJudgmentDate);
        periodEnd.setHours(23, 59, 59, 999);

        // バッチ取得済みの判定ログを使用
        const lastJudgment = latestJudgmentsMap.get(project.id) ?? null;

        const periodStart = getPeriodStart(
          lastJudgment?.judgmentDate ?? null,
          project.createdAt
        );

        // 判定期間の提出をチェック
        const submissions = await db.submission.findInPeriod(
          supabase,
          project.id,
          periodStart.toISOString(),
          periodEnd.toISOString()
        );

        const submitted = submissions.length > 0;
        const judgmentDateStr = periodEnd.toISOString();

        // 冪等性チェック: 既に判定済みならスキップ
        const existingJudgment = await db.judgmentLog.findByProjectAndDate(
          supabase,
          project.id,
          judgmentDateStr
        );
        if (existingJudgment) {
          console.log(`[Judgment] Project ${project.id}: Already judged, skipping`);
          skippedCount++;
          continue;
        }

        // 判定ログを作成
        await db.judgmentLog.create(supabase, {
          userId: project.userId,
          projectId: project.id,
          judgmentDate: judgmentDateStr,
          submitted,
          penaltyExecuted: !submitted,
          penaltyAmount: submitted ? null : project.penaltyAmount,
        });

        // バッチ取得済みのユーザー情報を使用
        const user = userMap.get(project.userId);

        if (submitted) {
          submittedCount++;

          // 提出済み通知
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
      skipped: skippedCount,
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
