import { getUserWithProfile } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Sparkles, FolderKanban, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUserWithProfile();
  if (!user) redirect("/login");

  const supabase = createServiceClient();

  // 統計データを取得
  const [memoCount, candidateCount, projectCount, pendingSuggestions] = await Promise.all([
    db.memo.count(supabase, user.id),
    (async () => {
      const { count } = await supabase
        .from("AiCandidate")
        .select("*", { count: "exact", head: true })
        .eq("userId", user.id)
        .eq("status", "pending");
      return count || 0;
    })(),
    db.project.count(supabase, user.id),
    (async () => {
      const { count } = await supabase
        .from("ProjectSuggestion")
        .select("*", { count: "exact", head: true })
        .eq("userId", user.id)
        .eq("status", "pending");
      return count || 0;
    })(),
  ]);

  // 最近のメモ
  const { data: recentMemos } = await supabase
    .from("Memo")
    .select("*")
    .eq("userId", user.id)
    .order("createdAt", { ascending: false })
    .limit(5);

  // プロジェクトのファイル数（最重要KPI）
  const projects = await db.project.findMany(supabase, user.id);
  const projectsWithArticleCount = await Promise.all(
    projects.slice(0, 3).map(async (project) => {
      const { count } = await supabase
        .from("Article")
        .select("*", { count: "exact", head: true })
        .eq("projectId", project.id);
      return {
        ...project,
        _count: { articles: count || 0 },
      };
    })
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          おかえりなさい、{user.profile?.name || "ユーザー"}さん
        </p>
      </div>

      {/* 統計カード */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">観測ログ</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memoCount}</div>
            <p className="text-xs text-muted-foreground">記録した思考の断片</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AIからの提案</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{candidateCount}</div>
            <p className="text-xs text-muted-foreground">未判断のコンテンツ案</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">プロジェクト</CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectCount}</div>
            <p className="text-xs text-muted-foreground">進行中の連載</p>
          </CardContent>
        </Card>
        <Card className={pendingSuggestions > 0 ? "border-primary" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">新しい提案</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingSuggestions}</div>
            <p className="text-xs text-muted-foreground">AIコーチからの提案</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 最近の観測ログ */}
        <Card>
          <CardHeader>
            <CardTitle>最近の観測ログ</CardTitle>
            <CardDescription>直近で記録した思考</CardDescription>
          </CardHeader>
          <CardContent>
            {!recentMemos || recentMemos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>まだ観測ログがありません</p>
                <Link
                  href="/memos"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  最初のメモを作成する
                </Link>
              </div>
            ) : (
              <ul className="space-y-3">
                {recentMemos.map((memo) => (
                  <li key={memo.id} className="border-b pb-3 last:border-0">
                    <p className="text-sm line-clamp-2">{memo.content}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(memo.createdAt).toLocaleDateString("ja-JP")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* プロジェクト進捗 */}
        <Card>
          <CardHeader>
            <CardTitle>プロジェクト進捗</CardTitle>
            <CardDescription>進行中のプロジェクトのファイル数</CardDescription>
          </CardHeader>
          <CardContent>
            {projectsWithArticleCount.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>まだプロジェクトがありません</p>
                <Link
                  href="/ai-editor"
                  className="text-primary hover:underline text-sm mt-2 inline-block"
                >
                  AIコーチに相談する
                </Link>
              </div>
            ) : (
              <ul className="space-y-4">
                {projectsWithArticleCount.map((project) => (
                  <li key={project.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-sm">{project.title}</span>
                      <span className="text-2xl font-bold">
                        {project._count.articles}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min(project._count.articles * 10, 100)}%`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 次のアクションサジェスト */}
      {pendingSuggestions > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              AIコーチからの提案があります
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              あなたの観測ログを分析し、新しいプロジェクトの提案があります。
            </p>
            <Link
              href="/ai-editor"
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            >
              提案を確認する
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
