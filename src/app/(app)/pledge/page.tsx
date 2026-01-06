"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle2, FileText, Ban, MessageSquare } from "lucide-react";

export default function PledgePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [pledged, setPledged] = useState(false);

  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToPenalty, setAgreedToPenalty] = useState(false);
  const [agreedToLine, setAgreedToLine] = useState(false);
  const [pledgeText, setPledgeText] = useState("");

  useEffect(() => {
    checkPledgeStatus();
  }, []);

  const checkPledgeStatus = async () => {
    try {
      const res = await fetch("/api/pledge");
      const data = await res.json();
      if (data.pledged) {
        setPledged(true);
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Failed to check pledge status:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!agreedToTerms || !agreedToPenalty || !agreedToLine) {
      setError("すべての項目に同意してください");
      return;
    }

    if (!pledgeText.trim()) {
      setError("誓約文を入力してください");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/pledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pledgeText,
          agreedToTerms,
          agreedToPenalty,
          agreedToLine,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "誓約の保存に失敗しました");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse text-muted-foreground">読み込み中...</div>
      </div>
    );
  }

  if (pledged) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">誓約</h1>
        <p className="text-muted-foreground">
          SUBMITを利用する前に、以下の内容を確認し同意してください
        </p>
      </div>

      {/* SUBMITの思想説明 */}
      <Card className="border-destructive/50 bg-destructive/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            SUBMITとは
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            SUBMITは<strong>「提出したかどうか」だけを見る</strong>サービスです。
          </p>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
              習慣化を支援しません
            </li>
            <li className="flex items-start gap-2">
              <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
              応援しません
            </li>
            <li className="flex items-start gap-2">
              <Ban className="h-4 w-4 mt-0.5 flex-shrink-0" />
              内容を判断しません
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
              未提出時のペナルティは自動で実行されます
            </li>
          </ul>
          <p className="text-muted-foreground">
            サボる自由はありますが、結果は必ず残ります。
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 同意項目 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">同意事項</CardTitle>
            <CardDescription>以下のすべてに同意してください</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <FileText className="h-4 w-4" />
                  利用規約に同意する
                </div>
                <p className="text-sm text-muted-foreground">
                  SUBMITの利用規約を読み、理解しました
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToPenalty}
                onChange={(e) => setAgreedToPenalty(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  ペナルティに同意する
                </div>
                <p className="text-sm text-muted-foreground">
                  未提出時に設定した罰金が自動で決済されることを理解しています。
                  キャンセルはできません。
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToLine}
                onChange={(e) => setAgreedToLine(e.target.checked)}
                className="mt-1"
              />
              <div>
                <div className="flex items-center gap-2 font-medium">
                  <MessageSquare className="h-4 w-4" />
                  LINE通知に同意する
                </div>
                <p className="text-sm text-muted-foreground">
                  提出時・未提出時にLINEで通知を受け取ります。
                  通知は事実のみで、励ましや叱責はありません。
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        {/* 誓約文入力 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">誓約文</CardTitle>
            <CardDescription>
              あなた自身の言葉で誓約を書いてください（変更不可）
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="例: 私は毎週必ず提出します。未提出の場合はペナルティを受け入れます。"
              value={pledgeText}
              onChange={(e) => setPledgeText(e.target.value)}
              className="w-full"
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
          disabled={submitting || !agreedToTerms || !agreedToPenalty || !agreedToLine || !pledgeText.trim()}
        >
          {submitting ? "処理中..." : "誓約して始める"}
        </Button>
      </form>
    </div>
  );
}
