import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, FolderKanban, AlertTriangle, Calendar, CheckCircle2, XCircle } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUserWithProfile();
  if (!user) redirect("/login");

  // 誓約未完了の場合は誓約ページへ
  if (!user.pledgedAt) {
    redirect("/pledge");
  }

  const supabase = createServiceClient();

  // 統計データを取得
  const [projectCount, totalSubmissions, totalMissed, totalPenalty] = await Promise.all([
    db.project.count(supabase, user.id),
    db.submission.count(supabase, user.id),
    db.judgmentLog.countMissed(supabase, user.id),
    db.penaltyLog.getTotalAmount(supabase, user.id),
  ]);

  // アクティブなプロジェクト一覧
  const projects = await db.project.findMany(supabase, user.id, "active");

  // 直近の判定ログ
  const recentJudgments = await db.judgmentLog.findMany(supabase, user.id, 5);

  // 次の判定日が近いプロジェクト
  const upcomingDeadlines = projects
    .filter((p) => p.nextJudgmentDate)
    .sort((a, b) =>
      new Date(a.nextJudgmentDate!).getTime() - new Date(b.nextJudgmentDate!).getTime()
    )
    .slice(0, 3);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          提出したか、していないか。それだけ。
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">プロジェクト</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">進行中のプロジェクト</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計提出</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalSubmissions}</div>
            <p className="text-xs text-muted-foreground">これまでの提出数</p>
          </CardContent>
        </Card>
        <Card className={totalMissed > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未提出回数</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMissed}</div>
            <p className="text-xs text-muted-foreground">ペナルティ発生回数</p>
          </CardContent>
        </Card>
        <Card className={totalPenalty > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">累計ペナルティ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{totalPenalty.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">支払った罰金総額</p>
          </CardContent>
        </Card>
      </div>

      {/* 次の判定日 */}
      {upcomingDeadlines.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              次の判定日
            </CardTitle>
            <CardDescription>期限内に提出してください</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {upcomingDeadlines.map((project) => {
                const daysLeft = Math.ceil(
                  (new Date(project.nextJudgmentDate!).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                );
                const isUrgent = daysLeft <= 2;
                return (
                  <li key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground">
                        罰金: ¥{project.penaltyAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${isUrgent ? "text-destructive" : ""}`}>
                        {daysLeft <= 0 ? "今日" : `あと${daysLeft}日`}
                      </p>
                      <Link
                        href={`/submit?project=${project.id}`}
                        className="text-sm text-primary hover:underline"
                      >
                        提出する →
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 判定履歴 */}
        <Card>
          <CardHeader>
            <CardTitle>判定履歴</CardTitle>
            <CardDescription>直近の判定結果</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJudgments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>まだ判定履歴がありません</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentJudgments.map((log) => (
                  <li key={log.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="flex items-center gap-2">
                      {log.submitted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <span className={log.submitted ? "" : "text-destructive"}>
                        {log.submitted ? "提出済" : "未提出"}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">
                        {new Date(log.judgmentDate).toLocaleDateString("ja-JP")}
                      </p>
                      {!log.submitted && log.penaltyAmount && (
                        <p className="text-xs text-destructive">
                          -¥{log.penaltyAmount.toLocaleString()}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* プロジェクト一覧 */}
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト</CardTitle>
            <CardDescription>進行中のプロジェクト</CardDescription>
          </CardHeader>
          <CardContent>
            {projects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>プロジェクトがありません</p>
                <Link
                  href="/projects"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  プロジェクトを作成する
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {projects.slice(0, 5).map((project) => (
                  <li key={project.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-xs text-muted-foreground">
                        提出: {project.submissionCount} / 未提出: {project.missedCount}
                      </p>
                    </div>
                    <Link
                      href={`/submit?project=${project.id}`}
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      <Send className="h-3 w-3" />
                      提出
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 提出ボタン */}
      <div className="text-center py-4">
        <Link
          href="/submit"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-lg font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-12 px-8"
        >
          <Send className="h-5 w-5 mr-2" />
          提出する
        </Link>
      </div>
    </div>
  );
}
