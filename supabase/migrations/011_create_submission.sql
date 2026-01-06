-- Submission テーブル作成
CREATE TABLE IF NOT EXISTS submit."Submission" (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId"      TEXT NOT NULL,
  "projectId"   TEXT NOT NULL,
  "sequenceNum" INTEGER NOT NULL,
  content       TEXT NOT NULL,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_submission_user ON submit."Submission"("userId");
CREATE INDEX IF NOT EXISTS idx_submission_project ON submit."Submission"("projectId");
CREATE INDEX IF NOT EXISTS idx_submission_created ON submit."Submission"("createdAt");

-- RLS
ALTER TABLE submit."Submission" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS submission_owner ON submit."Submission";
CREATE POLICY submission_owner ON submit."Submission"
  FOR ALL USING ("userId" = auth.uid()::text);

DROP POLICY IF EXISTS service_role_submission ON submit."Submission";
CREATE POLICY service_role_submission ON submit."Submission"
  FOR ALL USING (auth.role() = 'service_role');

-- スキーマキャッシュをリフレッシュ
NOTIFY pgrst, 'reload schema';
