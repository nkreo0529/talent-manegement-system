# 本番環境セットアップ記録

作成日: 2026-03-12
最終更新: 2026-03-15

---

## 全体像：何をしているのか

ローカルで開発していたタレントマネジメントシステムを**インターネット上で誰でもアクセスできる状態**にする作業。

```
開発環境（ローカルPC）              本番環境（クラウド）
─────────────────                  ──────────────────
localhost:5173 (Client/Vue3)  →    Vercel ✅ 完了
localhost:8080 (Server/Hono)  →    Cloud Run ✅ 完了
ローカルDB                    →    Neon DB ✅ 完了
```

### 本番URL

| サービス | URL |
|---------|-----|
| フロントエンド | https://talent-manegement-system.vercel.app |
| バックエンドAPI | https://talent-mgmt-api-661290259058.asia-northeast1.run.app |
| GCPプロジェクト | talent-management-489923 |

### 通信の流れ

```
ブラウザ (Vercel)
    │
    │ /api/* へのリクエスト
    │
    ▼
Vercel Rewrites（プロキシ）
    │
    │ Cloud Runに転送
    │
    ▼
Cloud Run (Hono API)
    │
    │ DB操作
    │
    ▼
Neon DB (PostgreSQL)
```

※ APIリクエストはVercelのRewritesでCloud Runに転送される。ブラウザから見ると同一ドメインのため、Cookieが正常に機能する。

---

## ステップ1: Neon DB（完了）

### 何をしたか
- Neon上にPostgreSQLデータベースを作成
- `pnpm db:push` でDrizzleスキーマ（`server/src/db/schema.ts`）をDBに反映

### 何のためか
ローカルのDBではPCが起動していないとデータにアクセスできない。Neonに置くことで24時間アクセス可能になる。

---

## ステップ2: GCPプロジェクト作成（完了）

### 何をしたか
- GCPコンソール（UI）からプロジェクト作成
- プロジェクトID: `talent-management-489923`
- お支払いアカウントの紐付け
- 予算アラート設定: $0 / 閾値0%（少しでも課金が発生したら即通知）

### 何のためか
Cloud Runなどのサービスを使うための「箱」。課金管理やリソース管理の単位になる。

### 学んだこと
- GCPは課金アカウント必須だが、無料枠が大きい（Cloud Run: 月200万リクエスト等）
- 無料枠を超えた分だけ課金が発生する（従量課金モデル）
- 予算アラートは通知のみ（自動停止はしない）
- プロジェクト単位で削除すれば全リソースが停止・削除される（30日間は復元可能）

---

## ステップ3: API有効化（完了）

### 何をしたか
GCPコンソールの検索バーから以下3つのAPIを検索し「有効にする」を実行。

| API名 | 役割 |
|--------|------|
| **Cloud Build API** | Dockerfileからコンテナイメージをビルド |
| **Artifact Registry API** | ビルドしたコンテナイメージの保管・バージョン管理 |
| **Cloud Run Admin API** | コンテナの実行・HTTPリクエストの受付 |

### 何のためか
デプロイには「ビルド → 保管 → 実行」の3ステップが必要で、それぞれ専用のサービスが担当する。

```
ソースコード → Cloud Build（ビルド）→ Artifact Registry（保管）→ Cloud Run（実行）
```

### 学んだこと
- GCPは各サービスを明示的に有効化する設計（セキュリティとコスト管理のため）
- 3つを分離することで柔軟な運用が可能（例：同じイメージを複数リージョンで実行、ビルドだけ先に走らせる等）

---

## ステップ4: CLIのプロジェクト切り替え（完了）

### 何をしたか
```bash
gcloud config set project talent-management-489923
```

### 何のためか
以降の `gcloud` コマンドがすべてこのプロジェクトに対して実行されるようにするため。どのディレクトリからでも実行可能（グローバル設定）。

---

## ステップ5: Cloud Runへのデプロイ（完了）

### 何をしたか
サーバーアプリ（Hono）をCloud Runにデプロイし、公開URLを取得した。

**デプロイURL**: `https://talent-mgmt-api-661290259058.asia-northeast1.run.app`

### デプロイコマンド
```bash
gcloud run deploy talent-mgmt-api \
  --source . \
  --region asia-northeast1 \
  --set-env-vars NODE_ENV=production \
  --set-env-vars "DATABASE_URL=<Neon接続文字列>" \
  --allow-unauthenticated
```

| オプション | 説明 |
|-----------|------|
| `talent-mgmt-api` | Cloud Runのサービス名（URLにも使われる） |
| `--source .` | カレントディレクトリをアップロード＆ビルド |
| `--region asia-northeast1` | 東京リージョン |
| `--set-env-vars` | コンテナに渡す環境変数 |
| `--allow-unauthenticated` | 認証なしでHTTPアクセスを許可（公開API） |

### 解決したトラブル

| # | 問題 | 原因 | 解決方法 | 学び |
|---|------|------|---------|------|
| 1 | `reserved env names: PORT` | Cloud Runの予約変数を指定した | `PORT=8080` を削除 | Cloud Runは`PORT`を自動設定する |
| 2 | Buildpacksが使われた | Dockerfileが `server/` にしかなかった | ルートにDockerfileをコピー | `--source .` はルートのDockerfileを探す |
| 3 | `pnpm-lock.yaml is absent` | runnerステージにロックファイルがなかった | `COPY --from=builder` で追加 | マルチステージではファイルは自動で引き継がれない |
| 4 | `ERR_MODULE_NOT_FOUND` | `moduleResolution: "bundler"` とNode.js ESMの非互換 | Dockerfileを `tsx` で直接実行する方式に変更 | `node` のESMは `.js` 拡張子必須、`tsx` は不要 |
| 5 | DB接続エラー | コピペでURLに改行が混入 | `gcloud run services update` で修正 | 環境変数だけの更新は再ビルド不要 |
| 6 | `BetterAuthError` (SECRET) | `BETTER_AUTH_SECRET` 未設定 | `--update-env-vars` で追加 | ログの `exit(1)` 直前が根本原因 |
| 7 | `BetterAuthError` (user model) | better-auth用テーブルがスキーマに未定義 | `user`, `session`, `account`, `verification` テーブルを追加し `db:push` | better-authはDrizzleスキーマに認証テーブルが必要 |

### Dockerfileの変更点

元のDockerfileはマルチステージビルド（builder → runner）で `node dist/index.js` を実行する構成だった。以下の理由でシングルステージ + `tsx` に変更：

- `tsconfig.json` の `moduleResolution: "bundler"` がNode.js ESMと非互換
- `tsx` はTypeScriptを直接実行するので拡張子問題を回避できる

```dockerfile
# 現在の構成（シングルステージ）
FROM node:20-slim
# ...全依存インストール → tsx で直接実行
CMD ["npx", "tsx", "src/index.ts"]
```

将来イメージサイズを最適化したい場合は、`moduleResolution` を `"nodenext"` に変更し、全importに `.js` 拡張子を追加すればマルチステージに戻せる。

---

## ステップ6: 環境変数の設定（完了）

### Cloud Run に設定済みの環境変数

| 変数 | 役割 | 設定方法 |
|------|------|---------|
| `DATABASE_URL` | Neon DBへの接続文字列 | デプロイコマンドの `--set-env-vars` |
| `NODE_ENV` | 本番モード指定（`production`） | デプロイコマンドの `--set-env-vars` |
| `BETTER_AUTH_SECRET` | セッション暗号化の秘密鍵 | `gcloud run services update --update-env-vars` |
| `CORS_ORIGIN` | フロントエンドURL | `gcloud run services update --update-env-vars` |

### Vercel に設定済みの環境変数

| 変数 | 値 | 役割 |
|------|---|------|
| `VITE_API_BASE_URL` | 空 | APIリクエストを同一ドメインに送信（Rewritesで転送） |
| `VITE_DEMO_MODE` | `false` | 本番DBを使用 |

### 環境変数コマンドの使い分け

| コマンド | 動作 |
|---------|------|
| `--set-env-vars` | 既存の環境変数を**すべて上書き** |
| `--update-env-vars` | 既存の環境変数を**保持したまま追加・更新** |

### BETTER_AUTH_SECRET について

- better-auth がセッショントークンを暗号化するための秘密鍵
- `openssl rand -base64 32` でランダム生成した
- **安全な場所に保管が必要**（変更すると全セッション無効化）
- 本番運用開始後はむやみに変更しない

### 現在の値の確認コマンド
```bash
gcloud run services describe talent-mgmt-api --region asia-northeast1 --format="value(spec.template.spec.containers[0].env)"
```

---

## ステップ7: Vercelへのデプロイ（完了）

### 何をしたか
フロントエンド（Vue 3 + Vite）をVercelにデプロイした。

**デプロイURL**: https://talent-manegement-system.vercel.app

### Vercel設定

GitHubリポジトリ連携でデプロイ。設定は `vercel.json`（プロジェクトルート）で管理：

```json
{
  "buildCommand": "pnpm --filter @talent/types build && pnpm --filter @talent/client build",
  "outputDirectory": "client/dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://talent-mgmt-api-xxx.run.app/api/:path*"
    },
    {
      "source": "/((?!api/).*)",
      "destination": "/index.html"
    }
  ]
}
```

### 解決したトラブル

| # | 問題 | 原因 | 解決方法 | 学び |
|---|------|------|---------|------|
| 1 | `@talent/types` 解決不可 | Root Directoryを `client` にすると `shared/` が見えない | Root Directoryをルートに変更し、Build Commandで共有型も一緒にビルド | モノレポではビルド時に全ワークスペースが見える必要がある |
| 2 | 404エラー（SPA） | `client/vercel.json` のrewritesが適用されなかった | ルートに `vercel.json` を作成しSPA用rewritesを追加 | SPAは全パスを `index.html` に転送する必要がある |
| 3 | ログイン後に遷移しない | クロスドメインCookieがブラウザに保存されない | Vercel Rewritesで `/api/*` をCloud Runに転送（同一ドメイン化） | 異なるドメイン間のCookieはブラウザが拒否する |

### クロスドメインCookie問題の詳細

VercelとCloud Runは別ドメインのため、Cloud Runが返すセッションCookieがブラウザに保存されなかった。

```
【修正前】ブラウザ → Cloud Run（別ドメイン）→ Cookie拒否 ❌
【修正後】ブラウザ → Vercel /api/* → Cloud Runに転送 → Cookie保存 ✅
```

Vercel Rewritesを使うことで、ブラウザから見ると同じドメインへのリクエストになるため、Cookieが正常に機能する。これに伴い `VITE_API_BASE_URL` を空にして、APIリクエストをVercelの同一ドメインに送るようにした。

---

## ステップ8: CI/CDビルドエラーの修正（完了）

### 何をしたか
GitHub Actionsのビルドエラーを修正した。

| ファイル | 問題 | 修正 |
|---------|------|------|
| 3つのワークフロー `.yml` | pnpmバージョン二重指定 | `version` 指定を削除（`packageManager`フィールドから自動検出に統一） |
| `client/src/lib/api.ts` | TS5.9 `erasableSyntaxOnly` エラー | コンストラクタの `public` パラメータを通常のプロパティ宣言に変更 |
| Vue templates (3ファイル) | snake_case → camelCase不整合 | `overallGrade`, `strengthsComment`, `managerId`, `jobType` に統一 |

### 学んだこと
- `pnpm/action-setup@v4` は `package.json` の `packageManager` フィールドを自動検出する
- TypeScript 5.9ではコンストラクタの `public` パラメータ宣言がデフォルトで制限される
- DBスキーマ（snake_case）とTypeScript型（camelCase）の変換で不整合が起きやすい

---

## ステップ9: 初期ユーザー作成（完了）

### 何をしたか
curlコマンドでbetter-authのサインアップAPIを呼び出し、初期管理者ユーザーを作成した。

```bash
curl -X POST https://talent-mgmt-api-xxx.run.app/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"Password123","name":"管理者"}'
```

### 何のためか
ログイン画面にサインアップUIがないため、APIから直接ユーザーを作成した。社内SaaSではセキュリティ上、自由なサインアップは設けず管理者招待制が適切。

### 学んだこと
- better-authは `/api/auth/sign-up/email` エンドポイントを自動提供する
- パスワードはハッシュ化されてDBに保存される（元のパスワードは保存されない）
- 社内SaaSでは「管理者がユーザーを作成する」方式が推奨

---

## ログの確認方法

### GCPコンソール（おすすめ）
1. https://console.cloud.google.com → Cloud Run → talent-mgmt-api → 「ログ」タブ

### CLI
```bash
# 最新ログを10件表示
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=talent-mgmt-api" --project=talent-management-489923 --limit=10 --format="value(textPayload)"

# リアルタイムでログを流す（Ctrl+Cで停止）
gcloud run services logs tail talent-mgmt-api --region asia-northeast1 --project=talent-management-489923
```

### エラーの根本原因の見つけ方

1. 最新リビジョンでフィルタ: `resource.labels.revision_name="<リビジョン名>"`
2. `severity>=WARNING` で重要なログだけ表示
3. **`exit(1)` の直前にあるログが根本原因**

### ログの種類

| logNameの末尾 | 種類 | 有用度 |
|--------------|------|--------|
| `/stdout` `/stderr` | アプリの出力 | ◎ エラーメッセージ本体 |
| `/varlog/system` | Cloud Runシステムログ | △ 「起動失敗」という結果 |
| `/requests` | HTTPリクエストログ | △ ステータスコード |
| `/cloudaudit.googleapis.com/system_event` | 監査ログ | △ 結果の記録 |

---

## 動作確認

### ヘルスチェック
```bash
curl https://talent-mgmt-api-661290259058.asia-northeast1.run.app/health
# → {"status":"ok","timestamp":"..."}
```

### ログイン確認
- https://talent-manegement-system.vercel.app でログイン画面表示 ✅
- メール・パスワードでログイン成功 ✅
- セッションがNeon DBに保存されることを確認 ✅

---

## 習得したスキル

- **GCPリソース管理**: プロジェクト作成、API有効化、環境変数設定
- **コンテナデプロイ**: ソース → ビルド → 保管 → 実行の流れ
- **Cloud Runのログ確認**: GCPコンソール・CLI両方でのログ確認とエラー特定
- **トラブルシューティング**: ログの `exit(1)` 直前を見て原因特定 → 環境変数で修正
- **Vercelデプロイ**: モノレポ構成でのビルド設定、Rewrites設定
- **クロスドメイン問題**: Cookie制限の理解とプロキシによる解決
- **認証システム**: better-authのセットアップ、スキーマ定義、ユーザー作成

---

## コスト管理

### 無料枠

| サービス | 無料枠（月あたり） |
|---------|-------------------|
| Cloud Run | CPU 180,000 vCPU秒、メモリ 360,000 GiB秒、200万リクエスト |
| Cloud Build | 120分/日のビルド時間 |
| Artifact Registry | 0.5 GB ストレージ |
| Vercel | 月100GB帯域、個人プロジェクトは無料 |
| Neon | 無料プランあり |

### 注意事項
- 予算アラート: $0 / 閾値0% で設定済み（通知のみ、自動停止はしない）
- Cloud Runは最小インスタンス0（アクセスがなければ$0）
- 古いコンテナイメージが溜まるとArtifact Registryの無料枠を超える可能性あり
- GCPの認証情報やサービスアカウントキーをGitにコミットしない

---

## ステップ10: シードデータ投入（完了）

### 何をしたか
`pnpm db:seed` で本番Neon DBに40人分のサンプルデータを投入した。

### 投入データ

| データ | 件数 |
|--------|------|
| チーム | 5 |
| 従業員 | 40 |
| ストレングス（34資質） | 40 |
| SPI結果 | 30 |
| キャリア履歴 | 60 |
| 評価記録 | 58 |

### 修正した点
`server/package.json` の `db:seed` スクリプトに `--env-file=.env` を追加。`tsx` はデフォルトでは `.env` ファイルを読み込まないため、Node.js 20.6+ の `--env-file` フラグで明示的に読み込む。

```json
"db:seed": "tsx --env-file=.env src/db/seed.ts"
```

### 学んだこと
- `tsx` / `node` はデフォルトでは `.env` を読み込まない（`dotenv` パッケージか `--env-file` フラグが必要）
- `drizzle-kit` は自前で `.env` を読むので修正不要だが、自作スクリプトには `--env-file` が必要
- シードスクリプトは `user`/`session` テーブル（better-auth管理）には触れないので、ログインユーザーは影響なし

---

## ステップ11: CI/CD設定（完了）

### 何をしたか
GitHub Actionsからサーバーを自動デプロイするための認証基盤（Workload Identity Federation）とシークレット管理（GCP Secret Manager）を構築した。

### CI/CDの全体像

```
GitHub (push to main)
    │
    │ server/** or shared/** に変更
    │
    ▼
GitHub Actions (deploy-server.yml)
    │
    │ ① WIF でGCP認証（サービスアカウントキー不要）
    │ ② Docker build → Artifact Registry に push
    │ ③ Cloud Run にデプロイ（Secret ManagerからDB接続情報等を注入）
    │
    ▼
Cloud Run (新リビジョンで稼働)
```

### クライアント側のCI/CD
Vercelの**Git連携で自動デプロイ**されるため、GitHub Actionsからのデプロイは不要。`deploy-client.yml` は削除した。二重デプロイを防ぐため。

### Workload Identity Federation (WIF) とは

従来のGCP認証ではサービスアカウントキー（JSONファイル）が必要だったが、WIFでは**GitHub ActionsのOIDCトークン**を使ってGCPに認証できる。

```
【従来】GitHub Actions → サービスアカウントキー（JSON）→ GCP
        → キーの漏洩リスク、定期的なローテーションが必要

【WIF】 GitHub Actions → OIDCトークン → Workload Identity Pool → GCP
        → キー不要、トークンは短命（自動失効）、リポジトリ単位で制限可能
```

### WIF設定手順

#### 1. サービスアカウント作成
```bash
gcloud iam service-accounts create github-actions-deploy \
  --display-name="GitHub Actions Deploy" \
  --project=talent-management-489923
```

#### 2. サービスアカウントに必要なロールを付与
```bash
SA_EMAIL="github-actions-deploy@talent-management-489923.iam.gserviceaccount.com"
PROJECT="talent-management-489923"

# 4つのロールを付与
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA_EMAIL" --role="roles/run.admin"              # Cloud Runデプロイ
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA_EMAIL" --role="roles/artifactregistry.writer" # イメージpush
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA_EMAIL" --role="roles/iam.serviceAccountUser"  # SA利用権限
gcloud projects add-iam-policy-binding $PROJECT \
  --member="serviceAccount:$SA_EMAIL" --role="roles/secretmanager.secretAccessor" # シークレット読取
```

| ロール | 用途 |
|--------|------|
| `roles/run.admin` | Cloud Runサービスのデプロイ・更新 |
| `roles/artifactregistry.writer` | Dockerイメージのpush |
| `roles/iam.serviceAccountUser` | Cloud Runがサービスアカウントとして動作するため |
| `roles/secretmanager.secretAccessor` | Secret Managerからシークレットを読み取り |

#### 3. Workload Identity Pool 作成
```bash
gcloud iam workload-identity-pools create "github-pool" \
  --project="talent-management-489923" \
  --location="global" \
  --display-name="GitHub Actions Pool"
```

#### 4. OIDC プロバイダー作成
```bash
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
  --project="talent-management-489923" \
  --location="global" \
  --workload-identity-pool="github-pool" \
  --display-name="GitHub Provider" \
  --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository" \
  --attribute-condition="assertion.repository=='nkreo0529/talent-manegement-system'" \
  --issuer-uri="https://token.actions.githubusercontent.com"
```

- `--attribute-condition` で**このリポジトリからのリクエストのみ許可**する（セキュリティ上重要）
- `--issuer-uri` はGitHub Actionsが発行するOIDCトークンの発行元

#### 5. サービスアカウントにWIFバインディング設定
```bash
PROJECT_NUMBER="661290259058"  # gcloud projects describe で取得可能
gcloud iam service-accounts add-iam-policy-binding \
  "$SA_EMAIL" \
  --project="talent-management-489923" \
  --role="roles/iam.workloadIdentityUser" \
  --member="principalSet://iam.googleapis.com/projects/$PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/attribute.repository/nkreo0529/talent-manegement-system"
```

### GCP Secret Manager

Cloud Runの環境変数としてシークレットを直接埋め込む代わりに、**Secret Manager**で一元管理する。CI/CDデプロイ時に `deploy-cloudrun` アクションが自動注入する。

#### 登録済みシークレット

| シークレット名 | 内容 |
|---------------|------|
| `DATABASE_URL` | Neon DB接続文字列 |
| `BETTER_AUTH_SECRET` | セッション暗号化キー |
| `CORS_ORIGIN` | フロントエンドURL |
| `ANTHROPIC_API_KEY` | AI機能用（プレースホルダー） |

#### シークレットの操作コマンド
```bash
# 値の確認
gcloud secrets versions access latest --secret=SECRET_NAME --project=talent-management-489923

# 値の更新
echo -n '新しい値' | gcloud secrets versions add SECRET_NAME --data-file=- --project=talent-management-489923

# 一覧表示
gcloud secrets list --project=talent-management-489923
```

### Artifact Registry

Dockerイメージの保管場所。Cloud Buildが自動ビルドする場合とは異なり、GitHub ActionsでDocker buildしたイメージをここにpushし、Cloud Runが参照する。

```bash
# リポジトリ作成コマンド
gcloud artifacts repositories create talent-mgmt-api \
  --repository-format=docker \
  --location=asia-northeast1 \
  --description="Talent Management API Docker images"
```

### GitHub Secrets に設定した値

| Secret名 | 値 |
|-----------|-----|
| `GCP_PROJECT_ID` | `talent-management-489923` |
| `WIF_PROVIDER` | `projects/661290259058/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `WIF_SERVICE_ACCOUNT` | `github-actions-deploy@talent-management-489923.iam.gserviceaccount.com` |

### deploy-server.yml の修正点

| 修正内容 | 修正前 | 修正後 | 理由 |
|---------|--------|--------|------|
| サービス名 | `talent-api` | `talent-mgmt-api` | 手動デプロイと統一 |
| Dockerfile | `-f server/Dockerfile` | ルートの `Dockerfile` を使用 | `server/Dockerfile` はマルチステージ版で動作しない（moduleResolution非互換） |
| Artifact Registry名 | `talent-api/` | `talent-mgmt-api/` | サービス名と統一 |

### 解決したトラブル

| # | 問題 | 原因 | 解決方法 | 学び |
|---|------|------|---------|------|
| 1 | `Cannot update environment variable [DATABASE_URL] to the given type` | `DATABASE_URL` 等が通常の環境変数として設定済みだが、ワークフローはSecret Manager参照として設定しようとした | `--remove-env-vars` と `--update-secrets` を**同時に**実行して型を切り替え | Cloud Runでは環境変数とシークレット参照は別の型。型の変更は削除と再設定を1コマンドで行う必要がある |

```bash
# 環境変数 → Secret Manager参照への切り替えコマンド
gcloud run services update talent-mgmt-api \
  --region asia-northeast1 \
  --remove-env-vars DATABASE_URL,BETTER_AUTH_SECRET,CORS_ORIGIN \
  --update-secrets "DATABASE_URL=DATABASE_URL:latest,BETTER_AUTH_SECRET=BETTER_AUTH_SECRET:latest,CORS_ORIGIN=CORS_ORIGIN:latest"
```

### 学んだこと
- WIFはサービスアカウントキーなしで安全に認証できる。OIDCトークンは短命で自動失効するため、キー漏洩リスクがない
- `--attribute-condition` でリポジトリを制限しないと、他のGitHubリポジトリからもGCPにアクセスできてしまう
- Secret Managerで一元管理すると、環境変数の値を変更する際にCloud Runの再デプロイが不要
- Vercel Git連携済みの場合、GitHub Actionsからの追加デプロイは二重デプロイになる
- Cloud Runの環境変数とSecret Manager参照は**別の型**。切り替え時は削除と設定を同時に行わないとコンテナ起動失敗になる

---

## 残りの作業

| # | ステップ | 状態 |
|---|---------|------|
| 1 | ANTHROPIC_API_KEY設定（AI機能有効化時） | ⬜ |
