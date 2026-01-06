"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, CheckCircle2, AlertCircle } from "lucide-react";

type Project = {
  id: string;
  name: string;
  nextJudgmentDate: string | null;
  status: string;
};

export default function SubmitPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectIdParam = searchParams.get("project");

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [submittedNum, setSubmittedNum] = useState<number | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    if (projectIdParam && projects.length > 0) {
      setSelectedProjectId(projectIdParam);
    }
  }, [projectIdParam, projects]);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects?status=active");
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data);
      if (data.length > 0 && !projectIdParam) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch projects:", err);
      setError("プロジェクトの取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedProjectId) {
      setError("プロジェクトを選択してください");
      return;
    }

    if (!content.trim()) {
      setError("内容を入力してください");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          content: content.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "提出に失敗しました");
      }

      const submission = await res.json();
      setSubmittedNum(submission.sequenceNum);
      setSuccess(true);
      setContent("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-muted-foreground" />
              プロジェクトがありません
            </CardTitle>
            <CardDescription>
              提出するには、まずプロジェクトを作成してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/projects")}>
              プロジェクトを作成
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-6 w-6" />
              提出完了
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-2xl font-bold">
              #{String(submittedNum).padStart(3, "0")}
            </p>
            <p className="text-muted-foreground">
              {selectedProject?.name} への提出を受領しました。
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(false);
                  setSubmittedNum(null);
                }}
              >
                続けて提出
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                ダッシュボードへ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">提出</h1>
        <p className="text-muted-foreground mt-1">
          内容は問いません。提出することが重要です。
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* プロジェクト選択 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プロジェクト</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                  {project.nextJudgmentDate &&
                    ` (次回判定: ${new Date(project.nextJudgmentDate).toLocaleDateString("ja-JP")})`
                  }
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* 提出内容 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">内容</CardTitle>
            <CardDescription>
              未完成でもOK。クオリティは評価しません。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="何でも書いてください。1文字以上あれば提出として受理されます。"
              className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none"
            />
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
            {error}
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={submitting || !content.trim()}
        >
          {submitting ? (
            "提出中..."
          ) : (
            <>
              <Send className="h-4 w-4 mr-2" />
              提出する
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
