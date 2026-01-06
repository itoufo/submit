import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/database";
import crypto from "crypto";

/**
 * LINE連携開始
 * 一時トークンを生成してLINEログインURLを返す
 */
export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 連携用の一時トークンを生成
  const connectToken = crypto.randomBytes(32).toString("hex");

  // セッションに保存（実際はRedisやDBに保存するべき）
  // ここでは簡易的にレスポンスに含める
  const lineLoginUrl = generateLineLoginUrl(connectToken, user.id);

  return NextResponse.json({
    connectUrl: lineLoginUrl,
    token: connectToken,
  });
}

/**
 * LINE連携完了（LINEログインコールバック後）
 */
export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lineUserId } = await request.json();

  if (!lineUserId) {
    return NextResponse.json(
      { error: "lineUserId is required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  try {
    // 既に他のユーザーに紐づいていないかチェック
    const { data: existing } = await supabase
      .schema("submit")
      .from("User")
      .select("id")
      .eq("lineUserId", lineUserId)
      .neq("id", user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "This LINE account is already connected to another user" },
        { status: 409 }
      );
    }

    // LINE連携を保存
    await db.user.setLineUserId(supabase, user.id, lineUserId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE connect error:", error);
    return NextResponse.json(
      { error: "Failed to connect LINE account" },
      { status: 500 }
    );
  }
}

/**
 * LINE連携解除
 */
export async function DELETE() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  try {
    await db.user.update(supabase, user.id, { lineUserId: null });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("LINE disconnect error:", error);
    return NextResponse.json(
      { error: "Failed to disconnect LINE account" },
      { status: 500 }
    );
  }
}

function generateLineLoginUrl(state: string, _userId: string): string {
  const clientId = process.env.LINE_LOGIN_CHANNEL_ID;
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/line/callback`;

  if (!clientId) {
    return "#line-login-not-configured";
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
    scope: "profile openid",
  });

  return `https://access.line.me/oauth2/v2.1/authorize?${params.toString()}`;
}
