"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles,
  Check,
  X,
  RefreshCw,
  FileText,
  Lightbulb,
  FolderPlus,
} from "lucide-react";

interface Memo {
  id: string;
  content: string;
  tags: string | null;
  createdAt: string;
}

interface AiCandidate {
  id: string;
  content: string;
  format: string;
  status: string;
  createdAt: string;
}

interface ProjectSuggestion {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  status: string;
  createdAt: string;
}

export default function AiEditorPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [selectedMemos, setSelectedMemos] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<AiCandidate[]>([]);
  const [suggestions, setSuggestions] = useState<ProjectSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingProject, setGeneratingProject] = useState(false);
  const [format, setFormat] = useState("tweet");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [memosRes, candidatesRes, suggestionsRes] = await Promise.all([
        fetch("/api/memos"),
        fetch("/api/ai/candidates"),
        fetch("/api/ai/suggestions"),
      ]);

      if (memosRes.ok) setMemos(await memosRes.json());
      if (candidatesRes.ok) setCandidates(await candidatesRes.json());
      if (suggestionsRes.ok) setSuggestions(await suggestionsRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemo = (id: string) => {
    setSelectedMemos((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const generateContent = async () => {
    if (selectedMemos.length === 0) return;
    setGenerating(true);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memoIds: selectedMemos,
          format,
        }),
      });

      if (res.ok) {
        const candidate = await res.json();
        setCandidates([candidate, ...candidates]);
        setSelectedMemos([]);
      }
    } catch (error) {
      console.error("Failed to generate:", error);
    } finally {
      setGenerating(false);
    }
  };

  const generateProjectSuggestion = async () => {
    setGeneratingProject(true);

    try {
      const res = await fetch("/api/ai/suggest-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        const suggestion = await res.json();
        setSuggestions([suggestion, ...suggestions]);
      }
    } catch (error) {
      console.error("Failed to generate project suggestion:", error);
    } finally {
      setGeneratingProject(false);
    }
  };

  const handleCandidateAction = async (id: string, action: "adopted" | "rejected") => {
    try {
      const res = await fetch(`/api/ai/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        setCandidates(candidates.map((c) =>
          c.id === id ? { ...c, status: action } : c
        ));
      }
    } catch (error) {
      console.error("Failed to update candidate:", error);
    }
  };

  const handleSuggestionAction = async (id: string, action: "accepted" | "rejected") => {
    try {
      const res = await fetch(`/api/ai/suggestions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: action }),
      });

      if (res.ok) {
        setSuggestions(suggestions.map((s) =>
          s.id === id ? { ...s, status: action } : s
        ));
        if (action === "accepted") {
          // リロードしてプロジェクトを反映
          loadData();
        }
      }
    } catch (error) {
      console.error("Failed to update suggestion:", error);
    }
  };

  const pendingCandidates = candidates.filter((c) => c.status === "pending");
  const pendingSuggestions = suggestions.filter((s) => s.status === "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">AIコーチ</h1>
        <p className="text-muted-foreground mt-1">
          あなたの思考をコンテンツに変える。判断するだけで良い。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* 左側：メモ選択とコンテンツ生成 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                観測ログからコンテンツを生成
              </CardTitle>
              <CardDescription>
                メモを選択してAIにコンテンツを作ってもらおう
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={format === "tweet" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("tweet")}
                >
                  X投稿
                </Button>
                <Button
                  variant={format === "blog" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("blog")}
                >
                  ブログ記事
                </Button>
                <Button
                  variant={format === "note" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormat("note")}
                >
                  note記事
                </Button>
              </div>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  読み込み中...
                </div>
              ) : memos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  まず観測ログを作成してください
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {memos.slice(0, 20).map((memo) => (
                    <div
                      key={memo.id}
                      onClick={() => toggleMemo(memo.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMemos.includes(memo.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted"
                      }`}
                    >
                      <p className="text-sm line-clamp-2">{memo.content}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(memo.createdAt).toLocaleDateString("ja-JP")}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              <Button
                onClick={generateContent}
                disabled={selectedMemos.length === 0 || generating}
                className="w-full"
              >
                {generating ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    選択したメモからコンテンツを生成
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* プロジェクト提案生成 */}
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                プロジェクト提案を受ける
              </CardTitle>
              <CardDescription>
                AIがあなたの観測ログを分析し、新しいプロジェクトを提案します
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={generateProjectSuggestion}
                disabled={generatingProject || memos.length < 3}
                variant="outline"
                className="w-full"
              >
                {generatingProject ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    分析中...
                  </>
                ) : (
                  <>
                    <FolderPlus className="h-4 w-4 mr-2" />
                    AIにプロジェクトを提案してもらう
                  </>
                )}
              </Button>
              {memos.length < 3 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  ※ 3つ以上の観測ログが必要です
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右側：AIからの提案 */}
        <div className="space-y-6">
          {/* プロジェクト提案 */}
          {pendingSuggestions.length > 0 && (
            <Card className="border-primary">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-primary" />
                  プロジェクト提案
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pendingSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="p-4 border rounded-lg space-y-3">
                    <h3 className="font-bold">{suggestion.title}</h3>
                    <p className="text-sm">{suggestion.description}</p>
                    <div className="p-3 bg-muted rounded text-sm">
                      <p className="text-muted-foreground font-medium mb-1">
                        提案の理由：
                      </p>
                      <p>{suggestion.reasoning}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleSuggestionAction(suggestion.id, "accepted")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        プロジェクトを始める
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleSuggestionAction(suggestion.id, "rejected")}
                      >
                        <X className="h-4 w-4 mr-1" />
                        今はやめておく
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* コンテンツ候補 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                コンテンツ案
                {pendingCandidates.length > 0 && (
                  <Badge>{pendingCandidates.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                採用・却下を判断してください
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingCandidates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  未判断のコンテンツ案はありません
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCandidates.map((candidate) => (
                    <div key={candidate.id} className="p-4 border rounded-lg space-y-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{candidate.format}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(candidate.createdAt).toLocaleDateString("ja-JP")}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{candidate.content}</p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleCandidateAction(candidate.id, "adopted")}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          採用
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCandidateAction(candidate.id, "rejected")}
                        >
                          <X className="h-4 w-4 mr-1" />
                          却下
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
