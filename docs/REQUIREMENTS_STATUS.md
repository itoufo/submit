# SUBMIT 要件進捗管理

## 基本思想（v2 - リマインド対応版）
> 「判断しない、でもリマインドする」

- 判断しない → 内容の質は評価しない、提出したか否かのみ
- リマインドする → 忘れないようサポート（朝・夜・期限後）
- 事実ベース → 励ましなし、状況を淡々と通知

### 通知ポリシー
```
朝リマインド (9:00): 「今日が期限のプロジェクトがあります」
夜リマインド (21:00): 「本日中に提出してください」
期限超過 (判定後): 「未提出です。ペナルティ¥X,XXX」
提出確認: 「提出を受領しました」
```

---

## アーキテクチャ

```
┌─────────────┐     ┌─────────────────────────────────┐
│   Netlify   │     │           Supabase              │
│  (Frontend) │────▶│  Database + Edge Functions      │
│   Next.js   │     │  + pg_cron (スケジュール実行)   │
└─────────────┘     └─────────────────────────────────┘
```

---

## 要件一覧と実装状況

### 1. ユーザー管理・認証
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| Supabase Auth | ✅ 完了 | `/login`, `/register` |
| LINE連携 | ✅ 完了 | `/api/line/*`, `User.lineUserId` |
| 通知設定 | ✅ 完了 | `User.notify*`, `/settings` |

### 2. 誓約（Pledge）フロー
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| 誓約ページ | ✅ 完了 | `/pledge` |
| 同意チェック | ✅ 完了 | `Pledge.agreedTo*` |

### 3. プロジェクト管理
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| CRUD | ✅ 完了 | `/projects`, `/api/projects` |
| 頻度・判定日設定 | ✅ 完了 | `Project.frequency`, `judgmentDay` |
| 罰金設定 | ✅ 完了 | `Project.penaltyAmount` |

### 4. 提出機能
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| 提出フォーム | ✅ 完了 | `/submit` |
| 連番採番 | ✅ 完了 | `Submission.sequenceNum` |
| LINE確認通知 | ✅ 完了 | `/api/submissions` |

### 5. 判定エンジン（Supabase Edge Functions）
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| 判定実行 | ✅ 完了 | `supabase/functions/judge` |
| ペナルティ記録 | ✅ 完了 | `PenaltyLog` |

### 6. LINE通知システム（Supabase Edge Functions）
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| 朝リマインド | ✅ 完了 | `supabase/functions/remind-morning` |
| 夜リマインド | ✅ 完了 | `supabase/functions/remind-evening` |
| 期限超過通知 | ✅ 完了 | `supabase/functions/remind-urgent` |
| Webhook | ✅ 完了 | `/api/line/webhook` |

### 7. ペナルティシステム
| 要件 | 状態 | 実装場所 |
|------|------|----------|
| ログ記録 | ✅ 完了 | `PenaltyLog` |
| Stripe連携 | ❌ 未実装 | - |

---

## Supabase Edge Functions

```
supabase/functions/
├── _shared/
│   ├── supabase.ts           # DB接続（schema: submit）
│   └── line.ts               # LINE API・メッセージテンプレート
├── submit-judge/index.ts     # 判定実行
├── submit-remind-morning/    # 朝リマインド
├── submit-remind-evening/    # 夜リマインド
└── submit-remind-urgent/     # 期限超過通知
```

### デプロイコマンド

```bash
# 全てデプロイ
supabase functions deploy submit-judge
supabase functions deploy submit-remind-morning
supabase functions deploy submit-remind-evening
supabase functions deploy submit-remind-urgent

# または一括
supabase functions deploy --all
```

---

## pg_cron スケジュール

| Function | UTC | JST | 説明 |
|----------|-----|-----|------|
| `submit-remind-morning` | 0:00 | 9:00 | 朝リマインド |
| `submit-remind-evening` | 12:00 | 21:00 | 夜リマインド |
| `submit-judge` | 15:00 | 0:00 | 判定実行 |
| `submit-remind-urgent` | 15:30 | 0:30 | 期限超過通知 |

設定: `supabase/setup-cron.sql` を Supabase SQL Editor で実行

---

## 環境変数

### Netlify (Frontend)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

### Supabase Edge Functions
```env
# 自動設定
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=

# 手動設定
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

---

## セットアップ手順

### 1. Supabase

```bash
# 1. テーブル作成
# Dashboard > SQL Editor で以下を実行:
# supabase/migrations/001_create_schema.sql

# 2. 拡張を有効化
# Dashboard > Database > Extensions
# - pg_cron
# - pg_net
```

### 2. Edge Functions デプロイ

```bash
cd submit
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set LINE_CHANNEL_ACCESS_TOKEN=xxx
supabase secrets set LINE_CHANNEL_SECRET=xxx
supabase functions deploy --all
```

### 3. pg_cron 設定

```bash
# supabase/setup-cron.sql を編集
# YOUR_PROJECT_REF を置換
# Dashboard > SQL Editor で実行
```

### 4. Netlify デプロイ

```bash
# 環境変数を設定
# Build command: npm run build
# Publish directory: .next
```

---

## 進捗

```
██████████████████████░░ 95%

完了: 認証、誓約、プロジェクト、提出、判定、LINE通知
残り: Stripe連携、Supabaseテーブル作成
```

---

最終更新: 2026-01-06
