-- 冪等性制約の追加
-- 判定の重複実行とLINEメッセージの重複処理を防止

-- JudgmentLog: 同一プロジェクト・判定日の重複防止
CREATE UNIQUE INDEX IF NOT EXISTS "JudgmentLog_projectId_judgmentDate_key"
ON submit."JudgmentLog" ("projectId", "judgmentDate");

-- Submission: LINE メッセージIDの重複防止（NULLは除外）
CREATE UNIQUE INDEX IF NOT EXISTS "Submission_lineMessageId_key"
ON submit."Submission" ("lineMessageId")
WHERE "lineMessageId" IS NOT NULL;
