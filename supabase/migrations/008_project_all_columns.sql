-- Project テーブルの全カラムを確実に追加
DO $$
BEGIN
  -- name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'name') THEN
    ALTER TABLE submit."Project" ADD COLUMN name TEXT NOT NULL DEFAULT '';
  END IF;

  -- userId
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'userId') THEN
    ALTER TABLE submit."Project" ADD COLUMN "userId" TEXT NOT NULL DEFAULT '';
  END IF;

  -- description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'description') THEN
    ALTER TABLE submit."Project" ADD COLUMN description TEXT;
  END IF;

  -- frequency
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'frequency') THEN
    ALTER TABLE submit."Project" ADD COLUMN frequency TEXT NOT NULL DEFAULT 'daily';
  END IF;

  -- judgmentDay
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'judgmentDay') THEN
    ALTER TABLE submit."Project" ADD COLUMN "judgmentDay" INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- customDays
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'customDays') THEN
    ALTER TABLE submit."Project" ADD COLUMN "customDays" INTEGER;
  END IF;

  -- penaltyAmount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'penaltyAmount') THEN
    ALTER TABLE submit."Project" ADD COLUMN "penaltyAmount" INTEGER NOT NULL DEFAULT 1000;
  END IF;

  -- status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'status') THEN
    ALTER TABLE submit."Project" ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
  END IF;

  -- nextJudgmentDate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'nextJudgmentDate') THEN
    ALTER TABLE submit."Project" ADD COLUMN "nextJudgmentDate" TIMESTAMPTZ;
  END IF;

  -- submissionCount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'submissionCount') THEN
    ALTER TABLE submit."Project" ADD COLUMN "submissionCount" INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- missedCount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'missedCount') THEN
    ALTER TABLE submit."Project" ADD COLUMN "missedCount" INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- totalPenaltyAmount
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'totalPenaltyAmount') THEN
    ALTER TABLE submit."Project" ADD COLUMN "totalPenaltyAmount" INTEGER NOT NULL DEFAULT 0;
  END IF;

  -- createdAt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'createdAt') THEN
    ALTER TABLE submit."Project" ADD COLUMN "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;

  -- updatedAt
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'updatedAt') THEN
    ALTER TABLE submit."Project" ADD COLUMN "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now();
  END IF;
END $$;

-- インデックス
CREATE INDEX IF NOT EXISTS idx_project_user ON submit."Project"("userId");
CREATE INDEX IF NOT EXISTS idx_project_status ON submit."Project"(status);
CREATE INDEX IF NOT EXISTS idx_project_judgment ON submit."Project"("nextJudgmentDate");
