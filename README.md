# TalentSync - タレントマネジメントシステム

中小企業（30〜100名規模）向けのタレントマネジメントシステムです。
社員のストレングスファインダー®・SPI診断結果を一元管理し、AIによる分析・アドバイス機能で人事・マネージャーの意思決定をサポートします。

---

## 技術スタック

| レイヤー | 技術 | バージョン |
|----------|------|-----------|
| **フロントエンド** | Vue 3 + Vite + TailwindCSS 4 | Vue 3.5, Vite 8 |
| **バックエンド** | Hono (TypeScript) | 4.6 |
| **データベース** | PostgreSQL (Neon serverless) | - |
| **ORM** | Drizzle ORM | 0.41 |
| **認証** | Better Auth | 1.1 |
| **AI** | Claude API (Anthropic SDK) | - |
| **状態管理** | Pinia | 3.0 |
| **バリデーション** | Zod | 3.24 |
| **パッケージ管理** | pnpm workspaces | 9.x |
| **ランタイム** | Node.js | >=20 |

---

## プロジェクト構成（モノレポ）

```
talent-management-system/
├── client/                  # Vue 3 フロントエンド (@talent/client)
│   └── src/
│       ├── views/           # ページコンポーネント (16画面)
│       ├── components/      # 共通コンポーネント
│       ├── composables/     # Vue Composables (useAuth, useEmployee等)
│       ├── stores/          # Pinia ストア
│       ├── router/          # Vue Router
│       └── lib/             # APIクライアント、認証
├── server/                  # Hono バックエンド (@talent/server)
│   └── src/
│       ├── routes/          # APIエンドポイント (9ファイル)
│       ├── services/        # ビジネスロジック
│       ├── middleware/      # 認証、CORS、セキュリティ
│       ├── db/              # Drizzle スキーマ・マイグレーション
│       └── lib/             # Better Auth設定、Claude SDK
├── shared/
│   └── types/               # 共有型定義 (@talent/types)
├── docs/                    # ドキュメント
├── .github/workflows/       # CI/CD (GitHub Actions)
├── Dockerfile               # サーバーコンテナ (Node 20-slim)
├── vercel.json              # フロントエンドデプロイ設定
└── pnpm-workspace.yaml      # モノレポ定義
```

---

## クイックスタート

### 前提条件

- Node.js >= 20
- pnpm >= 9

### デモモードで試す（5分）

```bash
pnpm install
pnpm dev        # フロントエンド: http://localhost:5173
pnpm dev:server # バックエンド: http://localhost:8080
# または両方同時に起動:
pnpm dev:all
```

### 本番モードで動かす

詳細は [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) を参照してください。

---

## デプロイ構成

| コンポーネント | プラットフォーム | 備考 |
|----------------|-----------------|------|
| フロントエンド | Vercel | Vite ビルド + SPA リライト |
| バックエンド | Google Cloud Run (asia-northeast1) | Docker コンテナ |
| データベース | Neon serverless PostgreSQL | - |
| AI | Anthropic Claude API | - |

---

## 主要コマンド

```bash
pnpm dev              # フロントエンド開発サーバー
pnpm dev:server       # バックエンド開発サーバー
pnpm dev:all          # 全サービス並列起動
pnpm build            # 全体ビルド
pnpm lint             # リント
pnpm db:push          # DBスキーマ反映 (Drizzle)
pnpm db:generate      # マイグレーション生成
pnpm db:seed          # シードデータ投入
```

---

## ドキュメント一覧

### 製品情報

| ドキュメント | 対象読者 | 内容 |
|--------------|----------|------|
| [01_PRODUCT_OVERVIEW.md](./docs/01_PRODUCT_OVERVIEW.md) | 全員 | 製品概要、機能紹介、導入効果 |
| [02_FEATURE_SPECIFICATION.md](./docs/02_FEATURE_SPECIFICATION.md) | 導入検討者、開発者 | 機能の詳細仕様 |

### 利用ガイド

| ドキュメント | 対象読者 | 内容 |
|--------------|----------|------|
| [03_USER_GUIDE.md](./docs/03_USER_GUIDE.md) | 一般ユーザー | 基本的な操作方法 |
| [04_ADMIN_GUIDE.md](./docs/04_ADMIN_GUIDE.md) | 管理者 | 設定、データ管理方法 |

### セキュリティ・法務

| ドキュメント | 対象読者 | 内容 |
|--------------|----------|------|
| [05_SECURITY.md](./docs/05_SECURITY.md) | 情報システム部門 | セキュリティ対策詳細 |
| [06_TERMS_OF_SERVICE.md](./docs/06_TERMS_OF_SERVICE.md) | 契約担当者 | 利用規約 |
| [07_PRIVACY_POLICY.md](./docs/07_PRIVACY_POLICY.md) | 全員 | 個人情報取扱い方針 |

### 技術ドキュメント

| ドキュメント | 対象読者 | 内容 |
|--------------|----------|------|
| [SETUP_GUIDE.md](./docs/SETUP_GUIDE.md) | 開発者、運用担当 | 環境構築手順 |
| [QUICK_START.md](./docs/QUICK_START.md) | 開発者 | クイックスタートガイド |
| [ARCHITECTURE.md](./docs/ARCHITECTURE.md) | 開発者 | アーキテクチャ・API仕様 |

---

*© 2025 TalentSync. All rights reserved.*
*ストレングスファインダー®はGallup, Inc.の登録商標です。*
