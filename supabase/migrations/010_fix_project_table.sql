-- title カラムを nullable に変更するか削除
DO $$
BEGIN
  -- title カラムが存在する場合は nullable にする
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'submit' AND table_name = 'Project' AND column_name = 'title') THEN
    ALTER TABLE submit."Project" ALTER COLUMN title DROP NOT NULL;
  END IF;
END $$;

-- スキーマキャッシュをリフレッシュ
NOTIFY pgrst, 'reload schema';
