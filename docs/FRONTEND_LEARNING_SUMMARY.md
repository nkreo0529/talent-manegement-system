# Frontend 学習まとめ

このメモは、このプロジェクトのフロントエンドを読む中で整理した内容をまとめたものです。

対象は主に以下です。

- Vue Router の流れ
- guard の考え方
- `state` とは何か
- `composables` の役割
- Pinia store の役割
- `useEmployee` と `app.ts` の違い

---

## 1. 全体の流れ

このプロジェクトのフロントエンドは、大きく見ると次の順で動きます。

1. `main.ts` で Vue アプリを作る
2. `app.use(createPinia())` で Pinia を登録する
3. `app.use(router)` で Router を登録する
4. `App.vue` の `<RouterView />` に現在の画面が表示される
5. 画面コンポーネントの中で composable や store を使ってデータ取得や表示制御をする

イメージ:

```text
main.ts
-> Pinia 登録
-> Router 登録
-> App.vue
-> RouterView
-> 各画面コンポーネント
```

---

## 2. Router の考え方

`client/src/router/index.ts` には、画面遷移のルールが書かれています。

例:

```ts
{
  path: '/employees/:id',
  name: 'employee-detail',
  component: () => import('@/views/employees/EmployeeDetailView.vue'),
  meta: { requiresAuth: true },
}
```

### 各項目の意味

- `path`: URL パターン
- `name`: route の識別名
- `component`: 表示する画面
- `meta`: guard が読むための補足情報

### `params` とは

`/employees/:id` の `:id` は動的パラメータです。

たとえば `/employees/emp-12` に来たら、

```ts
route.params.id === 'emp-12'
```

となります。

---

## 3. `router.push()` の役割

`router.push()` は、

"この場所へ遷移したい" と Router に依頼する

メソッドです。

例:

```ts
router.push(`/employees/${id}`)
```

これを呼ぶと Router が内部で次の流れを実行します。

1. 遷移先 URL を解釈する
2. `routes` に照合する
3. 一致する route record を見つける
4. guard を実行する
5. 問題なければ対象 component を表示する

つまり、

```text
router.push('/employees/emp-12')
-> Router に遷移依頼
-> '/employees/:id' にマッチ
-> beforeEach
-> EmployeeDetailView を表示
```

です。

重要なのは、

- `push()` は遷移処理を始める
- matching は Router が行う

ということです。

---

## 4. `routes` と `to / from` の違い

### `routes`

最初に定義しておく静的な設定です。

### `to` / `from`

実際に遷移するときに作られる実行時の情報です。

- `to`: 今から行くページ
- `from`: 今いるページ

たとえば `/employees` から `/employees/emp-12` に移動すると、イメージ上はこうなります。

```ts
to.path      // '/employees/emp-12'
to.name      // 'employee-detail'
to.params    // { id: 'emp-12' }
to.meta      // { requiresAuth: true }
to.fullPath  // '/employees/emp-12'

from.path    // '/employees'
from.name    // 'employees'
```

---

## 5. guard とは何か

guard は、

"画面遷移の直前に入るチェックポイント"

です。

このプロジェクトでは global guard として `router.beforeEach()` を使っています。

```ts
router.beforeEach(async (to, _from, next) => {
```

### guard でできること

- 通す: `next()`
- 止める: `next(false)`
- 別ページへ飛ばす: `next({ name: 'login' })`

### このプロジェクトでやっていること

- 未ログインならログイン画面へ送る
- admin でないなら管理画面に入れない
- すでにログイン済みなのに `/login` へ来たらダッシュボードへ戻す

---

## 6. `beforeEach(to, from, next)` の読み方

### `to`

今から行く route の情報です。

### `from`

今いる route の情報です。

このコードでは使っていないので `_from` と書いています。

### `next`

遷移をどうするか決める関数です。

- `next()`: そのまま進む
- `next(false)`: 中止する
- `next({ ... })`: 別ページにリダイレクトする

---

## 7. `requiresAuth !== false` の意味

```ts
const requiresAuth = to.meta.requiresAuth !== false
```

これは、

"`requiresAuth` が明示的に `false` でない限り、認証必須"

という意味です。

結果:

```ts
true      -> true
false     -> false
undefined -> true
```

つまり、

- 基本は全部ログイン必須
- ログイン不要のページだけ `false` を付ける

という設計です。

安全寄りの考え方です。

---

## 8. `requiresAdmin === true` の意味

```ts
const requiresAdmin = to.meta.requiresAdmin === true
```

これは、

"`requiresAdmin` が明示的に `true` のページだけ admin 制限をかける"

という意味です。

結果:

```ts
true      -> true
false     -> false
undefined -> false
```

つまり、

- 基本は admin 不要
- 管理画面だけ特別に admin 必須

という設計です。

---

## 9. `next({ name: 'dashboard' })` の意味

これは、

"今行こうとしているページへの遷移をやめて、`dashboard` route に行き直す"

という意味です。

つまり、元の遷移をそのまま進めるのではなく、別 route へ差し替えています。

---

## 10. `next({ name: 'login', query: { redirect: to.fullPath } })` の意味

これは、

"login へ飛ばす。そのとき、元の行き先をクエリストリングで渡しておく"

という意味です。

たとえば未ログインで `/employees/emp-12` に行こうとしたら、最終的にはこうなります。

```text
/login?redirect=/employees/emp-12
```

この `?redirect=...` がクエリストリングです。

ログイン成功後に `route.query.redirect` を読めば、元のページへ戻せます。

---

## 11. `params` と `query` の違い

### `params`

URL の path に含まれる値です。

例:

```text
/employees/emp-12
```

この `emp-12` が `params.id` です。

### `query`

URL の `?` 以降に付く補足情報です。

例:

```text
/login?redirect=/employees/emp-12
```

この `redirect` が `query.redirect` です。

### 考え方

- `params`: そのページを特定するための値
- `query`: 補足オプションや一時的な情報

---

## 12. `state` とは何か

`state` は、

"いまの状態を表す値"

です。

たとえば次のようなものが state です。

- 社員一覧の取得結果
- 現在表示している社員
- ローディング中かどうか
- エラーメッセージ
- ダークモードかどうか
- サイドバーが開いているか

例:

```ts
const employees = ref<Employee[]>([])
const currentEmployee = ref<EmployeeWithDetails | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)
```

画面はこの state を見て表示を変えます。

---

## 13. composable の役割

`composables` は、

"Vue Composition API の再利用可能なロジックを置く場所"

です。

このプロジェクトでは例えば以下があります。

- `useEmployee`
- `useTeam`
- `useAuth`
- `usePermission`

### `useEmployee` は何をしているか

- 社員関連の state を持つ
- 社員一覧取得を行う
- 社員詳細取得を行う
- 更新処理を持つ
- デモモード分岐を持つ

つまり、

"社員に関するフロント側ロジックのまとまり"

です。

### API を書く場所なのか

厳密には、

- API そのものを定義する場所、ではない
- API を使って画面向けロジックをまとめる場所

と考えると分かりやすいです。

このプロジェクトでは `useEmployee.ts` の中に Supabase 呼び出しがあるので、API 呼び出しも composable に含まれています。
ただし役割としては "社員機能のロジック" です。

---

## 14. `fetchEmployeeById()` を composable に置く意味

`fetchEmployeeById()` は、本来なら `EmployeeDetailView.vue` に直接書くこともできます。

ただしそれをやると、画面に以下が全部入ってしまいます。

- データ取得
- `loading` 管理
- `error` 管理
- デモモード分岐
- Supabase 呼び出し

そこでこのプロジェクトでは `useEmployee.ts` に切り出して、

- View は「いつ取得するか」
- composable は「どう取得するか」

を担当するようにしています。

---

## 15. `useEmployee` は再利用されている

`useEmployee()` は実際に複数画面で使われています。

- `EmployeeListView.vue`
- `EmployeeDetailView.vue`
- `AdminEmployeesView.vue`

使い方は画面ごとに違います。

- 一覧画面: `employees`, `loading`, `fetchEmployees`
- 詳細画面: `currentEmployee`, `loading`, `error`, `fetchEmployeeById`
- 管理画面: `employees`, `fetchEmployees`

つまり、

"社員ロジックを 1 か所にまとめて、必要なものだけ各画面で使っている"

構成です。

---

## 16. Pinia store の役割

Pinia は、

"アプリ全体で共有したい state を管理するための仕組み"

です。

このプロジェクトでは `client/src/stores/app.ts` が Pinia store の1つです。

```ts
export const useAppStore = defineStore('app', () => {
```

### `app.ts` が持っている state

- `sidebarOpen`
- `darkMode`
- `pageTitle`
- `breadcrumbs`

### 何に使うか

- 各画面が `setPageTitle()` を呼ぶ
- ヘッダーが `pageTitle` や `breadcrumbs` を表示する
- サイドバーやヘッダーが `toggleSidebar()` や `toggleDarkMode()` を使う

つまり、

"アプリ全体の見た目やレイアウトに関する共通 state"

を持つ store です。

---

## 17. composable と store の違い

ざっくり言うと、

- composable = ロジックの再利用
- store = 状態の共有

### `useEmployee`

- 社員データ取得ロジックをまとめる
- 複数画面で再利用する

### `useAppStore`

- ページタイトルやダークモードなどを全体共有する
- どこから呼んでも同じ state を見る

つまり、

- `useEmployee` は機能単位の再利用ロジック
- `app.ts` はアプリ全体の共有状態

です。

---

## 18. 社員一覧 -> 社員詳細の流れ

実際の処理の流れは次のとおりです。

1. 一覧画面で `router.push(\`/employees/${id}\`)`
2. Router が `'/employees/:id'` にマッチさせる
3. guard が走る
4. 問題なければ `EmployeeDetailView` が表示される
5. `EmployeeDetailView` で `route.params.id` を読む
6. `fetchEmployeeById(id)` を呼ぶ
7. composable がデモデータまたは Supabase から取得する
8. `currentEmployee` が更新される
9. 画面が再描画される

イメージ:

```text
EmployeeListView
-> router.push()
-> Router matching
-> guard
-> EmployeeDetailView
-> useEmployee.fetchEmployeeById()
-> state 更新
-> 再描画
```

---

## 19. 最後の整理

- Router は画面遷移のルールを持つ
- `router.push()` は遷移を開始する
- matching は Router が行う
- guard は遷移前のチェックポイント
- `meta` は guard が読む補足情報
- `state` は今の状態を表す値
- composable は再利用可能なロジックのまとまり
- Pinia store は全体で共有する state の置き場所
- `useEmployee` は社員ロジック
- `app.ts` はアプリ共通 UI state

このプロジェクトを読むときは、まず次の分担で見ると理解しやすいです。

- `views/`: 画面
- `composables/`: 画面で使うロジック
- `stores/`: 全体共有 state
- `router/`: 画面遷移ルール
- `lib/`: 接続設定や低レベルの共通処理
