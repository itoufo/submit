"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { User, Bell, MessageCircle, Save, Check, Link, Unlink } from "lucide-react";

type UserProfile = {
  id: string;
  name: string | null;
  email: string;
  lineUserId: string | null;
  notifyMorning: boolean;
  notifyEvening: boolean;
  notifyUrgent: boolean;
};

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [notifyMorning, setNotifyMorning] = useState(true);
  const [notifyEvening, setNotifyEvening] = useState(true);
  const [notifyUrgent, setNotifyUrgent] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [connecting, setConnecting] = useState(false);
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

        // プロファイル情報を取得
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data);
          setName(data.name || user.user_metadata?.name || "");
          setNotifyMorning(data.notifyMorning ?? true);
          setNotifyEvening(data.notifyEvening ?? true);
          setNotifyUrgent(data.notifyUrgent ?? true);
        }
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

      await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          notifyMorning,
          notifyEvening,
          notifyUrgent,
        }),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleLineConnect = async () => {
    setConnecting(true);
    try {
      const res = await fetch("/api/line/connect");
      const data = await res.json();
      if (data.connectUrl) {
        window.location.href = data.connectUrl;
      }
    } catch (error) {
      console.error("LINE connect error:", error);
    } finally {
      setConnecting(false);
    }
  };

  const handleLineDisconnect = async () => {
    if (!confirm("LINE連携を解除しますか？リマインド通知が届かなくなります。")) {
      return;
    }
    try {
      const res = await fetch("/api/line/connect", { method: "DELETE" });
      if (res.ok) {
        setProfile(profile ? { ...profile, lineUserId: null } : null);
      }
    } catch (error) {
      console.error("LINE disconnect error:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">読み込み中...</p>
      </div>
    );
  }

  const isLineConnected = !!profile?.lineUserId;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">設定</h1>
        <p className="text-muted-foreground mt-1">
          アカウントと通知の設定
        </p>
      </div>

      {/* プロフィール設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            プロフィール
          </CardTitle>
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
          </div>
        </CardContent>
      </Card>

      {/* LINE連携 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            LINE連携
          </CardTitle>
          <CardDescription>
            LINEと連携してリマインド通知を受け取る
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">連携状態</p>
              <p className="text-sm text-muted-foreground">
                {isLineConnected ? "LINEと連携済み" : "未連携"}
              </p>
            </div>
            {isLineConnected ? (
              <Button variant="outline" onClick={handleLineDisconnect}>
                <Unlink className="h-4 w-4 mr-2" />
                連携解除
              </Button>
            ) : (
              <Button onClick={handleLineConnect} disabled={connecting}>
                <Link className="h-4 w-4 mr-2" />
                {connecting ? "接続中..." : "LINEと連携"}
              </Button>
            )}
          </div>
          {!isLineConnected && (
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              LINE連携すると、提出期限のリマインドや判定結果の通知を受け取れます。
            </p>
          )}
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
            LINEリマインド通知の設定（連携が必要です）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">朝のリマインド</p>
              <p className="text-sm text-muted-foreground">
                毎朝9時に当日期限のプロジェクトを通知
              </p>
            </div>
            <Switch
              checked={notifyMorning}
              onCheckedChange={setNotifyMorning}
              disabled={!isLineConnected}
            />
          </div>
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <p className="font-medium">夜のリマインド</p>
              <p className="text-sm text-muted-foreground">
                毎晩21時に未提出のプロジェクトを通知
              </p>
            </div>
            <Switch
              checked={notifyEvening}
              onCheckedChange={setNotifyEvening}
              disabled={!isLineConnected}
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium">期限超過通知</p>
              <p className="text-sm text-muted-foreground">
                未提出でペナルティ発生時に通知
              </p>
            </div>
            <Switch
              checked={notifyUrgent}
              onCheckedChange={setNotifyUrgent}
              disabled={!isLineConnected}
            />
          </div>
        </CardContent>
      </Card>

      {/* 保存ボタン */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
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
              設定を保存
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
