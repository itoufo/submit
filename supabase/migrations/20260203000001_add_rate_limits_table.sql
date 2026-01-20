-- ============================================
-- Rate Limits テーブル（永続レート制限用）
-- ============================================

-- Rate Limits テーブル作成
CREATE TABLE IF NOT EXISTS submit."RateLimits" (
  "id" TEXT PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "resetTime" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- インデックス（期限切れエントリのクリーンアップ用）
CREATE INDEX IF NOT EXISTS "RateLimits_resetTime_idx"
ON submit."RateLimits" ("resetTime");

-- 自動更新トリガー
CREATE OR REPLACE FUNCTION submit.update_rate_limits_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS rate_limits_updated_at ON submit."RateLimits";
CREATE TRIGGER rate_limits_updated_at
  BEFORE UPDATE ON submit."RateLimits"
  FOR EACH ROW
  EXECUTE FUNCTION submit.update_rate_limits_updated_at();

-- アトミックなレート制限チェック＆インクリメント関数
CREATE OR REPLACE FUNCTION submit.check_rate_limit(
  p_identifier TEXT,
  p_limit INTEGER,
  p_window_sec INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  current_count INTEGER,
  remaining INTEGER,
  reset_time TIMESTAMPTZ
) AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_reset_time TIMESTAMPTZ := v_now + (p_window_sec || ' seconds')::INTERVAL;
  v_entry RECORD;
BEGIN
  -- 期限切れエントリをクリーンアップ（パフォーマンスのため時々実行）
  IF random() < 0.01 THEN
    DELETE FROM submit."RateLimits" WHERE "resetTime" < v_now;
  END IF;

  -- アトミックにUPSERT＆カウント取得
  INSERT INTO submit."RateLimits" ("id", "count", "resetTime")
  VALUES (p_identifier, 1, v_reset_time)
  ON CONFLICT ("id") DO UPDATE
  SET
    "count" = CASE
      WHEN submit."RateLimits"."resetTime" < v_now
      THEN 1
      ELSE submit."RateLimits"."count" + 1
    END,
    "resetTime" = CASE
      WHEN submit."RateLimits"."resetTime" < v_now
      THEN v_reset_time
      ELSE submit."RateLimits"."resetTime"
    END
  RETURNING * INTO v_entry;

  RETURN QUERY SELECT
    v_entry."count" <= p_limit,
    v_entry."count",
    GREATEST(0, p_limit - v_entry."count"),
    v_entry."resetTime";
END;
$$ LANGUAGE plpgsql;

-- RLS（Row Level Security）
ALTER TABLE submit."RateLimits" ENABLE ROW LEVEL SECURITY;

-- サービスロールのみアクセス可能
CREATE POLICY "Service role only" ON submit."RateLimits"
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 定期クリーンアップ用（オプション）
-- pg_cron が有効な場合のみ使用
-- ============================================
-- SELECT cron.schedule(
--   'cleanup-rate-limits',
--   '*/5 * * * *',
--   $$DELETE FROM submit."RateLimits" WHERE "resetTime" < NOW()$$
-- );

-- ============================================
-- ROLLBACK: 以下を実行してロールバック
-- ============================================
-- DROP POLICY IF EXISTS "Service role only" ON submit."RateLimits";
-- DROP TRIGGER IF EXISTS rate_limits_updated_at ON submit."RateLimits";
-- DROP FUNCTION IF EXISTS submit.update_rate_limits_updated_at();
-- DROP FUNCTION IF EXISTS submit.check_rate_limit(TEXT, INTEGER, INTEGER);
-- DROP INDEX IF EXISTS submit."RateLimits_resetTime_idx";
-- DROP TABLE IF EXISTS submit."RateLimits";
