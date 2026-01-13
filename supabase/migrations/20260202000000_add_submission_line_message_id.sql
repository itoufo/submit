-- Add lineMessageId for LINE webhook idempotency
ALTER TABLE submit."Submission"
  ADD COLUMN IF NOT EXISTS "lineMessageId" text;

ALTER TABLE submit_test."Submission"
  ADD COLUMN IF NOT EXISTS "lineMessageId" text;

CREATE UNIQUE INDEX IF NOT EXISTS "idx_submission_line_message" ON submit."Submission" ("lineMessageId");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_submission_line_message" ON submit_test."Submission" ("lineMessageId");
