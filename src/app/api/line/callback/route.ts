import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/database";
import {
  rateLimit,
  getClientIP,
  rateLimitHeaders,
  RATE_LIMITS,
} from "@/lib/rate-limit";

const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_PROFILE_URL = "https://api.line.me/v2/profile";

/**
 * LINE Login コールバック
 * LINE OAuth認証後にリダイレクトされるエンドポイント
 */
export async function GET(request: Request) {
  const ip = getClientIP(request);
  const rateLimitResult = rateLimit(`line-callback:${ip}`, RATE_LIMITS.lineCallback);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: rateLimitHeaders(rateLimitResult),
      }
    );
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // エラーチェック
  if (error) {
    console.error("LINE OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      `${appUrl}/settings?error=line_auth_failed&message=${encodeURIComponent(errorDescription || error)}`
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      `${appUrl}/settings?error=invalid_callback`
    );
  }

  // stateからuserIdを取得（cookieに保存されているはず）
  const cookieStore = await cookies();
  const storedState = cookieStore.get("line_connect_state")?.value;
  const userId = cookieStore.get("line_connect_user_id")?.value;

  if (!storedState || storedState !== state) {
    console.error("LINE OAuth state mismatch");
    return NextResponse.redirect(
      `${appUrl}/settings?error=invalid_state`
    );
  }

  if (!userId) {
    console.error("LINE OAuth: No user ID found in cookie");
    return NextResponse.redirect(
      `${appUrl}/settings?error=session_expired`
    );
  }

  try {
    // 環境変数チェック
    if (!process.env.LINE_LOGIN_CHANNEL_ID || !process.env.LINE_LOGIN_CHANNEL_SECRET) {
      console.error("LINE Login credentials not configured");
      return NextResponse.redirect(
        `${appUrl}/settings?error=config_missing`
      );
    }

    // LINE Access Tokenを取得
    // redirect_uri は認可時と完全一致する必要がある
    const cleanAppUrl = appUrl.replace(/\/$/, "");
    const redirectUri = `${cleanAppUrl}/api/line/callback`;

    console.log("LINE token request:", { redirectUri, clientId: process.env.LINE_LOGIN_CHANNEL_ID });

    const tokenResponse = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: process.env.LINE_LOGIN_CHANNEL_ID,
        client_secret: process.env.LINE_LOGIN_CHANNEL_SECRET,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error("LINE token error:", errorData);
      return NextResponse.redirect(
        `${appUrl}/settings?error=token_failed&detail=${encodeURIComponent(errorData.error || 'unknown')}`
      );
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // LINEプロフィールを取得
    const profileResponse = await fetch(LINE_PROFILE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!profileResponse.ok) {
      console.error("LINE profile error:", await profileResponse.text());
      return NextResponse.redirect(
        `${appUrl}/settings?error=profile_failed`
      );
    }

    const profile = await profileResponse.json();
    const lineUserId = profile.userId;

    // DBに保存
    const supabase = createServiceClient();

    // 既に他のユーザーに紐づいていないかチェック
    const { data: existing } = await supabase
      .schema("submit")
      .from("User")
      .select("id")
      .eq("lineUserId", lineUserId)
      .neq("id", userId)
      .single();

    if (existing) {
      return NextResponse.redirect(
        `${appUrl}/settings?error=line_already_connected`
      );
    }

    // LINE連携を保存
    await db.user.setLineUserId(supabase, userId, lineUserId);

    // Cookieをクリア
    const response = NextResponse.redirect(
      `${appUrl}/settings?success=line_connected`
    );
    response.cookies.delete("line_connect_state");
    response.cookies.delete("line_connect_user_id");

    return response;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "unknown";
    console.error("LINE callback error:", err);
    return NextResponse.redirect(
      `${appUrl}/settings?error=callback_failed&detail=${encodeURIComponent(errorMessage)}`
    );
  }
}
