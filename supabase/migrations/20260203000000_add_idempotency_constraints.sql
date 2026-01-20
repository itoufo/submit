-- ============================================
-- 冪等性制約の追加
-- 判定の重複実行とLINEメッセージの重複処理を防止
-- ============================================

-- ============================================
-- PRE-MIGRATION: 重複データチェック
-- これらのクエリで重複があれば先に解消すること
-- ============================================
-- 重複チェック（JudgmentLog）:
-- SELECT "projectId", "judgmentDate", COUNT(*)
-- FROM submit."JudgmentLog"
-- GROUP BY "projectId", "judgmentDate"
-- HAVING COUNT(*) > 1;
--
-- 重複チェック（Submission）:
-- SELECT "lineMessageId", COUNT(*)
-- FROM submit."Submission"
-- WHERE "lineMessageId" IS NOT NULL
-- GROUP BY "lineMessageId"
-- HAVING COUNT(*) > 1;
--
-- 重複解消例（最新以外を削除）:
-- DELETE FROM submit."JudgmentLog" j1
-- WHERE EXISTS (
--   SELECT 1 FROM submit."JudgmentLog" j2
--   WHERE j1."projectId" = j2."projectId"
--     AND j1."judgmentDate" = j2."judgmentDate"
--     AND j1."createdAt" < j2."createdAt"
-- );

-- ============================================
-- MIGRATION: INDEX 作成
-- ============================================

-- JudgmentLog: 同一プロジェクト・判定日の重複防止
CREATE UNIQUE INDEX IF NOT EXISTS "JudgmentLog_projectId_judgmentDate_key"
ON submit."JudgmentLog" ("projectId", "judgmentDate");

-- Submission: LINE メッセージIDの重複防止（NULLは除外）
-- NOTE: Prisma の @unique とは異なる部分インデックス
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_lineMessageId_key"
ON submit."Submission" ("lineMessageId")
WHERE "lineMessageId" IS NOT NULL;

-- ============================================
-- ROLLBACK: 以下を実行してロールバック
-- ============================================
-- DROP INDEX IF EXISTS submit."JudgmentLog_projectId_judgmentDate_key";
-- DROP INDEX IF EXISTS submit."Submission_lineMessageId_key";
