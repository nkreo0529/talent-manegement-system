# 本番環境セットアップ記録

作成日: 2026-03-12

---

## 全体像：何をしているのか

ローカルで開発していたタレントマネジメントシステムを**インターネット上で誰でもアクセスできる状態**にする作業。

```
開発環境（ローカルPC）              本番環境（クラウド）
─────────────────                  ──────────────────
localhost:5173 (Client/Vue3)  →    Vercel（未着手）
localhost:8080 (Server/Hono)  →    Cloud Run ✅ 完了
ローカルDB                    →    Neon DB ✅ 完了
```

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
| 6 | `BetterAuthError` | `BETTER_AUTH_SECRET` 未設定 | `--update-env-vars` で追加 | ログの `exit(1)` 直前が根本原因 |

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

```bash
curl https://talent-mgmt-api-661290259058.asia-northeast1.run.app/health
# → {"status":"ok","timestamp":"2026-03-12T14:28:57.723Z"}
```

---

## 習得したスキル

- **GCPリソース管理**: プロジェクト作成、API有効化、環境変数設定
- **コンテナデプロイ**: ソース → ビルド → 保管 → 実行の流れ
- **Cloud Runのログ確認**: GCPコンソール・CLI両方でのログ確認とエラー特定
- **トラブルシューティング**: ログの `exit(1)` 直前を見て原因特定 → 環境変数で修正

---

## 残りの作業

| # | ステップ | 状態 |
|---|---------|------|
| 1 | Client → Vercelにデプロイ | ⬜ 次 |
| 2 | `CORS_ORIGIN` をCloud Runに設定（VercelのURL） | ⬜ |
| 3 | `VITE_API_BASE_URL` をVercelに設定（Cloud RunのURL） | ⬜ |
| 4 | フロントエンド ↔ バックエンド疎通確認 | ⬜ |
| 5 | シードデータ投入 | ⬜ 最後 |
