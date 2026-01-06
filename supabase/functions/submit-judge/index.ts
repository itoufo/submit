import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  createSupabaseClient,
  calculateNextJudgmentDate,
  type User,
} from "../_shared/supabase.ts";
import { sendLineMessage, createJudgmentSuccess } from "../_shared/line.ts";

serve(async () => {
  const supabase = createSupabaseClient();
  const now = new Date();

  const results = {
    processed: 0,
    submitted: 0,
    missed: 0,
    errors: [] as string[],
  };

  try {
    // 判定日が過ぎたアクティブプロジェクトを取得
    const { data: projects, error: projectsError } = await supabase
      .from("Project")
      .select("*")
      .eq("status", "active")
      .lte("nextJudgmentDate", now.toISOString());

    if (projectsError) throw projectsError;

    for (const project of projects || []) {
      try {
        const periodEnd = new Date(project.nextJudgmentDate);

        // 前回判定日を取得
        const { data: lastJudgment } = await supabase
          .from("JudgmentLog")
          .select("judgmentDate")
          .eq("projectId", project.id)
          .order("judgmentDate", { ascending: false })
          .limit(1);

        const lastJudgmentDate = lastJudgment?.[0]?.judgmentDate
          ? new Date(lastJudgment[0].judgmentDate)
          : new Date(project.createdAt);

        // 期間内の提出をチェック
        const { data: periodSubmissions } = await supabase
          .from("Submission")
          .select("id")
          .eq("projectId", project.id)
          .gte("createdAt", lastJudgmentDate.toISOString())
          .lt("createdAt", periodEnd.toISOString());

        const hasSubmission = (periodSubmissions?.length || 0) > 0;

        // 判定ログ作成
        await supabase.from("JudgmentLog").insert({
          id: crypto.randomUUID(),
          userId: project.userId,
          projectId: project.id,
          judgmentDate: periodEnd.toISOString(),
          submitted: hasSubmission,
          penaltyExecuted: !hasSubmission,
          penaltyAmount: hasSubmission ? null : project.penaltyAmount,
          createdAt: now.toISOString(),
        });

        // ユーザー情報取得
        const { data: userProfile } = await supabase
          .from("User")
          .select("*")
          .eq("id", project.userId)
          .single();

        // 次回判定日を計算
        const nextDate = calculateNextJudgmentDate(
          project.frequency,
          project.judgmentDay,
          project.customDays
        );

        if (hasSubmission) {
          // 提出あり
          await supabase
            .from("Project")
            .update({
              submissionCount: project.submissionCount + 1,
              nextJudgmentDate: nextDate.toISOString(),
              updatedAt: now.toISOString(),
            })
            .eq("id", project.id);

          results.submitted++;

          // LINE通知
          if (userProfile?.lineUserId) {
            await sendLineMessage(
              userProfile.lineUserId,
              createJudgmentSuccess(project.name)
            );
          }
        } else {
          // 未提出
          await supabase
            .from("Project")
            .update({
              missedCount: project.missedCount + 1,
              totalPenaltyAmount:
                project.totalPenaltyAmount + project.penaltyAmount,
              nextJudgmentDate: nextDate.toISOString(),
              updatedAt: now.toISOString(),
            })
            .eq("id", project.id);

          // ペナルティログ作成
          await supabase.from("PenaltyLog").insert({
            id: crypto.randomUUID(),
            userId: project.userId,
            amount: project.penaltyAmount,
            status: "pending",
            reason: `${project.name} - ${periodEnd.toLocaleDateString("ja-JP")} 未提出`,
            createdAt: now.toISOString(),
          });

          results.missed++;
          // LINE通知は remind-urgent で送信
        }

        results.processed++;
      } catch (err) {
        results.errors.push(
          `Project ${project.id}: ${err instanceof Error ? err.message : "Unknown"}`
        );
      }
    }

    return new Response(
      JSON.stringify({ success: true, timestamp: now.toISOString(), ...results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Judge error:", error);
    return new Response(
      JSON.stringify({ error: "Judge failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
