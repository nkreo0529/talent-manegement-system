# タレントマネジメントシステム セットアップガイド

このガイドでは、Supabaseを使用してデータベースを構築し、アプリケーションを本番環境で動作させる手順を説明します。

---

## 目次

1. [Supabaseプロジェクト作成](#1-supabaseプロジェクト作成)
2. [データベーステーブル作成](#2-データベーステーブル作成)
3. [環境変数の設定](#3-環境変数の設定)
4. [認証設定](#4-認証設定)
5. [初期データ投入](#5-初期データ投入)
6. [アプリケーション起動](#6-アプリケーション起動)
7. [Vercelデプロイ](#7-vercelデプロイ)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. Supabaseプロジェクト作成

### 1.1 アカウント作成

1. [supabase.com](https://supabase.com) にアクセス
2. 「Start your project」または「Sign Up」をクリック
3. GitHub、Google、またはメールでアカウント作成

### 1.2 新規プロジェクト作成

1. ダッシュボードで「New Project」をクリック
2. 以下の情報を入力：

| 項目 | 設定値 |
|------|--------|
| Organization | 選択または新規作成 |
| Project name | `talent-management-system` |
| Database Password | 強力なパスワード（必ずメモ） |
| Region | `Northeast Asia (Tokyo)` |
| Pricing Plan | Free tier で開始可能 |

3. 「Create new project」をクリック
4. プロジェクト作成完了まで2-3分待機

---

## 2. データベーステーブル作成

### 2.1 SQLエディタを開く

1. Supabaseダッシュボードの左メニューから **SQL Editor** を選択
2. 「New query」をクリック

### 2.2 テーブル作成SQLの実行

以下のファイルの内容を**順番に**実行します：

#### ステップ1: テーブル作成

ファイル: `supabase/migrations/001_create_tables.sql`

1. ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック
4. 「Success」メッセージを確認

#### ステップ2: セキュリティポリシー作成

ファイル: `supabase/migrations/002_rls_policies.sql`

1. ファイルの内容をすべてコピー
2. SQLエディタに貼り付け
3. 「Run」ボタンをクリック
4. 「Success」メッセージを確認

### 2.3 テーブル確認

1. 左メニューの **Table Editor** を選択
2. 以下の9テーブルが作成されていることを確認：
   - `teams`
   - `employees`
   - `strengths`
   - `spi_results`
   - `careers`
   - `evaluations`
   - `one_on_one_notes`
   - `ai_profiles`
   - `ai_team_analysis`

---

## 3. 環境変数の設定

### 3.1 API情報の取得

1. Supabaseダッシュボード → **Settings**（歯車アイコン）
2. **API** セクションを選択
3. 以下の値をコピー：

| 項目 | 説明 |
|------|------|
| Project URL | `https://xxxxx.supabase.co` 形式のURL |
| anon public | 公開用APIキー（フロントエンドで使用） |
| service_role | 管理用APIキー（サーバーサイドのみ） |

### 3.2 .envファイルの作成

プロジェクトルートに `.env` ファイルを作成：

```bash
cp .env.example .env
```

以下の内容を設定：

```env
# Supabase設定
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# サーバーサイド用（Vercel環境変数にも設定）
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Anthropic API（AI機能用）
ANTHROPIC_API_KEY=sk-ant-api03-...

# 開発モード設定（オプション）
# VITE_DEMO_MODE=true  # デモモードを強制する場合
```

> ⚠️ **重要**: `.env` ファイルは `.gitignore` に含まれているため、Gitにコミットされません。

---

## 4. 認証設定

### 4.1 メール認証の有効化

1. Supabaseダッシュボード → **Authentication**
2. **Providers** タブを選択
3. **Email** を展開して以下を設定：

| 設定項目 | 推奨値 |
|----------|--------|
| Enable Email provider | ON |
| Confirm email | ON（本番）/ OFF（開発） |
| Enable email confirmations | 用途に応じて |

### 4.2 URL設定

1. **Authentication** → **URL Configuration**
2. 以下を設定：

**開発環境:**
```
Site URL: http://localhost:5173
Redirect URLs: http://localhost:5173/**
```

**本番環境（Vercel）:**
```
Site URL: https://your-app.vercel.app
Redirect URLs: https://your-app.vercel.app/**
```

### 4.3 最初の管理者ユーザー作成

1. **Authentication** → **Users** タブ
2. 「Add user」→「Create new user」
3. メールアドレスとパスワードを入力
4. SQLエディタで管理者権限を付与：

```sql
-- 作成したユーザーのIDを確認
SELECT id, email FROM auth.users;

-- employeesテーブルに管理者として登録
INSERT INTO employees (auth_user_id, email, name, role)
VALUES (
  'ユーザーのUUID',
  'admin@example.com',
  '管理者',
  'admin'
);
```

---

## 5. 初期データ投入

### 5.1 チームデータの投入

```sql
INSERT INTO teams (name, description) VALUES
  ('開発チーム', 'プロダクト開発を担当'),
  ('デザインチーム', 'UI/UXデザインを担当'),
  ('営業チーム', '顧客開拓と関係構築'),
  ('マーケティングチーム', 'ブランディングと集客'),
  ('経営企画チーム', '戦略立案と組織運営');
```

### 5.2 社員データの投入

```sql
-- チームIDを取得
SELECT id, name FROM teams;

-- 社員を追加（team_idは上記で確認した値を使用）
INSERT INTO employees (email, name, team_id, job_title, job_type, role)
VALUES
  ('tanaka@example.com', '田中 太郎', 'チームのUUID', 'シニアエンジニア', 'engineer', 'manager'),
  ('sato@example.com', '佐藤 花子', 'チームのUUID', 'デザイナー', 'designer', 'member');
```

### 5.3 ストレングスファインダーデータの投入

```sql
-- 社員IDを確認
SELECT id, name FROM employees;

-- ストレングスを追加
INSERT INTO strengths (employee_id, strengths_order)
VALUES (
  '社員のUUID',
  ARRAY['achiever', 'learner', 'strategic', 'analytical', 'focus',
        'responsibility', 'deliberative', 'input', 'intellection', 'relator',
        'competition', 'significance', 'self_assurance', 'command', 'activator',
        'communication', 'woo', 'maximizer', 'developer', 'positivity',
        'empathy', 'harmony', 'includer', 'individualization', 'connectedness',
        'adaptability', 'arranger', 'belief', 'consistency', 'context',
        'discipline', 'futuristic', 'ideation', 'restorative']
);
```

---

## 6. アプリケーション起動

### 6.1 依存関係のインストール

```bash
npm install
```

### 6.2 開発サーバー起動

```bash
npm run dev
```

### 6.3 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. ログイン画面が表示されることを確認
3. 作成した管理者アカウントでログイン
4. ダッシュボードが表示されれば成功

---

## 7. Vercelデプロイ

### 7.1 Vercel CLIのインストール

```bash
npm install -g vercel
```

### 7.2 プロジェクトのリンク

```bash
vercel link
```

### 7.3 環境変数の設定

Vercelダッシュボード → Project Settings → Environment Variables で以下を設定：

| 変数名 | 値 |
|--------|-----|
| VITE_SUPABASE_URL | Supabase Project URL |
| VITE_SUPABASE_ANON_KEY | Supabase anon key |
| SUPABASE_URL | Supabase Project URL |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service_role key |
| ANTHROPIC_API_KEY | Anthropic APIキー |

### 7.4 デプロイ

```bash
vercel --prod
```

### 7.5 Supabase URL設定の更新

デプロイ後、SupabaseのURL Configurationを本番URLに更新：

1. **Authentication** → **URL Configuration**
2. Site URLを本番URLに変更
3. Redirect URLsに本番URLを追加

---

## 8. トラブルシューティング

### Q: デモモードのままでSupabaseに接続されない

**原因**: 環境変数が正しく読み込まれていない

**解決策**:
1. `.env` ファイルが存在するか確認
2. `VITE_` プレフィックスが付いているか確認
3. 開発サーバーを再起動: `npm run dev`

### Q: RLSエラーでデータが取得できない

**原因**: Row Level Securityポリシーが正しく設定されていない

**解決策**:
1. `002_rls_policies.sql` を再実行
2. ユーザーが `employees` テーブルに登録されているか確認

### Q: 認証後にリダイレクトされない

**原因**: Supabase URL Configurationの設定ミス

**解決策**:
1. Site URLが正しいか確認
2. Redirect URLsにワイルドカード (`/**`) が含まれているか確認

### Q: AI機能が動作しない

**原因**: Anthropic APIキーが設定されていない

**解決策**:
1. `ANTHROPIC_API_KEY` が設定されているか確認
2. APIキーが有効か確認（Anthropicダッシュボードで確認）

---

## データ構造の概要

```
teams (チーム)
  └── employees (社員) ─┬── strengths (SF結果)
                        ├── spi_results (SPI結果)
                        ├── careers (経歴)
                        ├── evaluations (評価)
                        ├── one_on_one_notes (1on1記録)
                        └── ai_profiles (AIプロフィール)

teams
  └── ai_team_analysis (チームAI分析)
```

---

## 参考リンク

- [Supabase公式ドキュメント](https://supabase.com/docs)
- [Supabase認証ガイド](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercelデプロイガイド](https://vercel.com/docs)
