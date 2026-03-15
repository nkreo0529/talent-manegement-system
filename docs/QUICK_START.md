# クイックスタートガイド

最短でアプリケーションを動かすための手順です。

---

## 前提条件

- **Node.js** >= 20
- **pnpm** >= 9（`npm install -g pnpm` でインストール可能）

---

## デモモードで試す（5分）

環境変数の設定なしで、フロントエンドのダミーデータを使って動作確認できます。

```bash
# リポジトリのクローン
git clone https://github.com/nkreo0529/talent-manegement-system.git
cd talent-management-system

# 依存関係インストール
pnpm install

# フロントエンド開発サーバー起動
pnpm dev
```

ブラウザで http://localhost:5173 を開く → 環境変数未設定時は自動的にデモモードで起動します。

> **Note**: デモモードではバックエンドAPIへの接続は行われず、クライアント内のモックデータが使用されます。

---

## 本番モードで動かす（30分）

### Step 1: Neon PostgreSQL の準備

1. [neon.tech](https://neon.tech) でアカウント作成
2. 新規プロジェクトを作成（リージョン: Asia Pacific 推奨）
3. 接続文字列（`DATABASE_URL`）を控える

### Step 2: 環境変数設定

プロジェクトルートに `.env` ファイルを作成:

```bash
cp .env.example .env
```

`.env` を編集:

```env
# データベース (Neon PostgreSQL)
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# AI機能 (Anthropic)
ANTHROPIC_API_KEY=sk-ant-api03-...

# 認証 (Better Auth)
BETTER_AUTH_SECRET=ランダムな文字列（32文字以上推奨）

# CORS
CORS_ORIGIN=http://localhost:5173

# フロントエンド用
VITE_API_BASE_URL=http://localhost:8080
```

### Step 3: データベースのセットアップ

```bash
# スキーマをデータベースに反映
pnpm db:push

# シードデータの投入（オプション）
pnpm db:seed
```

### Step 4: 起動

```bash
# 全サービスを並列起動（フロントエンド + バックエンド）
pnpm dev:all
```

- フロントエンド: http://localhost:5173
- バックエンド: http://localhost:8080

### Step 5: 初回ログイン

1. ブラウザで http://localhost:5173 を開く
2. 「アカウント作成」から管理者ユーザーを作成
3. データベースで該当ユーザーの role を `admin` に変更:

```bash
# Drizzle Studio でGUIから変更可能
pnpm --filter @talent/server drizzle-kit studio
```

---

## 主要な画面

| URL | 画面 | 説明 |
|-----|------|------|
| `/` | ダッシュボード | 統計情報とクイックアクション |
| `/employees` | 社員一覧 | 全社員の検索・フィルタリング |
| `/employees/:id` | 社員詳細 | SF/SPI分析、AIプロフィール（6タブ） |
| `/teams` | チーム一覧 | チーム情報と構成 |
| `/teams/:id` | チーム詳細 | メンバー一覧・AI分析 |
| `/analysis/strengths` | SF分析 | 全社のストレングス分布 |
| `/analysis/spi` | SPI分析 | 全社のSPI傾向 |
| `/ai-consultation` | AI相談 | @メンションで社員情報を参照 |
| `/admin/*` | 管理画面 | データ管理（管理者のみ） |

---

## よく使うコマンド

```bash
# 開発
pnpm dev              # フロントエンド開発サーバー
pnpm dev:server       # バックエンド開発サーバー
pnpm dev:all          # 全サービス並列起動

# ビルド
pnpm build            # 全体ビルド

# データベース
pnpm db:push          # スキーマ反映
pnpm db:generate      # マイグレーション生成
pnpm db:seed          # シードデータ投入

# リント
pnpm lint             # 全パッケージのリント実行
```

---

## 次のステップ

- 本番デプロイ手順: [SETUP_GUIDE.md](./SETUP_GUIDE.md)
- アーキテクチャ詳細: [ARCHITECTURE.md](./ARCHITECTURE.md)
- 機能仕様: [02_FEATURE_SPECIFICATION.md](./02_FEATURE_SPECIFICATION.md)
