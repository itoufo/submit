-- Create submit schema
CREATE SCHEMA IF NOT EXISTS submit;

-- Grant permissions to roles
GRANT USAGE ON SCHEMA submit TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA submit TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA submit TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA submit GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA submit GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- User table (linked to Supabase Auth)
CREATE TABLE submit."User" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    image TEXT,
    role TEXT DEFAULT 'user' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Memo (観測ログ)
CREATE TABLE submit."Memo" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' NOT NULL,
    tags TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Memo_userId_idx" ON submit."Memo"("userId");

-- AiCandidate (AIが生成したコンテンツ案)
CREATE TABLE submit."AiCandidate" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    format TEXT DEFAULT 'tweet' NOT NULL,
    persona TEXT,
    status TEXT DEFAULT 'pending' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "AiCandidate_userId_idx" ON submit."AiCandidate"("userId");
CREATE INDEX "AiCandidate_status_idx" ON submit."AiCandidate"(status);

-- ProjectSuggestion (AIコーチによるプロジェクト提案)
CREATE TABLE submit."ProjectSuggestion" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    "memoIds" TEXT NOT NULL,
    status TEXT DEFAULT 'pending' NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "ProjectSuggestion_userId_idx" ON submit."ProjectSuggestion"("userId");
CREATE INDEX "ProjectSuggestion_status_idx" ON submit."ProjectSuggestion"(status);

-- Project (プロジェクト)
CREATE TABLE submit."Project" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    "suggestionId" TEXT UNIQUE REFERENCES submit."ProjectSuggestion"(id),
    title TEXT NOT NULL,
    description TEXT,
    rule TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Project_userId_idx" ON submit."Project"("userId");

-- Article (プロジェクトに格納された記事)
CREATE TABLE submit."Article" (
    id TEXT PRIMARY KEY,
    "projectId" TEXT NOT NULL REFERENCES submit."Project"(id) ON DELETE CASCADE,
    "candidateId" TEXT REFERENCES submit."AiCandidate"(id),
    content TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    platform TEXT,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Article_projectId_idx" ON submit."Article"("projectId");

-- Supporter (パートナーシップ情報)
CREATE TABLE submit."Supporter" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    "supporterUserId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' NOT NULL,
    "inviteToken" TEXT UNIQUE,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX "Supporter_userId_idx" ON submit."Supporter"("userId");
CREATE INDEX "Supporter_supporterUserId_idx" ON submit."Supporter"("supporterUserId");

-- Notification (通知ログ)
CREATE TABLE submit."Notification" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX "Notification_userId_idx" ON submit."Notification"("userId");
CREATE INDEX "Notification_read_idx" ON submit."Notification"(read);

-- Cheer (応援ログ)
CREATE TABLE submit."Cheer" (
    id TEXT PRIMARY KEY,
    "userId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    "supporterUserId" TEXT NOT NULL REFERENCES submit."User"(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX "Cheer_userId_idx" ON submit."Cheer"("userId");

-- Many-to-many relation table for Memo <-> AiCandidate
CREATE TABLE submit."_MemoToCandidates" (
    "A" TEXT NOT NULL REFERENCES submit."Memo"(id) ON DELETE CASCADE,
    "B" TEXT NOT NULL REFERENCES submit."AiCandidate"(id) ON DELETE CASCADE,
    PRIMARY KEY ("A", "B")
);
CREATE INDEX "_MemoToCandidates_B_idx" ON submit."_MemoToCandidates"("B");
