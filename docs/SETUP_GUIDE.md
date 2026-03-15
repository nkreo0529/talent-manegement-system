# セットアップガイド

このガイドでは、Neon PostgreSQL + Better Auth + Hono を使用した本番環境の構築手順を説明します。

---

## 目次

1. [前提条件](#1-前提条件)
2. [Neon PostgreSQL セットアップ](#2-neon-postgresql-セットアップ)
3. [環境変数の設定](#3-環境変数の設定)
4. [データベーススキーマの反映](#4-データベーススキーマの反映)
5. [初期データ投入](#5-初期データ投入)
6. [アプリケーション起動](#6-アプリケーション起動)
7. [本番デプロイ](#7-本番デプロイ)
8. [トラブルシューティング](#8-トラブルシューティング)

---

## 1. 前提条件

| 要件 | バージョン |
|------|-----------|
| Node.js | >= 20 |
| pnpm | >= 9 |
| Git | 最新版 |

```bash
# pnpm のインストール（未導入の場合）
npm install -g pnpm

# バージョン確認
node -v   # v20.x.x 以上
pnpm -v   # 9.x.x 以上
```

---

## 2. Neon PostgreSQL セットアップ

### 2.1 アカウント作成

1. [neon.tech](https://neon.tech) にアクセス
2. GitHub または メールでアカウント作成

### 2.2 新規プロジェクト作成

| 項目 | 設定値 |
|------|--------|
| Project name | `talent-management-system` |
| Region | `Asia Pacific (Singapore)` または近いリージョン |
| PostgreSQL version | 最新版 |

### 2.3 接続情報の取得

プロジェクト作成後、ダッシュボードに表示される接続文字列をコピー:

```
postgresql://user:password@ep-xxxx.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
```

---

## 3. 環境変数の設定

### 3.1 .env ファイルの作成

```bash
cp .env.example .env
```

### 3.2 必須項目の設定

```env
# データベース接続 (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# AI機能 (Anthropic Claude API)
ANTHROPIC_API_KEY=sk-ant-api03-...

# 認証シークレット (Better Auth)
# openssl rand -base64 32 で生成推奨
BETTER_AUTH_SECRET=ランダムな文字列

# CORS許可オリジン
CORS_ORIGIN=http://localhost:5173

# フロントエンドからのAPI接続先
VITE_API_BASE_URL=http://localhost:8080
```

### 3.3 Anthropic APIキーの取得

1. [console.anthropic.com](https://console.anthropic.com) でアカウント作成
2. API Keys セクションで新しいキーを発行
3. `ANTHROPIC_API_KEY` に設定

> **重要**: `.env` ファイルは `.gitignore` に含まれています。Git にコミットされません。

---

## 4. データベーススキーマの反映

Drizzle ORM を使用してスキーマをデータベースに反映します。

```bash
# 依存関係のインストール
pnpm install

# 共有型定義のビルド（初回必須）
pnpm --filter @talent/types build

# スキーマをデータベースに反映
pnpm db:push
```

### 作成されるテーブル

#### 認証テーブル（Better Auth）
- `user` - ユーザーアカウント
- `session` - セッション管理
- `account` - プロバイダーアカウント
- `verification` - メール認証

#### ビジネステーブル
- `teams` - チーム
- `employees` - 社員
- `strengths` - ストレングスファインダー結果
- `spi_results` - SPI診断結果
- `careers` - 経歴
- `evaluations` - 評価
- `one_on_one_notes` - 1on1記録
- `ai_profiles` - AIプロフィール
- `ai_team_analysis` - チームAI分析

---

## 5. 初期データ投入

### 5.1 シードデータの投入（推奨）

```bash
pnpm db:seed
```

これにより、サンプルのチーム・社員データが自動投入されます。

### 5.2 手動での管理者ユーザー作成

1. アプリケーションを起動してブラウザからアカウント作成
2. Drizzle Studio でデータベースを操作して `employees` テーブルの `role` を `admin` に変更:

```bash
pnpm --filter @talent/server drizzle-kit studio
```

3. または、直接SQLで更新:

```sql
-- authUserId は user テーブルの id と一致させる
UPDATE employees SET role = 'admin' WHERE email = 'admin@example.com';
```

---

## 6. アプリケーション起動

### 6.1 開発モード

```bash
# 全サービス並列起動
pnpm dev:all

# または個別起動
pnpm dev         # フロントエンド (http://localhost:5173)
pnpm dev:server  # バックエンド (http://localhost:8080)
```

### 6.2 動作確認

1. ブラウザで `http://localhost:5173` を開く
2. ログイン画面が表示されることを確認
3. 作成した管理者アカウントでログイン
4. ダッシュボードが表示されれば成功

---

## 7. 本番デプロイ

### 7.1 デプロイ構成

| コンポーネント | プラットフォーム |
|----------------|-----------------|
| フロントエンド | Vercel |
| バックエンド | Google Cloud Run (asia-northeast1) |
| データベース | Neon PostgreSQL |

### 7.2 フロントエンド (Vercel)

#### Vercel CLI インストール

```bash
npm install -g vercel
```

#### プロジェクトのリンクとデプロイ

```bash
vercel link
vercel --prod
```

#### Vercel 環境変数

Vercel ダッシュボード → Project Settings → Environment Variables で設定:

| 変数名 | 値 |
|--------|-----|
| `VITE_API_BASE_URL` | Cloud Run のサービスURL |

> `vercel.json` で `/api/*` のリクエストを Cloud Run にリライトする設定済み。

### 7.3 バックエンド (Google Cloud Run)

GitHub Actions による自動デプロイが `.github/workflows/deploy-server.yml` で設定済みです。

**自動デプロイの条件**: `main` ブランチへの push で `server/` または `shared/` 以下に変更があった場合。

#### Cloud Run で必要な環境変数（シークレット）

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | Neon PostgreSQL 接続文字列 |
| `ANTHROPIC_API_KEY` | Claude API キー |
| `BETTER_AUTH_SECRET` | セッション暗号化キー |
| `CORS_ORIGIN` | Vercel のフロントエンドURL |

### 7.4 手動デプロイ（Docker）

```bash
# ビルド
docker build -t talent-mgmt-api .

# 実行
docker run -p 8080:8080 \
  -e DATABASE_URL=... \
  -e ANTHROPIC_API_KEY=... \
  -e BETTER_AUTH_SECRET=... \
  -e CORS_ORIGIN=... \
  talent-mgmt-api
```

---

## 8. トラブルシューティング

### Q: デモモードのままでバックエンドに接続されない

**原因**: 環境変数が正しく読み込まれていない

**解決策**:
1. `.env` ファイルが存在するか確認
2. `VITE_API_BASE_URL` が設定されているか確認
3. バックエンドサーバーが起動しているか確認（`pnpm dev:server`）
4. 開発サーバーを再起動

### Q: データベース接続エラー

**原因**: `DATABASE_URL` が正しくないか、Neon プロジェクトが停止中

**解決策**:
1. Neon ダッシュボードでプロジェクトがアクティブか確認
2. 接続文字列に `?sslmode=require` が含まれているか確認
3. IP制限がかかっていないか確認

### Q: 認証後にリダイレクトされない

**原因**: CORS設定またはCookie設定のミスマッチ

**解決策**:
1. `CORS_ORIGIN` がフロントエンドのURLと一致しているか確認
2. `BETTER_AUTH_SECRET` が設定されているか確認
3. ブラウザの開発者ツールでCookieがセットされているか確認

### Q: AI機能が動作しない

**原因**: Anthropic APIキーが設定されていない

**解決策**:
1. `ANTHROPIC_API_KEY` が設定されているか確認
2. APIキーが有効か確認（[console.anthropic.com](https://console.anthropic.com) で確認）
3. API利用枠が残っているか確認

### Q: pnpm コマンドが見つからない

**解決策**:
```bash
npm install -g pnpm
# または
corepack enable
corepack prepare pnpm@9 --activate
```

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

- [Neon PostgreSQL ドキュメント](https://neon.tech/docs)
- [Drizzle ORM ドキュメント](https://orm.drizzle.team)
- [Better Auth ドキュメント](https://www.better-auth.com)
- [Hono ドキュメント](https://hono.dev)
- [Vercel デプロイガイド](https://vercel.com/docs)
- [Google Cloud Run ドキュメント](https://cloud.google.com/run/docs)
