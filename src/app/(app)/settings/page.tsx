"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Palette, Shield, Save, Check } from "lucide-react";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setEmail(user.email || "");
        setName(user.user_metadata?.name || "");
      }
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { name },
      });

      if (error) throw error;

      // Prismaのユーザーも更新
      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground mt-1">
          アカウントと通知の設定を管理
        </p>
      </div>

      {/* プロフィール設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            プロフィール
          </CardTitle>
          <CardDescription>
            基本情報を設定します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">名前</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="山田太郎"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">メールアドレス</label>
            <Input value={email} disabled />
            <p className="text-xs text-muted-foreground">
              メールアドレスの変更はサポートにお問い合わせください
            </p>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              "保存中..."
            ) : saved ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                保存しました
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                保存
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 通知設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            通知設定
          </CardTitle>
          <CardDescription>
            パートナーへの通知設定を管理します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">新しいコンテンツ追加時</p>
              <p className="text-sm text-muted-foreground">
                プロジェクトに新しいコンテンツを追加した時に通知
              </p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">マイルストーン達成時</p>
              <p className="text-sm text-muted-foreground">
                プロジェクトが10件に達した時などに通知
              </p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">週次サマリー</p>
              <p className="text-sm text-muted-foreground">
                週に一度、進捗サマリーを送信
              </p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      {/* テーマ設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            表示設定
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">ダークモード</p>
              <p className="text-sm text-muted-foreground">
                システム設定に従います
              </p>
            </div>
            <Badge variant="secondary">自動</Badge>
          </div>
        </CardContent>
      </Card>

      {/* プラン */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            プラン
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">現在のプラン</p>
              <p className="text-sm text-muted-foreground">
                AI生成回数やプロジェクト数の上限
              </p>
            </div>
            <Badge>Free</Badge>
          </div>
          <Button variant="outline" className="mt-4" disabled>
            プランをアップグレード（Coming Soon）
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
