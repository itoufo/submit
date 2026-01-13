-- Create submit schema
CREATE SCHEMA IF NOT EXISTS submit;

-- Tables
CREATE TABLE submit."User" (
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

CREATE TABLE submit."Memo" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    type text DEFAULT 'text'::text NOT NULL,
    tags text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE submit."AiCandidate" (
    id text NOT NULL,
    "userId" text NOT NULL,
    content text NOT NULL,
    format text DEFAULT 'tweet'::text NOT NULL,
    persona text,
    status text DEFAULT 'pending'::text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE submit."ProjectSuggestion" (
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

CREATE TABLE submit."Project" (
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

CREATE TABLE submit."Article" (
    id text NOT NULL,
    "projectId" text NOT NULL,
    "candidateId" text,
    content text NOT NULL,
    "publishedAt" timestamp(3) without time zone,
    platform text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE submit."Supporter" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "supporterUserId" text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    "inviteToken" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);

CREATE TABLE submit."Notification" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE submit."Cheer" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "supporterUserId" text NOT NULL,
    message text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE submit."Pledge" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "agreedToTerms" boolean DEFAULT true NOT NULL,
    "agreedToPenalty" boolean DEFAULT true NOT NULL,
    "agreedToLine" boolean DEFAULT true NOT NULL,
    "pledgeText" text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE submit."JudgmentLog" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    "judgmentDate" timestamp with time zone NOT NULL,
    submitted boolean NOT NULL,
    "penaltyExecuted" boolean DEFAULT false NOT NULL,
    "penaltyAmount" integer,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE submit."PenaltyLog" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    amount integer NOT NULL,
    "stripePaymentId" text,
    status text DEFAULT 'pending'::text NOT NULL,
    reason text,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE submit."Submission" (
    id text DEFAULT (gen_random_uuid())::text NOT NULL,
    "userId" text NOT NULL,
    "projectId" text NOT NULL,
    "sequenceNum" integer NOT NULL,
    content text NOT NULL,
    "createdAt" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE submit."_MemoToCandidates" (
    "A" text NOT NULL,
    "B" text NOT NULL
);

-- Constraints
ALTER TABLE ONLY submit."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);

ALTER TABLE ONLY submit."User"
    ADD CONSTRAINT "User_lineUserId_key" UNIQUE ("lineUserId");

ALTER TABLE ONLY submit."Memo"
    ADD CONSTRAINT "Memo_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."AiCandidate"
    ADD CONSTRAINT "AiCandidate_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."ProjectSuggestion"
    ADD CONSTRAINT "ProjectSuggestion_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Project"
    ADD CONSTRAINT "Project_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Project"
    ADD CONSTRAINT "Project_suggestionId_key" UNIQUE ("suggestionId");

ALTER TABLE ONLY submit."Article"
    ADD CONSTRAINT "Article_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Supporter"
    ADD CONSTRAINT "Supporter_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Supporter"
    ADD CONSTRAINT "Supporter_inviteToken_key" UNIQUE ("inviteToken");

ALTER TABLE ONLY submit."Notification"
    ADD CONSTRAINT "Notification_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Cheer"
    ADD CONSTRAINT "Cheer_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Pledge"
    ADD CONSTRAINT "Pledge_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Pledge"
    ADD CONSTRAINT "Pledge_userId_key" UNIQUE ("userId");

ALTER TABLE ONLY submit."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."PenaltyLog"
    ADD CONSTRAINT "PenaltyLog_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."Submission"
    ADD CONSTRAINT "Submission_pkey" PRIMARY KEY (id);

ALTER TABLE ONLY submit."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_pkey" PRIMARY KEY ("A", "B");

-- Foreign keys
ALTER TABLE ONLY submit."Memo"
    ADD CONSTRAINT "Memo_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."AiCandidate"
    ADD CONSTRAINT "AiCandidate_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."ProjectSuggestion"
    ADD CONSTRAINT "ProjectSuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Project"
    ADD CONSTRAINT "Project_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Project"
    ADD CONSTRAINT "Project_suggestionId_fkey" FOREIGN KEY ("suggestionId") REFERENCES submit."ProjectSuggestion"(id);

ALTER TABLE ONLY submit."Article"
    ADD CONSTRAINT "Article_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Article"
    ADD CONSTRAINT "Article_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES submit."AiCandidate"(id);

ALTER TABLE ONLY submit."Supporter"
    ADD CONSTRAINT "Supporter_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Supporter"
    ADD CONSTRAINT "Supporter_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Notification"
    ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Cheer"
    ADD CONSTRAINT "Cheer_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Cheer"
    ADD CONSTRAINT "Cheer_supporterUserId_fkey" FOREIGN KEY ("supporterUserId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Pledge"
    ADD CONSTRAINT "Pledge_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."JudgmentLog"
    ADD CONSTRAINT "JudgmentLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."PenaltyLog"
    ADD CONSTRAINT "PenaltyLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Submission"
    ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES submit."User"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."Submission"
    ADD CONSTRAINT "Submission_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES submit."Project"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_A_fkey" FOREIGN KEY ("A") REFERENCES submit."Memo"(id) ON DELETE CASCADE;

ALTER TABLE ONLY submit."_MemoToCandidates"
    ADD CONSTRAINT "_MemoToCandidates_B_fkey" FOREIGN KEY ("B") REFERENCES submit."AiCandidate"(id) ON DELETE CASCADE;

-- Indexes
CREATE INDEX "Memo_userId_idx" ON submit."Memo" USING btree ("userId");
CREATE INDEX "AiCandidate_userId_idx" ON submit."AiCandidate" USING btree ("userId");
CREATE INDEX "AiCandidate_status_idx" ON submit."AiCandidate" USING btree (status);
CREATE INDEX "ProjectSuggestion_userId_idx" ON submit."ProjectSuggestion" USING btree ("userId");
CREATE INDEX "ProjectSuggestion_status_idx" ON submit."ProjectSuggestion" USING btree (status);
CREATE INDEX "Project_userId_idx" ON submit."Project" USING btree ("userId");
CREATE INDEX "Article_projectId_idx" ON submit."Article" USING btree ("projectId");
CREATE INDEX "Supporter_userId_idx" ON submit."Supporter" USING btree ("userId");
CREATE INDEX "Supporter_supporterUserId_idx" ON submit."Supporter" USING btree ("supporterUserId");
CREATE INDEX "Notification_userId_idx" ON submit."Notification" USING btree ("userId");
CREATE INDEX "Notification_read_idx" ON submit."Notification" USING btree (read);
CREATE INDEX "Cheer_userId_idx" ON submit."Cheer" USING btree ("userId");
CREATE INDEX "idx_judgment_user" ON submit."JudgmentLog" USING btree ("userId");
CREATE INDEX "idx_judgment_project" ON submit."JudgmentLog" USING btree ("projectId");
CREATE INDEX "idx_judgment_date" ON submit."JudgmentLog" USING btree ("judgmentDate");
CREATE INDEX "idx_penalty_user" ON submit."PenaltyLog" USING btree ("userId");
CREATE INDEX "idx_penalty_status" ON submit."PenaltyLog" USING btree (status);
CREATE INDEX "idx_submission_user" ON submit."Submission" USING btree ("userId");
CREATE INDEX "idx_submission_project" ON submit."Submission" USING btree ("projectId");
CREATE INDEX "idx_submission_created" ON submit."Submission" USING btree ("createdAt");
CREATE INDEX "idx_project_user" ON submit."Project" USING btree ("userId");
CREATE INDEX "idx_project_status" ON submit."Project" USING btree (status);
CREATE INDEX "idx_project_judgment" ON submit."Project" USING btree ("nextJudgmentDate");
CREATE INDEX "_MemoToCandidates_B_idx" ON submit."_MemoToCandidates" USING btree ("B");

-- Row level security
ALTER TABLE submit."Pledge" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit."JudgmentLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit."PenaltyLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE submit."Submission" ENABLE ROW LEVEL SECURITY;

CREATE POLICY pledge_owner ON submit."Pledge" USING (("userId" = (auth.uid())::text));
CREATE POLICY judgment_owner ON submit."JudgmentLog" USING (("userId" = (auth.uid())::text));
CREATE POLICY penalty_owner ON submit."PenaltyLog" USING (("userId" = (auth.uid())::text));
CREATE POLICY submission_owner ON submit."Submission" USING (("userId" = (auth.uid())::text));

CREATE POLICY service_role_pledge ON submit."Pledge" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_judgment ON submit."JudgmentLog" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_penalty ON submit."PenaltyLog" USING ((auth.role() = 'service_role'::text));
CREATE POLICY service_role_submission ON submit."Submission" USING ((auth.role() = 'service_role'::text));

-- Grants
GRANT USAGE ON SCHEMA submit TO anon;
GRANT USAGE ON SCHEMA submit TO authenticated;
GRANT USAGE ON SCHEMA submit TO service_role;

GRANT ALL ON TABLE submit."AiCandidate" TO anon;
GRANT ALL ON TABLE submit."AiCandidate" TO authenticated;
GRANT ALL ON TABLE submit."AiCandidate" TO service_role;

GRANT ALL ON TABLE submit."Article" TO anon;
GRANT ALL ON TABLE submit."Article" TO authenticated;
GRANT ALL ON TABLE submit."Article" TO service_role;

GRANT ALL ON TABLE submit."Cheer" TO anon;
GRANT ALL ON TABLE submit."Cheer" TO authenticated;
GRANT ALL ON TABLE submit."Cheer" TO service_role;

GRANT ALL ON TABLE submit."JudgmentLog" TO anon;
GRANT ALL ON TABLE submit."JudgmentLog" TO authenticated;
GRANT ALL ON TABLE submit."JudgmentLog" TO service_role;

GRANT ALL ON TABLE submit."Memo" TO anon;
GRANT ALL ON TABLE submit."Memo" TO authenticated;
GRANT ALL ON TABLE submit."Memo" TO service_role;

GRANT ALL ON TABLE submit."Notification" TO anon;
GRANT ALL ON TABLE submit."Notification" TO authenticated;
GRANT ALL ON TABLE submit."Notification" TO service_role;

GRANT ALL ON TABLE submit."PenaltyLog" TO anon;
GRANT ALL ON TABLE submit."PenaltyLog" TO authenticated;
GRANT ALL ON TABLE submit."PenaltyLog" TO service_role;

GRANT ALL ON TABLE submit."Pledge" TO anon;
GRANT ALL ON TABLE submit."Pledge" TO authenticated;
GRANT ALL ON TABLE submit."Pledge" TO service_role;

GRANT ALL ON TABLE submit."Project" TO anon;
GRANT ALL ON TABLE submit."Project" TO authenticated;
GRANT ALL ON TABLE submit."Project" TO service_role;

GRANT ALL ON TABLE submit."ProjectSuggestion" TO anon;
GRANT ALL ON TABLE submit."ProjectSuggestion" TO authenticated;
GRANT ALL ON TABLE submit."ProjectSuggestion" TO service_role;

GRANT ALL ON TABLE submit."Submission" TO anon;
GRANT ALL ON TABLE submit."Submission" TO authenticated;
GRANT ALL ON TABLE submit."Submission" TO service_role;

GRANT ALL ON TABLE submit."Supporter" TO anon;
GRANT ALL ON TABLE submit."Supporter" TO authenticated;
GRANT ALL ON TABLE submit."Supporter" TO service_role;

GRANT ALL ON TABLE submit."User" TO anon;
GRANT ALL ON TABLE submit."User" TO authenticated;
GRANT ALL ON TABLE submit."User" TO service_role;

GRANT ALL ON TABLE submit."_MemoToCandidates" TO anon;
GRANT ALL ON TABLE submit."_MemoToCandidates" TO authenticated;
GRANT ALL ON TABLE submit."_MemoToCandidates" TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON SEQUENCES TO service_role;

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA submit GRANT ALL ON TABLES TO service_role;
