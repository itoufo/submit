"use client";

import { useState, useEffect, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Tag, Trash2 } from "lucide-react";

interface Memo {
  id: string;
  content: string;
  tags: string | null;
  createdAt: string;
}

export default function MemosPage() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [newMemo, setNewMemo] = useState("");
  const [newTags, setNewTags] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  useEffect(() => {
    loadMemos();
  }, []);

  const loadMemos = async () => {
    try {
      const res = await fetch("/api/memos");
      if (res.ok) {
        const data = await res.json();
        setMemos(data);
      }
    } catch (error) {
      console.error("Failed to load memos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemo.trim()) return;

    startTransition(async () => {
      try {
        const res = await fetch("/api/memos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: newMemo,
            tags: newTags || null,
          }),
        });

        if (res.ok) {
          const created = await res.json();
          setMemos([created, ...memos]);
          setNewMemo("");
          setNewTags("");
        }
      } catch (error) {
        console.error("Failed to create memo:", error);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このメモを削除しますか？")) return;

    try {
      const res = await fetch(`/api/memos/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMemos(memos.filter((m) => m.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete memo:", error);
    }
  };

  const filteredMemos = memos.filter(
    (memo) =>
      memo.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      memo.tags?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">観測ログ</h1>
        <p className="text-muted-foreground mt-1">
          違和感や気づきを1行メモするだけ。思考の断片を記録しよう。
        </p>
      </div>

      {/* 新規メモ入力 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-5 w-5" />
            新しい観測ログ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              placeholder="ふと思ったこと、違和感、気づき... 何でもメモしよう"
              value={newMemo}
              onChange={(e) => setNewMemo(e.target.value)}
              className="min-h-[100px]"
            />
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-2 block">
                  タグ（カンマ区切り）
                </label>
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="仕事, アイデア, 疑問"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                  />
                </div>
              </div>
              <Button type="submit" disabled={isPending || !newMemo.trim()}>
                {isPending ? "保存中..." : "記録する"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* 検索 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="メモを検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* メモ一覧 */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          読み込み中...
        </div>
      ) : filteredMemos.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          {searchQuery ? "検索結果がありません" : "まだ観測ログがありません"}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMemos.map((memo) => (
            <Card key={memo.id} className="group">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className="whitespace-pre-wrap">{memo.content}</p>
                    {memo.tags && (
                      <div className="flex gap-2 mt-3 flex-wrap">
                        {memo.tags.split(",").map((tag, i) => (
                          <Badge key={i} variant="secondary">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-3">
                      {new Date(memo.createdAt).toLocaleString("ja-JP")}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleDelete(memo.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
