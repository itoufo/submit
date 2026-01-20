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
  PencilLine,
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
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPenaltyAmount, setEditPenaltyAmount] = useState(1000);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 新規作成フォーム
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newFrequency, setNewFrequency] = useState("daily");
  const [newJudgmentDay, setNewJudgmentDay] = useState(0);
  const [newPenaltyAmount, setNewPenaltyAmount] = useState(1000);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    if (!selectedProject || editingProjectId !== selectedProject.id) return;
    setEditName(selectedProject.name);
    setEditDescription(selectedProject.description || "");
    setEditPenaltyAmount(selectedProject.penaltyAmount);
  }, [selectedProject, editingProjectId]);

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
    setErrorMessage("");
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
      } else {
        const data = await res.json();
        throw new Error(data.error || "プロジェクトの作成に失敗しました");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "作成に失敗しました";
      setErrorMessage(message);
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

  const startEdit = (project: Project) => {
    setEditingProjectId(project.id);
    setEditName(project.name);
    setEditDescription(project.description || "");
    setEditPenaltyAmount(project.penaltyAmount);
  };

  const cancelEdit = () => {
    setEditingProjectId(null);
    setEditName("");
    setEditDescription("");
    setEditPenaltyAmount(1000);
  };

  const saveEdit = async () => {
    if (!selectedProject) return;
    setErrorMessage("");
    if (!editName.trim()) {
      setErrorMessage("プロジェクト名を入力してください");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${selectedProject.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
          penaltyAmount: editPenaltyAmount,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "更新に失敗しました");
      }

      await loadProjects();
      await loadProjectDetail(selectedProject.id);
      setEditingProjectId(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "更新に失敗しました";
      setErrorMessage(message);
      console.error("Failed to update project:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card/80 p-5 shadow-[0_12px_40px_-30px_rgba(15,23,42,0.6)] backdrop-blur md:p-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Projects
            </p>
            <h1 className="text-2xl font-semibold md:text-3xl">プロジェクト</h1>
            <p className="text-sm text-muted-foreground">
              提出を続けるためのルールとリズムを設計
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => setShowCreateForm(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              新規作成
            </Button>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* 新規作成フォーム */}
      {showCreateForm && (
        <Card className="rounded-3xl border bg-card/80">
          <CardHeader>
            <CardTitle>新規プロジェクト作成</CardTitle>
            <CardDescription>
              提出頻度とペナルティを設定してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={createProject} className="space-y-5">
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
              <div className="grid gap-4 sm:grid-cols-2">
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
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="submit" disabled={creating} className="rounded-full">
                  {creating ? "作成中..." : "作成"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full"
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
        <Card className="rounded-3xl border-dashed bg-card/70">
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">まだプロジェクトがありません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              プロジェクトを作成して、提出を始めましょう
            </p>
            <Button onClick={() => setShowCreateForm(true)} className="rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              プロジェクトを作成
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          {/* プロジェクト一覧 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">プロジェクト一覧</h2>
              <span className="rounded-full border px-3 py-1 text-xs text-muted-foreground">
                {projects.length} 件
              </span>
            </div>
            {projects.map((project) => (
              <Card
                key={project.id}
                className={`cursor-pointer rounded-3xl border bg-card/80 transition-colors ${
                  selectedProject?.id === project.id
                    ? "border-primary shadow-[0_18px_40px_-35px_rgba(15,23,42,0.7)]"
                    : "hover:border-muted-foreground/40"
                } ${project.status === "paused" ? "opacity-70" : ""}`}
                onClick={() => loadProjectDetail(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {project.name}
                        {project.status === "paused" && (
                          <Badge variant="secondary">停止中</Badge>
                        )}
                      </CardTitle>
                      {project.description && (
                        <CardDescription className="line-clamp-2">
                          {project.description}
                        </CardDescription>
                      )}
                    </div>
                    <Badge variant="outline" className="rounded-full text-xs">
                      {FREQUENCIES[project.frequency]}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {project.frequency !== "daily"
                        ? `${DAYS[project.judgmentDay]}曜`
                        : "毎日"}
                    </span>
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4" />
                      ¥{project.penaltyAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-2xl bg-muted/70 px-3 py-2">
                      <p className="text-xs text-muted-foreground">提出</p>
                      <p className="text-lg font-semibold text-green-600">
                        {project.submissionCount}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-muted/70 px-3 py-2">
                      <p className="text-xs text-muted-foreground">未提出</p>
                      <p className="text-lg font-semibold text-destructive">
                        {project.missedCount}
                      </p>
                    </div>
                  </div>
                  {project.nextJudgmentDate && project.status === "active" && (
                    <p className="text-xs text-muted-foreground">
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
              <Card className="rounded-3xl border bg-card/85">
                <CardHeader className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{selectedProject.name}</CardTitle>
                      {selectedProject.description && editingProjectId !== selectedProject.id && (
                        <CardDescription>{selectedProject.description}</CardDescription>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {editingProjectId !== selectedProject.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => startEdit(selectedProject)}
                        >
                          <PencilLine className="h-4 w-4 mr-1" />
                          編集
                        </Button>
                      )}
                      {selectedProject.status === "active" ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => updateProjectStatus(selectedProject.id, "paused")}
                        >
                          <Pause className="h-4 w-4 mr-1" />
                          停止
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => updateProjectStatus(selectedProject.id, "active")}
                        >
                          <Play className="h-4 w-4 mr-1" />
                          再開
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        className="rounded-full"
                        onClick={() => deleteProject(selectedProject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingProjectId === selectedProject.id && (
                    <div className="grid gap-4 rounded-2xl border bg-muted/60 p-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">プロジェクト名 *</label>
                        <Input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          placeholder="例: 週刊ブログ更新"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">説明（任意）</label>
                        <Input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="例: 毎週月曜日にブログを1記事公開"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">罰金額（円）</label>
                        <Input
                          type="number"
                          value={editPenaltyAmount}
                          onChange={(e) => setEditPenaltyAmount(Number(e.target.value))}
                          min={100}
                          step={100}
                        />
                      </div>
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={saveEdit}
                          disabled={saving}
                          className="rounded-full"
                        >
                          {saving ? "保存中..." : "保存"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={cancelEdit}
                          className="rounded-full"
                        >
                          キャンセル
                        </Button>
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 統計 */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="rounded-2xl bg-muted/70 p-3">
                      <div className="text-2xl font-semibold">
                        {selectedProject.submissionCount}
                      </div>
                      <div className="text-xs text-muted-foreground">提出</div>
                    </div>
                    <div className="rounded-2xl bg-muted/70 p-3">
                      <div className="text-2xl font-semibold text-destructive">
                        {selectedProject.missedCount}
                      </div>
                      <div className="text-xs text-muted-foreground">未提出</div>
                    </div>
                    <div className="rounded-2xl bg-muted/70 p-3">
                      <div className="text-2xl font-semibold text-destructive">
                        ¥{selectedProject.totalPenaltyAmount.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">累計罰金</div>
                    </div>
                  </div>

                  {/* 提出ボタン */}
                  {selectedProject.status === "active" && (
                    <Button
                      className="w-full rounded-full"
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
                      <ul className="space-y-3 max-h-[200px] overflow-y-auto">
                        {selectedProject.judgmentLogs.map((log) => (
                          <li
                            key={log.id}
                            className="flex items-center justify-between rounded-2xl border bg-card/70 px-3 py-2 text-sm"
                          >
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
                      <ul className="space-y-3 max-h-[200px] overflow-y-auto">
                        {selectedProject.submissions.map((sub) => (
                          <li key={sub.id} className="rounded-2xl border bg-card/70 p-3 text-sm">
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
              <Card className="rounded-3xl border-dashed bg-card/70">
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
