-- ============================================
-- 欠けているテーブル・カラムを追加
-- ============================================

-- 通知設定カラムを追加（存在しない場合）
ALTER TABLE submit."User"
ADD COLUMN IF NOT EXISTS "notifyMorning" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE submit."User"
ADD COLUMN IF NOT EXISTS "notifyEvening" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE submit."User"
ADD COLUMN IF NOT EXISTS "notifyUrgent" BOOLEAN NOT NULL DEFAULT true;

-- Pledge テーブル作成（存在しない場合）
CREATE TABLE IF NOT EXISTS submit."Pledge" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT UNIQUE NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
  "agreedToTerms"   BOOLEAN NOT NULL DEFAULT true,
  "agreedToPenalty" BOOLEAN NOT NULL DEFAULT true,
  "agreedToLine"    BOOLEAN NOT NULL DEFAULT true,
  "pledgeText"      TEXT NOT NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- JudgmentLog テーブル作成（存在しない場合）
CREATE TABLE IF NOT EXISTS submit."JudgmentLog" (
  id              TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"        TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
  "projectId"     TEXT NOT NULL REFERENCES submit."Project"(id) ON DELETE CASCADE,
  "judgmentDate"  TIMESTAMPTZ NOT NULL,
  submitted       BOOLEAN NOT NULL,
  "penaltyExecuted" BOOLEAN NOT NULL DEFAULT false,
  "penaltyAmount"   INTEGER,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_judgment_user ON submit."JudgmentLog"("userId");
CREATE INDEX IF NOT EXISTS idx_judgment_project ON submit."JudgmentLog"("projectId");
CREATE INDEX IF NOT EXISTS idx_judgment_date ON submit."JudgmentLog"("judgmentDate");

-- PenaltyLog テーブル作成（存在しない場合）
CREATE TABLE IF NOT EXISTS submit."PenaltyLog" (
  id                TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"          TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
  amount            INTEGER NOT NULL,
  "stripePaymentId" TEXT,
  status            TEXT NOT NULL DEFAULT 'pending',
  reason            TEXT,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_penalty_user ON submit."PenaltyLog"("userId");
CREATE INDEX IF NOT EXISTS idx_penalty_status ON submit."PenaltyLog"(status);

-- RLS 有効化
ALTER TABLE submit."Pledge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit."JudgmentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit."PenaltyLog" ENABLE ROW LEVEL SECURITY;

-- RLS ポリシー（存在しない場合のみ作成）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pledge_owner' AND tablename = 'Pledge') THEN
    CREATE POLICY pledge_owner ON submit."Pledge" FOR ALL USING ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'judgment_owner' AND tablename = 'JudgmentLog') THEN
    CREATE POLICY judgment_owner ON submit."JudgmentLog" FOR ALL USING ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'penalty_owner' AND tablename = 'PenaltyLog') THEN
    CREATE POLICY penalty_owner ON submit."PenaltyLog" FOR ALL USING ("userId" = auth.uid()::text);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_pledge' AND tablename = 'Pledge') THEN
    CREATE POLICY service_role_pledge ON submit."Pledge" FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_judgment' AND tablename = 'JudgmentLog') THEN
    CREATE POLICY service_role_judgment ON submit."JudgmentLog" FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'service_role_penalty' AND tablename = 'PenaltyLog') THEN
    CREATE POLICY service_role_penalty ON submit."PenaltyLog" FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
