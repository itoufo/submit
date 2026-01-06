-- customDays カラムを追加
ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS "customDays" INTEGER;
