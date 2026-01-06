-- ============================================
-- SUBMIT pg_cron スケジュール設定
-- ============================================
--
-- Supabase Dashboard > SQL Editor で実行してください
--
-- 事前準備:
-- 1. pg_cron と pg_net 拡張を有効化
--    Dashboard > Database > Extensions で検索して有効化
--
-- 2. Edge Functions をデプロイ
--    supabase functions deploy judge
--    supabase functions deploy remind-morning
--    supabase functions deploy remind-evening
--    supabase functions deploy remind-urgent
--
-- 3. 以下のSQLを実行
-- ============================================

-- 既存のジョブを削除（再設定時用）
SELECT cron.unschedule('submit-cron-remind-morning');
SELECT cron.unschedule('submit-cron-remind-evening');
SELECT cron.unschedule('submit-cron-judge');
SELECT cron.unschedule('submit-cron-remind-urgent');

-- ============================================
-- 朝リマインド: 9:00 JST (0:00 UTC)
-- ============================================
SELECT cron.schedule(
  'submit-cron-remind-morning',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-remind-morning',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 夜リマインド: 21:00 JST (12:00 UTC)
-- ============================================
SELECT cron.schedule(
  'submit-cron-remind-evening',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-remind-evening',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 判定実行: 0:00 JST (15:00 UTC)
-- ============================================
SELECT cron.schedule(
  'submit-cron-judge',
  '0 15 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-judge',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 期限超過通知: 0:30 JST (15:30 UTC)
-- ============================================
SELECT cron.schedule(
  'submit-cron-remind-urgent',
  '30 15 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/submit-remind-urgent',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ============================================
-- 設定確認
-- ============================================
SELECT * FROM cron.job WHERE jobname LIKE 'submit-cron-%';

-- ============================================
-- 注意事項
-- ============================================
--
-- YOUR_PROJECT_REF を実際のプロジェクトIDに置換してください
-- 例: abcdefghijklmnop.supabase.co
--
-- service_role_key の設定:
-- Dashboard > Project Settings > Database > Connection string
-- の service_role キーを使用
--
-- または、直接キーを埋め込む場合:
-- 'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
-- ============================================
