-- name カラムを追加
ALTER TABLE submit."Project"
ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';
