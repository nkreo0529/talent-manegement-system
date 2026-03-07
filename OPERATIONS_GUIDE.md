# 運用ガイド

## システム構成

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Vercel         │────▶│   Cloud Run      │────▶│   Neon DB        │
│   (Client)       │     │   (Server/Hono)  │     │   (PostgreSQL)   │
└──────────────────┘     └──────────────────┘     └──────────────────┘
                                   │
                                   ▼
                         ┌──────────────────┐
                         │   Anthropic API  │
                         │   (Claude)       │
                         └──────────────────┘
```

## 環境変数

### Client (Vercel)

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `VITE_API_BASE_URL` | Server API の URL | `https://talent-api-xxx.run.app` |
| `VITE_DEMO_MODE` | デモモード有効化 | `true` / `false` |

### Server (Cloud Run)

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `DATABASE_URL` | Neon PostgreSQL 接続文字列 | ✓ |
| `ANTHROPIC_API_KEY` | Claude API キー | ✓ |
| `BETTER_AUTH_SECRET` | 認証用シークレット | ✓ |
| `CORS_ORIGIN` | フロントエンド URL | ✓ |
| `PORT` | サーバーポート | デフォルト: 8080 |
| `NODE_ENV` | 環境 | `production` |

## ローカル開発

```bash
# 依存関係インストール
pnpm install

# 共有型をビルド
pnpm --filter @talent/types build

# サーバー起動 (http://localhost:8080)
pnpm --filter @talent/server dev

# クライアント起動 (http://localhost:5173)
pnpm --filter @talent/client dev

# 両方を同時起動
pnpm dev:all
```

## データベース操作

```bash
# スキーマをDBにプッシュ
pnpm db:push

# マイグレーション生成
pnpm db:generate

# シードデータ投入
pnpm db:seed

# Drizzle Studio起動
pnpm --filter @talent/server db:studio
```

## デプロイ

### 自動デプロイ (GitHub Actions)

- `main` ブランチへのプッシュで自動デプロイ
- `server/` 変更 → Cloud Run
- `client/` 変更 → Vercel

### 手動デプロイ

```bash
# Server (Cloud Run)
cd server
docker build -t talent-api .
docker push [REGISTRY]/talent-api

# Client (Vercel)
cd client
vercel --prod
```

## モニタリング

### ログ確認

```bash
# Cloud Run ログ
gcloud logging read "resource.type=cloud_run_revision" --limit=50

# ローカルログ
pnpm --filter @talent/server dev 2>&1 | tee server.log
```

### ヘルスチェック

```bash
# Server
curl https://[SERVER_URL]/health

# 期待されるレスポンス
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

## トラブルシューティング

### 認証エラー (401)

1. `BETTER_AUTH_SECRET` が正しく設定されているか確認
2. Cookie が正しく送信されているか確認 (`credentials: include`)
3. CORS 設定を確認

### データベース接続エラー

1. `DATABASE_URL` の形式を確認
2. Neon コンソールでプロジェクトが起動中か確認
3. IP制限がある場合は Cloud Run の IP を許可

### AI機能エラー

1. `ANTHROPIC_API_KEY` が有効か確認
2. API クォータを確認
3. モデル名が正しいか確認 (`claude-sonnet-4-20250514`)

## バックアップとリストア

### Neon DB バックアップ

Neon は自動的にPoint-in-Time Recovery をサポート。コンソールから任意の時点に復元可能。

### 手動バックアップ

```bash
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### リストア

```bash
psql $DATABASE_URL < backup_20240101.sql
```

## スケーリング

### Cloud Run

- 自動スケーリング設定済み
- 最小インスタンス: 0
- 最大インスタンス: 10 (調整可能)

### Neon DB

- Autoscaling 有効化推奨
- コンピュートサイズ: 0.25 CU 〜 4 CU

## セキュリティ

詳細は `SECURITY_AUDIT.md` を参照。

## 連絡先

- 技術サポート: support@example.com
- 緊急連絡先: emergency@example.com
