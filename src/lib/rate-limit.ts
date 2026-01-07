/**
 * シンプルなインメモリ Rate Limiter
 * 本番環境ではUpstash Redis等を推奨
 */

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

// インメモリストア（サーバーレス環境では再起動でリセット）
const store = new Map<string, RateLimitEntry>();

// 定期的にクリーンアップ（メモリリーク防止）
const CLEANUP_INTERVAL = 60 * 1000; // 1分
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (entry.resetTime < now) {
      store.delete(key);
    }
  }
}

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
 * Rate limit をチェック
 * @param identifier - ユーザー識別子（IP, userId等）
 * @param config - Rate limit 設定
 */
export function rateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const key = identifier;

  let entry = store.get(key);

  // 新しいエントリまたはウィンドウがリセットされた場合
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
  }

  entry.count++;
  store.set(key, entry);

  const remaining = Math.max(0, config.limit - entry.count);
  const success = entry.count <= config.limit;

  return {
    success,
    limit: config.limit,
    remaining,
    resetTime: entry.resetTime,
  };
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
