# クイックスタートガイド

最短でアプリケーションを動かすための手順です。

---

## デモモードで試す（5分）

Supabase設定なしで、ダミーデータを使って動作確認できます。

```bash
# 依存関係インストール
npm install

# 開発サーバー起動
npm run dev
```

ブラウザで http://localhost:5173 を開く → 自動的にデモモードで起動

---

## 本番モードで動かす（30分）

### Step 1: Supabase準備

1. [supabase.com](https://supabase.com) でプロジェクト作成
2. SQL Editorで以下を実行：
   - `supabase/migrations/001_create_tables.sql`
   - `supabase/migrations/002_rls_policies.sql`

### Step 2: 環境変数設定

```bash
cp .env.example .env
```

`.env` を編集してSupabaseの値を設定

### Step 3: 起動

```bash
npm run dev
```

---

## 主要な画面

| URL | 画面 | 説明 |
|-----|------|------|
| `/` | ダッシュボード | 統計情報とクイックアクション |
| `/employees` | 社員一覧 | 全社員の検索・フィルタリング |
| `/employees/:id` | 社員詳細 | SF/SPI分析、AIプロフィール |
| `/teams` | チーム一覧 | チーム情報と構成 |
| `/analysis/strengths` | SF分析 | 全社のストレングス分布 |
| `/analysis/spi` | SPI分析 | 全社のSPI傾向 |
| `/ai-consultation` | AI相談 | @メンションで社員情報を参照 |
| `/admin/*` | 管理画面 | データ管理（管理者のみ） |

---

## よく使うコマンド

```bash
# 開発サーバー
npm run dev

# ビルド
npm run build

# 型チェック
npm run type-check

# Vercelデプロイ
vercel --prod
```
