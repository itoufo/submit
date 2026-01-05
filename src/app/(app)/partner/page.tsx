"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Copy, Check, Heart, Bell, UserPlus } from "lucide-react";

interface Supporter {
  id: string;
  status: string;
  inviteToken: string | null;
  createdAt: string;
  supporter: {
    id: string;
    name: string | null;
    email: string;
  };
}

interface Cheer {
  id: string;
  message: string;
  createdAt: string;
  supporter: {
    name: string | null;
    email: string;
  };
}

export default function PartnerPage() {
  const [supporters, setSupporters] = useState<Supporter[]>([]);
  const [cheers, setCheers] = useState<Cheer[]>([]);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [supportersRes, cheersRes] = await Promise.all([
        fetch("/api/partner/supporters"),
        fetch("/api/partner/cheers"),
      ]);

      if (supportersRes.ok) setSupporters(await supportersRes.json());
      if (cheersRes.ok) setCheers(await cheersRes.json());
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteUrl = async () => {
    setGenerating(true);
    try {
      const res = await fetch("/api/partner/invite", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setInviteUrl(`${window.location.origin}/invite/${data.token}`);
      }
    } catch (error) {
      console.error("Failed to generate invite:", error);
    } finally {
      setGenerating(false);
    }
  };

  const copyInviteUrl = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const activeSupporters = supporters.filter((s) => s.status === "active");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">パートナー連携</h1>
        <p className="text-muted-foreground mt-1">
          大切な人にあなたの進捗を共有して、応援してもらおう
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* パートナー招待 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              パートナーを招待
            </CardTitle>
            <CardDescription>
              恋人や家族、友人を「サポーター」として招待できます
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {inviteUrl ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input value={inviteUrl} readOnly className="flex-1" />
                  <Button onClick={copyInviteUrl} variant="outline" size="icon">
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  このURLを大切な人に共有してください。24時間有効です。
                </p>
              </div>
            ) : (
              <Button
                onClick={generateInviteUrl}
                disabled={generating}
                className="w-full"
              >
                {generating ? "生成中..." : "招待URLを発行"}
              </Button>
            )}
          </CardContent>
        </Card>

        {/* 現在のパートナー */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              パートナー一覧
              {activeSupporters.length > 0 && (
                <Badge>{activeSupporters.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                読み込み中...
              </div>
            ) : activeSupporters.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">まだパートナーがいません</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {activeSupporters.map((supporter) => (
                  <li
                    key={supporter.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">
                        {supporter.supporter.name || "名前未設定"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {supporter.supporter.email}
                      </p>
                    </div>
                    <Badge variant="outline">サポーター</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 応援履歴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            受け取った応援
          </CardTitle>
          <CardDescription>
            パートナーからの応援メッセージ
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              読み込み中...
            </div>
          ) : cheers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Heart className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">まだ応援メッセージがありません</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cheers.map((cheer) => (
                <div
                  key={cheer.id}
                  className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/10 rounded-lg"
                >
                  <Heart className="h-5 w-5 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm">{cheer.message}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>{cheer.supporter.name || cheer.supporter.email}</span>
                      <span>·</span>
                      <span>
                        {new Date(cheer.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 通知設定への案内 */}
      <Card className="border-dashed">
        <CardContent className="py-6">
          <div className="flex items-center gap-4">
            <Bell className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <h3 className="font-medium">通知設定</h3>
              <p className="text-sm text-muted-foreground">
                パートナーにあなたの進捗を自動通知する設定は、設定画面から行えます
              </p>
            </div>
            <Link href="/settings">
              <Button variant="outline">設定を開く</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
