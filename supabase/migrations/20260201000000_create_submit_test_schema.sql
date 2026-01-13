-- Create submit_test schema
CREATE SCHEMA IF NOT EXISTS submit_test;

-- Tables
CREATE TABLE IF NOT EXISTS submit_test."User" (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    image text,
    role text DEFAULT 'user'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "notifyMorning" boolean DEFAULT true NOT NULL,
    "notifyEvening" boolean DEFAULT true NOT NULL,
    "notifyUrgent" boolean DEFAULT true NOT NULL,
    "pledgedAt" timestamp with time zone,
    "lineUserId" text
);

CREATE TABLE IF NOT EXISTS submit_test."Memo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    tags text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."AiCandidate" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    format text DEFAULT 'tweet'::text NOT NULL,
    persona text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."ProjectSuggestion" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    reasoning text NOT NULL,
    "memoIds" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Project" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "suggestionId" text,
    description text,
    rule text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status text DEFAULT 'active'::text NOT NULL,
    "nextJudgmentDate" timestamp with time zone,
    "submissionCount" integer DEFAULT 0 NOT NULL,
    "missedCount" integer DEFAULT 0 NOT NULL,
    "totalPenaltyAmount" integer DEFAULT 0 NOT NULL,
    "customDays" integer,
    frequency text DEFAULT 'daily'::text NOT NULL,
    "judgmentDay" integer DEFAULT 0 NOT NULL,
    "penaltyAmount" integer DEFAULT 1000 NOT NULL,
    name text DEFAULT ''::text NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Article" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "candidateId" text,
    content text NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    platform text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Supporter" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "supporterUserId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "inviteToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Cheer" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "supporterUserId" text NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Pledge" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "agreedToTerms" boolean DEFAULT true NOT NULL,
    "agreedToPenalty" boolean DEFAULT true NOT NULL,
    "agreedToLine" boolean DEFAULT true NOT NULL,
    "pledgeText" text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."JudgmentLog" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    "judgmentDate" timestamp with time zone NOT NULL,
    submitted boolean NOT NULL,
    "penaltyExecuted" boolean DEFAULT false NOT NULL,
    "penaltyAmount" integer,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."PenaltyLog" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    amount integer NOT NULL,
    "stripePaymentId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."Submission" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    "sequenceNum" integer NOT NULL,
    content text NOT NULL,
    "lineMessageId" text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS submit_test."_MemoToCandidates" (
    "A" text NOT NULL,
    "B" text NOT NULL
);

-- Constraints
ALTER TABLE ONLY submit_test."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);

ALTER TABLE ONLY submit_test."User"
    ADD CONSTRAINT "User_lineUserId_key" UNIQUE ("lineUserId");

ALTER TABLE ONLY submit_test."Memo"
    ADD CONSTRAINT "Memo_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."AiCandidate"
    ADD CONSTRAINT "AiCandidate_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."ProjectSuggestion"
    ADD CONSTRAINT "ProjectSuggestion_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Project"
    ADD CONSTRAINT "Project_suggestionId_key" UNIQUE ("suggestionId");

ALTER TABLE ONLY submit_test."Article"
    ADD CONSTRAINT "Article_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Supporter"
    ADD CONSTRAINT "Supporter_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Supporter"
    ADD CONSTRAINT "Supporter_inviteToken_key" UNIQUE ("inviteToken");

ALTER TABLE ONLY submit_test."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Cheer"
    ADD CONSTRAINT "Cheer_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Pledge"
    ADD CONSTRAINT "Pledge_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Pledge"
    ADD CONSTRAINT "Pledge_userId_key" UNIQUE ("userId");

ALTER TABLE ONLY submit_test."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."PenaltyLog"
    ADD CONSTRAINT "PenaltyLog_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."Submission"
    ADD CONSTRAINT "Submission_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit_test."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_pkey" PRIMARY KEY ("A", "B");

-- Foreign keys
ALTER TABLE ONLY submit_test."Memo"
    ADD CONSTRAINT "Memo_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."AiCandidate"
    ADD CONSTRAINT "AiCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."ProjectSuggestion"
    ADD CONSTRAINT "ProjectSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Project"
    ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Project"
    ADD CONSTRAINT "Project_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES submit_test."ProjectSuggestion"(id);

ALTER TABLE ONLY submit_test."Article"
    ADD CONSTRAINT "Article_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit_test."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Article"
    ADD CONSTRAINT "Article_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES submit_test."AiCandidate"(id);

ALTER TABLE ONLY submit_test."Supporter"
    ADD CONSTRAINT "Supporter_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Supporter"
    ADD CONSTRAINT "Supporter_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Cheer"
    ADD CONSTRAINT "Cheer_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Cheer"
    ADD CONSTRAINT "Cheer_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Pledge"
    ADD CONSTRAINT "Pledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit_test."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."PenaltyLog"
    ADD CONSTRAINT "PenaltyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Submission"
    ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit_test."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."Submission"
    ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit_test."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_A_fkey" FOREIGN KEY ("A") REFERENCES submit_test."Memo"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit_test."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_B_fkey" FOREIGN KEY ("B") REFERENCES submit_test."AiCandidate"(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX IF NOT EXISTS "Memo_userId_idx" ON submit_test."Memo" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "AiCandidate_userId_idx" ON submit_test."AiCandidate" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "AiCandidate_status_idx" ON submit_test."AiCandidate" USING btree (status);
CREATE INDEX IF NOT EXISTS "ProjectSuggestion_userId_idx" ON submit_test."ProjectSuggestion" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "ProjectSuggestion_status_idx" ON submit_test."ProjectSuggestion" USING btree (status);
CREATE INDEX IF NOT EXISTS "Project_userId_idx" ON submit_test."Project" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "Article_projectId_idx" ON submit_test."Article" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "Supporter_userId_idx" ON submit_test."Supporter" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "Supporter_supporterUserId_idx" ON submit_test."Supporter" USING btree ("supporterUserId");
CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON submit_test."Notification" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "Notification_read_idx" ON submit_test."Notification" USING btree (read);
CREATE INDEX IF NOT EXISTS "Cheer_userId_idx" ON submit_test."Cheer" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_judgment_user" ON submit_test."JudgmentLog" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_judgment_project" ON submit_test."JudgmentLog" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "idx_judgment_date" ON submit_test."JudgmentLog" USING btree ("judgmentDate");
CREATE INDEX IF NOT EXISTS "idx_penalty_user" ON submit_test."PenaltyLog" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_penalty_status" ON submit_test."PenaltyLog" USING btree (status);
CREATE INDEX IF NOT EXISTS "idx_submission_user" ON submit_test."Submission" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_submission_project" ON submit_test."Submission" USING btree ("projectId");
CREATE INDEX IF NOT EXISTS "idx_submission_created" ON submit_test."Submission" USING btree ("createdAt");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_submission_line_message" ON submit_test."Submission" USING btree ("lineMessageId");
CREATE INDEX IF NOT EXISTS "idx_project_user" ON submit_test."Project" USING btree ("userId");
CREATE INDEX IF NOT EXISTS "idx_project_status" ON submit_test."Project" USING btree (status);
CREATE INDEX IF NOT EXISTS "idx_project_judgment" ON submit_test."Project" USING btree ("nextJudgmentDate");
CREATE INDEX IF NOT EXISTS "_MemoToCandidates_B_idx" ON submit_test."_MemoToCandidates" USING btree ("B");

-- Row level security
ALTER TABLE submit_test."Pledge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit_test."JudgmentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit_test."PenaltyLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit_test."Submission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pledge_owner ON submit_test."Pledge" USING (("userId" = (auth.uid())::text));
CREATE POLICY judgment_owner ON submit_test."JudgmentLog" USING (("userId" = (auth.uid())::text));
CREATE POLICY penalty_owner ON submit_test."PenaltyLog" USING (("userId" = (auth.uid())::text));
CREATE POLICY submission_owner ON submit_test."Submission" USING (("userId" = (auth.uid())::text));

CREATE POLICY service_role_pledge ON submit_test."Pledge" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_judgment ON submit_test."JudgmentLog" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_penalty ON submit_test."PenaltyLog" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_submission ON submit_test."Submission" USING ((auth.role() = 'service_role'::text));

-- Grants
GRANT USAGE ON SCHEMA submit_test TO anon;
GRANT USAGE ON SCHEMA submit_test TO authenticated;
GRANT USAGE ON SCHEMA submit_test TO service_role;

GRANT ALL ON TABLE submit_test."AiCandidate" TO anon;
GRANT ALL ON TABLE submit_test."AiCandidate" TO authenticated;
GRANT ALL ON TABLE submit_test."AiCandidate" TO service_role;

GRANT ALL ON TABLE submit_test."Article" TO anon;
GRANT ALL ON TABLE submit_test."Article" TO authenticated;
GRANT ALL ON TABLE submit_test."Article" TO service_role;

GRANT ALL ON TABLE submit_test."Cheer" TO anon;
GRANT ALL ON TABLE submit_test."Cheer" TO authenticated;
GRANT ALL ON TABLE submit_test."Cheer" TO service_role;

GRANT ALL ON TABLE submit_test."JudgmentLog" TO anon;
GRANT ALL ON TABLE submit_test."JudgmentLog" TO authenticated;
GRANT ALL ON TABLE submit_test."JudgmentLog" TO service_role;

GRANT ALL ON TABLE submit_test."Memo" TO anon;
GRANT ALL ON TABLE submit_test."Memo" TO authenticated;
GRANT ALL ON TABLE submit_test."Memo" TO service_role;

GRANT ALL ON TABLE submit_test."Notification" TO anon;
GRANT ALL ON TABLE submit_test."Notification" TO authenticated;
GRANT ALL ON TABLE submit_test."Notification" TO service_role;

GRANT ALL ON TABLE submit_test."PenaltyLog" TO anon;
GRANT ALL ON TABLE submit_test."PenaltyLog" TO authenticated;
GRANT ALL ON TABLE submit_test."PenaltyLog" TO service_role;

GRANT ALL ON TABLE submit_test."Pledge" TO anon;
GRANT ALL ON TABLE submit_test."Pledge" TO authenticated;
GRANT ALL ON TABLE submit_test."Pledge" TO service_role;

GRANT ALL ON TABLE submit_test."Project" TO anon;
GRANT ALL ON TABLE submit_test."Project" TO authenticated;
GRANT ALL ON TABLE submit_test."Project" TO service_role;

GRANT ALL ON TABLE submit_test."ProjectSuggestion" TO anon;
GRANT ALL ON TABLE submit_test."ProjectSuggestion" TO authenticated;
GRANT ALL ON TABLE submit_test."ProjectSuggestion" TO service_role;

GRANT ALL ON TABLE submit_test."Submission" TO anon;
GRANT ALL ON TABLE submit_test."Submission" TO authenticated;
GRANT ALL ON TABLE submit_test."Submission" TO service_role;

GRANT ALL ON TABLE submit_test."Supporter" TO anon;
GRANT ALL ON TABLE submit_test."Supporter" TO authenticated;
GRANT ALL ON TABLE submit_test."Supporter" TO service_role;

GRANT ALL ON TABLE submit_test."User" TO anon;
GRANT ALL ON TABLE submit_test."User" TO authenticated;
GRANT ALL ON TABLE submit_test."User" TO service_role;

GRANT ALL ON TABLE submit_test."_MemoToCandidates" TO anon;
GRANT ALL ON TABLE submit_test."_MemoToCandidates" TO authenticated;
GRANT ALL ON TABLE submit_test."_MemoToCandidates" TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit_test GRANT ALL ON TABLES TO service_role;

-- Data copy from submit schema
INSERT INTO submit_test."User" SELECT * FROM submit."User" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Memo" SELECT * FROM submit."Memo" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."AiCandidate" SELECT * FROM submit."AiCandidate" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."ProjectSuggestion" SELECT * FROM submit."ProjectSuggestion" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Project" SELECT * FROM submit."Project" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Article" SELECT * FROM submit."Article" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Supporter" SELECT * FROM submit."Supporter" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Notification" SELECT * FROM submit."Notification" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Cheer" SELECT * FROM submit."Cheer" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Pledge" SELECT * FROM submit."Pledge" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."JudgmentLog" SELECT * FROM submit."JudgmentLog" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."PenaltyLog" SELECT * FROM submit."PenaltyLog" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."Submission" SELECT * FROM submit."Submission" ON CONFLICT DO NOTHING;
INSERT INTO submit_test."_MemoToCandidates" SELECT * FROM submit."_MemoToCandidates" ON CONFLICT DO NOTHING;
