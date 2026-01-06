-- Project テーブルの欠けているカラムを追加
ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';

ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS "nextJudgmentDate" TIMESTAMPTZ;

ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS "submissionCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS "missedCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS "totalPenaltyAmount" INTEGER NOT NULL DEFAULT 0;

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_project_status ON submit."Project"(status);
CREATE INDEX IF NOT EXISTS idx_project_judgment ON submit."Project"("nextJudgmentDate");
