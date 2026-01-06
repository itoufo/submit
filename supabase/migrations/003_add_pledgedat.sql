-- pledgedAt カラムを追加
ALTER TABLE submit."User"
ADD COLUMN IF NOT EXISTS "pledgedAt" TIMESTAMPTZ;
