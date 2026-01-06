import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createSupabaseClient, type User } from "../_shared/supabase.ts";
import { sendLineMessage, createUrgentReminder } from "../_shared/line.ts";

serve(async () => {
  const supabase = createSupabaseClient();
  const results = { sent: 0, skipped: 0, errors: 0 };

  try {
    // LINE連携済みで期限超過通知ONのユーザー
    const { data: users } = await supabase
      .from("User")
      .select("*")
      .not("lineUserId", "is", null)
      .eq("notifyUrgent", true);

    // 過去1時間以内の判定ログ（判定直後を想定）
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    for (const user of (users as User[]) || []) {
      try {
        // 直近の未提出判定を取得
        const { data: judgments } = await supabase
          .from("JudgmentLog")
          .select("id, projectId, penaltyAmount")
          .eq("userId", user.id)
          .eq("submitted", false)
          .gte("createdAt", oneHourAgo);

        if (!judgments || judgments.length === 0) {
          results.skipped++;
          continue;
        }

        // プロジェクト名を取得
        const projectIds = judgments.map((j) => j.projectId);
        const { data: projects } = await supabase
          .from("Project")
          .select("id, name")
          .in("id", projectIds);

        if (!projects) {
          results.skipped++;
          continue;
        }

        const missedProjects = judgments.map((j) => {
          const project = projects.find((p) => p.id === j.projectId);
          return {
            name: project?.name || "不明",
            penaltyAmount: j.penaltyAmount || 0,
          };
        });

        const message = createUrgentReminder(missedProjects);
        if (message && user.lineUserId) {
          const sent = await sendLineMessage(user.lineUserId, message);
          sent ? results.sent++ : results.errors++;
        }
      } catch (err) {
        console.error(`Urgent remind error for ${user.id}:`, err);
        results.errors++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, ...results }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Urgent reminder error:", error);
    return new Response(
      JSON.stringify({ error: "Urgent reminder failed" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
