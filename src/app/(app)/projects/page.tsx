"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FolderKanban, Plus, FileText, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface Article {
  id: string;
  content: string;
  platform: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  createdAt: string;
  articles: Article[];
  _count: {
    articles: number;
  };
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">プロジェクト</h1>
          <p className="text-muted-foreground mt-1">
            進行中のプロジェクト。コンテンツが溜まったら公開しよう。
          </p>
        </div>
        <Link href="/ai-editor">
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            AIに提案してもらう
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          読み込み中...
        </div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="font-medium mb-2">まだプロジェクトがありません</h3>
            <p className="text-sm text-muted-foreground mb-4">
              AIコーチがあなたの観測ログを分析してプロジェクトを提案します
            </p>
            <Link href="/ai-editor">
              <Button>
                <Sparkles className="h-4 w-4 mr-2" />
                AIコーチに相談する
              </Button>
            </Link>
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
                }`}
                onClick={() => loadProjectDetail(project.id)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{project.title}</CardTitle>
                    <Badge variant="secondary" className="text-lg">
                      {project._count.articles}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {project._count.articles} ファイル
                    </span>
                    <span>
                      {new Date(project.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                  {/* 進捗バー */}
                  <div className="mt-3">
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary rounded-full h-2 transition-all"
                        style={{
                          width: `${Math.min(project._count.articles * 10, 100)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {project._count.articles >= 10
                        ? "公開準備完了！"
                        : `あと ${10 - project._count.articles} ファイルで公開推奨`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* プロジェクト詳細 */}
          <div>
            {selectedProject ? (
              <Card>
                <CardHeader>
                  <CardTitle>{selectedProject.title}</CardTitle>
                  {selectedProject.description && (
                    <CardDescription>{selectedProject.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">コンテンツ一覧</h3>
                    <Badge>{selectedProject.articles.length} 件</Badge>
                  </div>
                  {selectedProject.articles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">まだコンテンツがありません</p>
                      <p className="text-xs mt-1">
                        AIコーチでコンテンツを生成して追加しよう
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                      {selectedProject.articles.map((article) => (
                        <div
                          key={article.id}
                          className="p-3 border rounded-lg space-y-2"
                        >
                          <p className="text-sm line-clamp-3">{article.content}</p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>
                              {new Date(article.createdAt).toLocaleDateString("ja-JP")}
                            </span>
                            {article.publishedAt ? (
                              <Badge variant="outline" className="text-xs">
                                <ExternalLink className="h-3 w-3 mr-1" />
                                {article.platform}で公開済み
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                下書き
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
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
