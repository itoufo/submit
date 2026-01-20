/**
 * Supabase ベースの永続 Rate Limiter
 *
 * サーバーレス環境でも一貫したレート制限を提供
 */

import { createServiceClient } from "./supabase/server";

export type RateLimitConfig = {
  /** ウィンドウ内の最大リクエスト数 */
  limit: number;
  /** ウィンドウの長さ（秒） */
  windowSec: number;
};

export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
};

/**
 * Rate limit をチェック（Supabase RPC使用）
 * @param identifier - ユーザー識別子（IP, userId等）
 * @param config - Rate limit 設定
 */
export async function rateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  try {
    const supabase = createServiceClient();

    const { data, error } = await supabase.rpc("check_rate_limit", {
      p_identifier: identifier,
      p_limit: config.limit,
      p_window_sec: config.windowSec,
    });

    if (error) {
      console.error("[RateLimit] Supabase error:", error);
      // エラー時はフォールバックで許可（サービス継続優先）
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        resetTime: Date.now() + config.windowSec * 1000,
      };
    }

    const result = data?.[0];
    if (!result) {
      // データがない場合も許可
      return {
        success: true,
        limit: config.limit,
        remaining: config.limit,
        resetTime: Date.now() + config.windowSec * 1000,
      };
    }

    return {
      success: result.success,
      limit: config.limit,
      remaining: result.remaining,
      resetTime: new Date(result.reset_time).getTime(),
    };
  } catch (err) {
    console.error("[RateLimit] Unexpected error:", err);
    // 例外時も許可（サービス継続優先）
    return {
      success: true,
      limit: config.limit,
      remaining: config.limit,
      resetTime: Date.now() + config.windowSec * 1000,
    };
  }
}

/**
 * リクエストからIP取得
 */
export function getClientIP(request: Request): string {
  // Vercel / Cloudflare の場合
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  // Cloudflare
  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  // Real IP
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Rate limit レスポンスヘッダーを追加
 */
export function rateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    "X-RateLimit-Limit": String(result.limit),
    "X-RateLimit-Remaining": String(result.remaining),
    "X-RateLimit-Reset": String(Math.ceil(result.resetTime / 1000)),
  };
}

// プリセット設定
export const RATE_LIMITS = {
  /** LINE Webhook: 100 req/min */
  lineWebhook: { limit: 100, windowSec: 60 },
  /** LINE Callback: 10 req/min */
  lineCallback: { limit: 10, windowSec: 60 },
  /** API一般: 60 req/min */
  api: { limit: 60, windowSec: 60 },
  /** 認証系: 5 req/min */
  auth: { limit: 5, windowSec: 60 },
} as const;
