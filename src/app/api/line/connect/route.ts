import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/database";
import crypto from "crypto";
import {
  rateLimit,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";

/**
 * LINE連携開始
 * 一時トークンを生成してLINEログインURLを返す
 */
export async function GET(request: Request) {
  // Rate limiting
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`line-connect:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // CSRF対策用のstateトークンを生成
  const state = crypto.randomBytes(32).toString("hex");
  const lineLoginUrl = generateLineLoginUrl(state, user.id);

  // stateとuserIdをcookieに保存（callbackで検証用）
  const response = NextResponse.json({
    connectUrl: lineLoginUrl,
  });

  // Secure cookie設定
  const isProduction = process.env.NODE_ENV === "production";

  response.cookies.set("line_connect_state", state, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 10, // 10分間有効
    path: "/",
  });

  response.cookies.set("line_connect_user_id", user.id, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax",
    maxAge: 60 * 10, // 10分間有効
    path: "/",
  });

  return response;
}

/**
 * LINE連携完了（LINEログインコールバック後）
 */
export async function POST(request: Request) {
  // Rate limiting
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`line-connect:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

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
export async function DELETE(request: Request) {
  // Rate limiting
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`line-connect:${ip}`, RATE_LIMITS.auth);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

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
  // 末尾スラッシュを除去してからパスを追加
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  const redirectUri = `${appUrl}/api/line/callback`;

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
