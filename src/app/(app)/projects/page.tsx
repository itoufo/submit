"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Plus,
  Send,
  Calendar,
  AlertTriangle,
  Pause,
  Play,
  Trash2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface Submission {
  id: string;
  sequenceNum: number;
  content: string;
  createdAt: string;
}

interface JudgmentLog {
  id: string;
  judgmentDate: string;
  submitted: boolean;
  penaltyAmount: number | null;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  judgmentDay: number;
  penaltyAmount: number;
  status: string;
  nextJudgmentDate: string | null;
  submissionCount: number;
  missedCount: number;
  totalPenaltyAmount: number;
  createdAt: string;
  submissions?: Submission[];
  judgmentLogs?: JudgmentLog[];
}

const DAYS = ["日", "月", "火", "水", "木", "金", "土"];
const FREQUENCIES: Record<string, string> = {
  daily: "毎日",
  weekly: "週1回",
  biweekly: "隔週",
  monthly: "月1回",
};

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);

  // 新規作成フォーム
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newJudgmentDay, setNewJudgmentDay] = useState(0);
  const [newPenaltyAmount, setNewPenaltyAmount] = useState(1000);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadProjectDetail = async (id: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedProject(data);
      }
    } catch (error) {
      console.error("Failed to load project:", error);
    }
  };

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDescription.trim() || null,
          frequency: newFrequency,
          judgmentDay: newJudgmentDay,
          penaltyAmount: newPenaltyAmount,
        }),
      });

      if (res.ok) {
        setShowCreateForm(false);
        setNewName("");
        setNewDescription("");
        setNewFrequency("daily");
        setNewJudgmentDay(0);
        setNewPenaltyAmount(1000);
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
    } finally {
      setCreating(false);
    }
  };

  const updateProjectStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        loadProjects();
        if (selectedProject?.id === id) {
          loadProjectDetail(id);
        }
      }
    } catch (error) {
      console.error("Failed to update project:", error);
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("本当に削除しますか？この操作は取り消せません。")) return;

    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSelectedProject(null);
        loadProjects();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">プロジェクト</h1>
          <p className="text-muted-foreground mt-1">
            提出を管理するプロジェクト
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          新規作成
        </Button>
      </div>

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>新規プロジェクト作成</CardTitle>
            <CardDescription>
              提出頻度とペナルティを設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">プロジェクト名 *</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="例: 週刊ブログ更新"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">説明（任意）</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="例: 毎週月曜日にブログを1記事公開する"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">提出頻度</label>
                  <select
                    value={newFrequency}
                    onChange={(e) => setNewFrequency(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="daily">毎日</option>
                    <option value="weekly">週1回</option>
                    <option value="biweekly">隔週</option>
                    <option value="monthly">月1回</option>
                  </select>
                </div>
                {newFrequency !== "daily" && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">判定日（曜日）</label>
                    <select
                      value={newJudgmentDay}
                      onChange={(e) => setNewJudgmentDay(Number(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      {DAYS.map((day, i) => (
                        <option key={i} value={i}>{day}曜日</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">罰金額（円）</label>
                <Input
                  type="number"
                  value={newPenaltyAmount}
                  onChange={(e) => setNewPenaltyAmount(Number(e.target.value))}
                  min={100}
                  step={100}
                />
                <p className="text-xs text-muted-foreground">
                  未提出時に自動で決済されます。最低100円から。
                </p>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={creating}>
                  {creating ? "作成中..." : "作成"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  キャンセル
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          読み込み中...
        </div>
      ) : projects.length === 0 && !showCreateForm ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">まだプロジェクトがありません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              プロジェクトを作成して、提出を始めましょう
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              プロジェクトを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* プロジェクト一覧 */}
          <div className="space-y-4">
            <h2 className="font-semibold text-lg">プロジェクト一覧</h2>
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer transition-colors ${
                  selectedProject?.id === project.id
                    ? "border-primary"
                    : "hover:border-muted-foreground/30"
                } ${project.status === "paused" ? "opacity-60" : ""}`}
                onClick={() => loadProjectDetail(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {project.name}
                        {project.status === "paused" && (
                          <Badge variant="secondary">停止中</Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-1">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {FREQUENCIES[project.frequency]}
                      {project.frequency !== "daily" && ` / ${DAYS[project.judgmentDay]}曜`}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      ¥{project.penaltyAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span className="text-green-600">
                      提出: {project.submissionCount}
                    </span>
                    <span className="text-destructive">
                      未提出: {project.missedCount}
                    </span>
                  </div>
                  {project.nextJudgmentDate && project.status === "active" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      次回判定: {new Date(project.nextJudgmentDate).toLocaleDateString("ja-JP")}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* プロジェクト詳細 */}
          <div>
            {selectedProject ? (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{selectedProject.name}</CardTitle>
                      {selectedProject.description && (
                        <CardDescription>{selectedProject.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {selectedProject.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProjectStatus(selectedProject.id, "paused")}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          停止
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateProjectStatus(selectedProject.id, "active")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          再開
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteProject(selectedProject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 統計 */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold">{selectedProject.submissionCount}</div>
                      <div className="text-xs text-muted-foreground">提出</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-destructive">{selectedProject.missedCount}</div>
                      <div className="text-xs text-muted-foreground">未提出</div>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <div className="text-2xl font-bold text-destructive">
                        ¥{selectedProject.totalPenaltyAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">累計罰金</div>
                    </div>
                  </div>

                  {/* 提出ボタン */}
                  {selectedProject.status === "active" && (
                    <Button
                      className="w-full"
                      onClick={() => router.push(`/submit?project=${selectedProject.id}`)}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      このプロジェクトに提出
                    </Button>
                  )}

                  {/* 判定履歴 */}
                  <div>
                    <h3 className="font-medium mb-2">判定履歴</h3>
                    {!selectedProject.judgmentLogs || selectedProject.judgmentLogs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">まだ判定履歴がありません</p>
                    ) : (
                      <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedProject.judgmentLogs.map((log) => (
                          <li key={log.id} className="flex items-center justify-between text-sm border-b pb-2">
                            <div className="flex items-center gap-2">
                              {log.submitted ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive" />
                              )}
                              <span>{log.submitted ? "提出済" : "未提出"}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-muted-foreground">
                                {new Date(log.judgmentDate).toLocaleDateString("ja-JP")}
                              </span>
                              {!log.submitted && log.penaltyAmount && (
                                <span className="ml-2 text-destructive">
                                  -¥{log.penaltyAmount.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* 提出履歴 */}
                  <div>
                    <h3 className="font-medium mb-2">提出履歴</h3>
                    {!selectedProject.submissions || selectedProject.submissions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">まだ提出がありません</p>
                    ) : (
                      <ul className="space-y-2 max-h-[200px] overflow-y-auto">
                        {selectedProject.submissions.map((sub) => (
                          <li key={sub.id} className="p-2 border rounded text-sm">
                            <div className="flex justify-between items-start mb-1">
                              <Badge variant="outline">#{String(sub.sequenceNum).padStart(3, "0")}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(sub.createdAt).toLocaleDateString("ja-JP")}
                              </span>
                            </div>
                            <p className="line-clamp-2 text-muted-foreground">{sub.content}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-12 text-center text-muted-foreground">
                  <FolderKanban className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>プロジェクトを選択して詳細を表示</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
