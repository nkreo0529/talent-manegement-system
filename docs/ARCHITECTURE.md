# アーキテクチャ・API仕様

## 目次

1. [システムアーキテクチャ](#1-システムアーキテクチャ)
2. [データベーススキーマ](#2-データベーススキーマ)
3. [API エンドポイント一覧](#3-api-エンドポイント一覧)
4. [認証・認可](#4-認証認可)
5. [ミドルウェア](#5-ミドルウェア)
6. [AI統合](#6-ai統合)
7. [フロントエンド構成](#7-フロントエンド構成)
8. [CI/CD](#8-cicd)
9. [環境変数](#9-環境変数)

---

## 1. システムアーキテクチャ

### 全体構成

```
[ブラウザ] ──HTTPS──▶ [Vercel (フロントエンド)]
                           │
                           │ /api/* リライト
                           ▼
                      [Cloud Run (Hono API)]
                           │
                     ┌─────┴─────┐
                     ▼           ▼
              [Neon PostgreSQL]  [Anthropic Claude API]
```

### モノレポ構成（pnpm workspaces）

| パッケージ | パス | 説明 |
|-----------|------|------|
| @talent/client | `client/` | Vue 3 フロントエンド |
| @talent/server | `server/` | Hono バックエンド |
| @talent/types | `shared/types/` | 共有型定義 |

---

## 2. データベーススキーマ

### ER図（概要）

```
user (Better Auth)
  └── session, account, verification

teams
  ├── employees (多対1)
  └── ai_team_analysis (1対1)

employees
  ├── strengths (1対1)
  ├── spi_results (1対1)
  ├── careers (1対多)
  ├── evaluations (1対多)
  ├── one_on_one_notes (1対多)
  └── ai_profiles (1対1)
```

### テーブル定義

#### 認証テーブル（Better Auth管理）

| テーブル | 用途 |
|----------|------|
| `user` | ユーザーアカウント (id, email, name, image, timestamps) |
| `session` | セッション管理 (token, userId, expiresAt, ipAddress, userAgent) |
| `account` | OAuth/プロバイダーアカウント |
| `verification` | メール認証トークン |

#### ビジネステーブル

**teams**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | チームID |
| name | VARCHAR | チーム名 |
| description | TEXT | 説明 |
| managerId | UUID (FK → employees) | マネージャー |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**employees**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | 社員ID |
| authUserId | TEXT (FK → user) | 認証ユーザーID |
| email | VARCHAR (UNIQUE) | メールアドレス |
| name | VARCHAR | 氏名 |
| nameKana | VARCHAR | 氏名（かな） |
| avatarUrl | TEXT | アバターURL |
| teamId | UUID (FK → teams) | 所属チーム |
| jobTitle | VARCHAR | 役職名 |
| jobType | ENUM | 職種 |
| role | ENUM (default: member) | 権限 |
| hireDate | DATE | 入社日 |
| isActive | BOOLEAN (default: true) | 在籍状態 |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**strengths**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| employeeId | UUID (FK → employees, CASCADE) | 社員ID |
| strengthsOrder | TEXT[] | 34資質の順位配列 |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**spi_results**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| employeeId | UUID (FK → employees, CASCADE) | 社員ID |
| personalityTraits | JSONB | Big Five (外向性,協調性,誠実性,神経症的傾向,開放性) |
| workStyle | JSONB | ワークスタイル (leadership,independence,teamwork,resilience,flexibility,stressTolerance) |
| aptitudeScores | JSONB | 適性 (verbal,mathematical,logical) |
| testDate | DATE | テスト実施日 |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**evaluations**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| employeeId | UUID (FK → employees, CASCADE) | 対象社員 |
| evaluatorId | UUID (FK → employees, RESTRICT) | 評価者 |
| period | VARCHAR | 評価期間 (例: "2024H1") |
| overallGrade | ENUM (S/A/B/C/D) | 総合評価 |
| strengthsComment | TEXT | 強みコメント |
| improvementsComment | TEXT | 改善コメント |
| goals | TEXT | 目標 |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**one_on_one_notes**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| employeeId | UUID (FK → employees, CASCADE) | 対象社員 |
| managerId | UUID (FK → employees, RESTRICT) | マネージャー |
| meetingDate | DATE | 面談日 |
| topics | TEXT[] | トピック |
| notes | TEXT | メモ |
| actionItems | TEXT[] | アクションアイテム |
| mood | ENUM (1-5) | ムード |
| createdAt, updatedAt | TIMESTAMP | タイムスタンプ |

**ai_profiles**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| employeeId | UUID (FK → employees, CASCADE) | 社員ID |
| profileSummary | TEXT | プロフィールサマリー |
| workStyleAnalysis | TEXT | ワークスタイル分析 |
| collaborationTips | TEXT | 協働のヒント |
| developmentSuggestions | TEXT | 成長提案 |
| generatedAt | TIMESTAMP | 生成日時 |
| modelVersion | VARCHAR (default: 'claude-3-opus') | <!-- TODO(実装確認): 実際のコードでは claude-sonnet-4 を使用。スキーマのデフォルト値の更新が必要 --> |

**ai_team_analysis**

| カラム | 型 | 説明 |
|--------|-----|------|
| id | UUID (PK) | ID |
| teamId | UUID (FK → teams, CASCADE) | チームID |
| teamDynamics | TEXT | チームダイナミクス |
| strengthsDistribution | TEXT | 強み分布 |
| potentialChallenges | TEXT | 潜在的課題 |
| recommendations | TEXT | 改善提案 |
| generatedAt | TIMESTAMP | 生成日時 |
| modelVersion | VARCHAR (default: 'claude-3-opus') | <!-- 上記同様 --> |

### Enum定義

| Enum | 値 |
|------|-----|
| user_role | admin, manager, member |
| job_type | engineer, designer, product_manager, sales, marketing, hr, finance, operations, other |
| evaluation_grade | S, A, B, C, D |
| mood_rating | 1, 2, 3, 4, 5 |

---

## 3. API エンドポイント一覧

ベースURL: `/api`

### 認証 (`/api/auth/*`)

Better Auth がハンドル。サインアップ、サインイン、サインアウト、セッション管理を提供。

### ユーザー情報 (`/api/me`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/` | ログイン中のユーザー情報取得 | 認証済み |
| GET | `/employee` | ログイン中ユーザーの社員レコード取得 | 認証済み |

### 社員 (`/api/employees`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/` | 社員一覧（ページネーション・フィルタ対応） | 認証済み |
| GET | `/:id` | 社員詳細 | 認証済み |
| POST | `/` | 社員作成 | admin |
| PUT | `/:id` | 社員更新 | admin, manager |
| DELETE | `/:id` | 社員削除（論理削除） | admin |

**GET `/` クエリパラメータ:**
`page`, `limit`, `teamId`, `jobType`, `role`, `isActive`, `search`, `sortBy`, `sortOrder`

### チーム (`/api/teams`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/` | チーム一覧（ページネーション対応） | 認証済み |
| GET | `/:id` | チーム詳細（メンバー・強み要約含む） | 認証済み |
| POST | `/` | チーム作成 | admin |
| PUT | `/:id` | チーム更新 | admin, manager |
| DELETE | `/:id` | チーム削除 | admin |

### ストレングスファインダー (`/api/strengths`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/:employeeId` | SF結果取得 | admin, manager |
| PUT | `/:employeeId` | SF結果 Upsert（34資質の順位配列） | admin, manager |
| DELETE | `/:employeeId` | SF結果削除 | admin |

### SPI (`/api/spi`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/:employeeId` | SPI結果取得 | admin, manager |
| PUT | `/:employeeId` | SPI結果 Upsert | admin, manager |
| DELETE | `/:employeeId` | SPI結果削除 | admin |

### 評価 (`/api/evaluations`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/employee/:employeeId` | 社員の評価一覧取得 | admin, manager |
| GET | `/:id` | 個別評価取得 | admin, manager |
| POST | `/` | 評価作成（同一期間の重複チェックあり） | admin, manager |
| PUT | `/:id` | 評価更新 | admin, manager |
| DELETE | `/:id` | 評価削除 | admin |

### AI (`/api/ai`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| POST | `/consultation` | AI相談（SSEストリーミング） | 認証済み |
| POST | `/profiles/:employeeId/generate` | AIプロフィール生成 | admin, manager |
| GET | `/profiles/:employeeId` | AIプロフィール取得 | admin, manager |
| POST | `/teams/:teamId/analyze` | チームAI分析生成 | admin, manager |
| GET | `/teams/:teamId` | チームAI分析取得 | admin, manager |

### 管理者 (`/api/admin`)

| メソッド | パス | 説明 | 権限 |
|----------|------|------|------|
| GET | `/stats` | システム統計（各テーブルのカウント） | admin |
| POST | `/ai/regenerate-all-profiles` | 全社員AIプロフィール一括再生成 | admin |
| POST | `/ai/regenerate-all-team-analysis` | 全チームAI分析一括再生成 | admin |
| GET | `/employees/without-strengths` | SF未登録の社員一覧 | admin |
| GET | `/employees/without-spi` | SPI未登録の社員一覧 | admin |

---

## 4. 認証・認可

### 認証方式

- **ライブラリ**: Better Auth (セッションベース)
- **パスワード要件**: 最小12文字
- **セッション有効期間**: 7日間（1日操作なしでリフレッシュ）
- **Cookie設定**: HttpOnly, SameSite=Strict, Secure (本番)

### RBAC（役割ベースアクセス制御）

```
権限階層（数値が高いほど上位）:
  admin (3)   - 全機能アクセス可能
  manager (2) - 自チームの評価・1on1管理
  member (1)  - 閲覧中心、自分の情報のみ
```

### 権限マトリクス

| 操作 | admin | manager | member |
|------|-------|---------|--------|
| 社員一覧閲覧 | ○ | ○ | ○ |
| 社員詳細閲覧 | ○ | ○ | ○ |
| 社員追加・編集 | ○ | △ | × |
| 社員削除 | ○ | × | × |
| SF/SPI閲覧 | ○ | ○ | × |
| SF/SPI入力 | ○ | ○ | × |
| 評価閲覧（全員） | ○ | × | × |
| 評価閲覧（自チーム） | ○ | ○ | × |
| 評価作成・編集 | ○ | ○ | × |
| チーム管理 | ○ | △ | × |
| AI相談 | ○ | ○ | ○ |
| AIプロフィール生成 | ○ | ○ | × |
| 一括再生成 | ○ | × | × |
| システム統計 | ○ | × | × |

△: 自チームに限定

---

## 5. ミドルウェア

### リクエスト処理パイプライン

```
リクエスト
  → requestIdMiddleware (UUID付与、X-Request-Id ヘッダー)
  → secureHeaders (X-Frame-Options, X-Content-Type-Options, HSTS, CSP)
  → corsMiddleware (オリジン検証、メソッド制限)
  → rateLimitMiddleware (レート制限)
  → authMiddleware (セッション抽出、ユーザーコンテキスト設定)
  → requireAuth / requireRole (権限チェック)
  → ルートハンドラ
```

### レート制限

| 対象 | 制限 |
|------|------|
| 一般エンドポイント | 100リクエスト/分 |
| 認証エンドポイント | 10リクエスト/分 |

※ インメモリ実装（IPアドレスベース）

### セキュリティヘッダー

| ヘッダー | 値 |
|----------|-----|
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Strict-Transport-Security | max-age=31536000; includeSubDomains |
| Content-Security-Policy | default-src 'self' |

---

## 6. AI統合

### 使用モデル

- **実行モデル**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **スキーマデフォルト値**: `claude-3-opus` <!-- TODO(未完了): スキーマのデフォルト値を実際の使用モデルに合わせて更新が必要 -->

### 機能

| 機能 | エンドポイント | レスポンス形式 |
|------|---------------|---------------|
| AI相談 | POST `/api/ai/consultation` | Server-Sent Events (SSE) |
| AIプロフィール生成 | POST `/api/ai/profiles/:id/generate` | JSON |
| チーム分析生成 | POST `/api/ai/teams/:id/analyze` | JSON |

### プロンプトインジェクション対策

- ユーザーデータのサニタイズ（Markdownエスケープ）
- システムプロンプトでのロール変更拒否指示
- コンテキストデータの整形・制限

---

## 7. フロントエンド構成

### ルーティング

| パス | ビュー | 認証 | 管理者 |
|------|--------|------|--------|
| `/login` | LoginView | 不要 | - |
| `/` | DashboardView | 必要 | - |
| `/employees` | EmployeeListView | 必要 | - |
| `/employees/:id` | EmployeeDetailView | 必要 | - |
| `/teams` | TeamListView | 必要 | - |
| `/teams/:id` | TeamDetailView | 必要 | - |
| `/analysis/strengths` | StrengthsAnalysisView | 必要 | - |
| `/analysis/spi` | SpiAnalysisView | 必要 | - |
| `/ai-consultation` | AiConsultationView | 必要 | - |
| `/admin/employees` | AdminEmployeesView | 必要 | 必要 |
| `/admin/strengths` | AdminStrengthsView | 必要 | 必要 |
| `/admin/spi` | AdminSpiView | 必要 | 必要 |
| `/admin/evaluations` | AdminEvaluationsView | 必要 | 必要 |
| `/admin/teams` | AdminTeamsView | 必要 | 必要 |
| `/admin/ai-regenerate` | AdminAiRegenerateView | 必要 | 必要 |

### Composables

| Composable | 主な機能 |
|-----------|----------|
| `useAuth` | 認証状態、ログイン/ログアウト、権限判定 |
| `useEmployee` | 社員CRUD、フィルタ、ページネーション |
| `useTeam` | チームCRUD、AI分析 |
| `usePermission` | 各操作の権限チェック |

### 状態管理 (Pinia)

| ストア | 管理対象 |
|--------|----------|
| auth | ユーザー認証情報、セッション、ロール |
| app | アプリケーション全体の状態 |

---

## 8. CI/CD

### CI (`.github/workflows/ci.yml`)

- **トリガー**: push/PR to main
- **Node**: 22
- **ジョブ**:
  1. lint-and-typecheck: 型ビルド → リント
  2. build: 全パッケージビルド

### デプロイ (`.github/workflows/deploy-server.yml`)

- **トリガー**: main へのpush（server/ または shared/ の変更時）
- **対象**: Google Cloud Run (asia-northeast1)
- **方式**: Docker ビルド → Artifact Registry → Cloud Run デプロイ
- **認証**: Workload Identity Federation

### フロントエンドデプロイ

Vercel による自動デプロイ（`vercel.json` 設定）
- ビルド: `pnpm --filter @talent/types build && pnpm --filter @talent/client build`
- 出力: `client/dist`
- APIリライト: `/api/*` → Cloud Run サービスへプロキシ

---

## 9. 環境変数

### 必須

| 変数名 | 用途 | 設定先 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL接続文字列 (Neon) | サーバー |
| `ANTHROPIC_API_KEY` | Claude API キー | サーバー |
| `BETTER_AUTH_SECRET` | セッション暗号化キー | サーバー |
| `CORS_ORIGIN` | 許可するフロントエンドオリジン | サーバー |
| `VITE_API_BASE_URL` | APIベースURL (例: http://localhost:8080) | クライアント |

### オプション

| 変数名 | 用途 | デフォルト |
|--------|------|-----------|
| `NODE_ENV` | 実行環境 | development |
| `PORT` | サーバーポート | 8080 |

---

## 未実装・計画中の機能

以下の機能はドキュメントに記載されていますが、現時点では未実装です。

| 機能 | ステータス | 備考 |
|------|-----------|------|
| SSO (SAML 2.0 / OIDC) | 計画中 | 05_SECURITY.md に記載 |
| 二要素認証 (2FA) | 計画中 | 05_SECURITY.md に記載 |
| マジックリンク認証 | 計画中 | 05_SECURITY.md に記載 |
| データエクスポート (CSV/Excel/PDF) | 計画中 | 04_ADMIN_GUIDE に記載 |
| 1on1管理画面 | 計画中 | スキーマは存在するがUI未実装 |
| 経歴管理画面 | 計画中 | スキーマは存在するがUI未実装 |
| SOC 2 Type II 認証取得 | 計画中 | - |
| ISO 27001 認証取得 | 計画中 | - |
| プライバシーマーク取得 | 計画中 | - |
| 利用規約の会社名・連絡先 | 未記入 | 06_TERMS_OF_SERVICE.md にプレースホルダー |
| プライバシーポリシーの会社名・連絡先 | 未記入 | 07_PRIVACY_POLICY.md にプレースホルダー |

---

*© 2025 TalentSync. All rights reserved.*
