import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, type User } from "../_shared/supabase.ts";
import { sendLineMessage, createEveningReminder } from "../_shared/line.ts";

serve(async () => {
  const supabase = createSupabaseClient();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    // LINE連携済みで夜リマインドONのユーザー
    const { data: users } = await supabase
      .from("User")
      .select("*")
      .not("lineUserId", "is", null)
      .eq("notifyEvening", true);

    // 今日の範囲
    const today = new Date();
    const todayStart = new Date(today);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    for (const user of (users as User[]) || []) {
      try {
        // 今日が期限のプロジェクト
        const { data: projects } = await supabase
          .from("Project")
          .select("id, name, penaltyAmount, nextJudgmentDate")
          .eq("userId", user.id)
          .eq("status", "active")
          .gte("nextJudgmentDate", todayStart.toISOString())
          .lte("nextJudgmentDate", todayEnd.toISOString());

        if (!projects || projects.length === 0) {
          results.skipped++;
          continue;
        }

        // 未提出のプロジェクトをフィルタ
        const pendingProjects: { name: string; penaltyAmount: number }[] = [];

        for (const project of projects) {
          const { data: submissions } = await supabase
            .from("Submission")
            .select("id")
            .eq("projectId", project.id)
            .gte("createdAt", todayStart.toISOString())
            .limit(1);

          if (!submissions || submissions.length === 0) {
            pendingProjects.push({
              name: project.name,
              penaltyAmount: project.penaltyAmount,
            });
          }
        }

        if (pendingProjects.length === 0) {
          results.skipped++;
          continue;
        }

        const message = createEveningReminder(pendingProjects);
        if (message && user.lineUserId) {
          const sent = await sendLineMessage(user.lineUserId, message);
          sent ? results.sent++ : results.errors++;
        }
      } catch (err) {
        console.error(`Evening remind error for ${user.id}:`, err);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Evening reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Evening reminder failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
