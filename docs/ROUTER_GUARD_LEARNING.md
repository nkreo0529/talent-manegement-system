# Router / Guard 学習メモ

このメモは、`client/src/router/index.ts` を中心に、Vue Router の流れと guard の考え方を整理したものです。

## 1. Router が組み込まれる流れ

1. `main.ts` で `app.use(router)` が呼ばれる
2. `App.vue` の `<RouterView />` が、現在の route に対応する画面の表示先になる
3. `router.push()` や URL 直接アクセス、リロード、戻る/進むが起きる
4. Router が `routes` と URL を照合して、どの route record に一致するか判定する
5. guard が走る
6. 問題なければ対象 component が表示される

## 2. `routes` と実行時の `to` / `from` の違い

`routes` は最初に定義する静的な設定です。

```ts
{
  path: '/employees/:id',
  name: 'employee-detail',
  component: () => import('@/views/employees/EmployeeDetailView.vue'),
  meta: { requiresAuth: true },
}
```

一方で `to` と `from` は、遷移のたびに作られる実行時の情報です。

- `to`: 今から行くページ
- `from`: 今いるページ

たとえば `/employees` から `router.push('/employees/emp-12')` を呼ぶと、イメージ上はこうなります。

```ts
to.path      // '/employees/emp-12'
to.name      // 'employee-detail'
to.params    // { id: 'emp-12' }
to.meta      // { requiresAuth: true }
to.fullPath  // '/employees/emp-12'

from.path    // '/employees'
from.name    // 'employees'
```

## 3. `router.push()` の役割

`router.push()` は route matching そのものをするメソッド、というより、

"この URL / route へ遷移したい" と Router に依頼して、遷移処理を開始するメソッド

です。

その後に Router が内部で次のことを行います。

1. URL を解釈する
2. `routes` に照合する
3. guard を実行する
4. 対象 component を表示する

つまり、

```text
router.push('/employees/emp-12')
-> Router に遷移依頼
-> Router が '/employees/:id' にマッチさせる
-> beforeEach
-> EmployeeDetailView を表示
```

という順です。

## 4. `path`, `name`, `component`, `meta` の意味

### `path`

URL パターンです。

```ts
path: '/employees/:id'
```

この `:id` は動的パラメータで、実行時には `route.params.id` で取り出せます。

### `name`

route の識別名です。

```ts
name: 'employee-detail'
```

これがあると、

```ts
router.push({ name: 'employee-detail', params: { id: 'emp-12' } })
```

のように書けます。

### `component`

その route で表示する画面です。

```ts
component: () => import('@/views/employees/EmployeeDetailView.vue')
```

これは lazy import です。必要になったタイミングでだけ読み込みます。

### `meta`

Router が勝手に認証してくれる設定ではなく、アプリ側が guard で読むための追加情報です。

```ts
meta: { requiresAuth: true }
```

## 5. guard とは何か

guard は、

"画面遷移の直前に入るチェックポイント"

です。

このプロジェクトでは global guard として `router.beforeEach()` を使っています。

```ts
router.beforeEach(async (to, _from, next) => {
```

ここでできることは主に3つです。

- 通す: `next()`
- 止める: `next(false)`
- 別ページへ飛ばす: `next({ name: 'login' })`

## 6. `beforeEach(to, from, next)` の読み方

### `to`

今から行こうとしているページの情報です。

### `from`

今いるページの情報です。

このコードでは使っていないので `_from` と書いてあります。

### `next`

遷移をどうするか決める関数です。

- `next()`: そのまま進む
- `next(false)`: 中止する
- `next({ ... })`: 別 route にリダイレクトする

## 7. `const authStore = useAuthStore()` は何をしているか

これは、

"Pinia の auth ストアを取得する"

処理です。

まだストアがなければ作り、すでにあれば同じインスタンスを返します。

ただし、Supabase の session 取得や社員情報取得まで自動でやるわけではありません。
それは `authStore.initialize()` の役割です。

つまり、

- `useAuthStore()`: ストア取得
- `authStore.initialize()`: 認証状態の初期化

です。

## 8. `requiresAuth !== false` の考え方

```ts
const requiresAuth = to.meta.requiresAuth !== false
```

これは、

"`requiresAuth` が明示的に `false` でない限り、認証必須にする"

という意味です。

結果はこうなります。

```ts
to.meta.requiresAuth     requiresAuth
true                     true
false                    false
undefined                true
```

つまり、

- 基本は全部ログイン必須
- ログイン不要の route だけ `false` を付ける

という安全寄りの設計です。

`/login` だけが `false` になっています。

## 9. `requiresAdmin === true` の考え方

```ts
const requiresAdmin = to.meta.requiresAdmin === true
```

これは、

"`requiresAdmin` が明示的に `true` のページだけ admin 制限をかける"

という意味です。

結果はこうなります。

```ts
to.meta.requiresAdmin    requiresAdmin
true                     true
false                    false
undefined                false
```

つまり、

- 基本は admin 不要
- 管理画面だけ `requiresAdmin: true`

という設計です。

## 10. `next({ name: 'dashboard' })` の意味

これは、

"今の遷移をやめて、`dashboard` route へ行き直す"

という意味です。

実質的には `/` へリダイレクトしています。

流れとしては、

1. あるページへ行こうとする
2. guard で条件に引っかかる
3. `next({ name: 'dashboard' })`
4. 元のページへの遷移は中止
5. `dashboard` への遷移が新しく始まる

です。

## 11. `next({ name: 'login', query: { redirect: to.fullPath } })` の意味

これは、

"login ページへ飛ばす。さらに、ログイン後に戻りたい元の URL をクエリストリングで渡す"

という意味です。

たとえば、未ログインの状態で `/employees/emp-12` に行こうとしたら、

```ts
to.fullPath // '/employees/emp-12'
```

なので最終的な URL はこうなります。

```text
/login?redirect=/employees/emp-12
```

この `?redirect=...` がクエリストリングです。

ログイン成功後に `route.query.redirect` を読めば、元のページへ戻せます。

## 12. `params` と `query` の違い

### `params`

route の `path` に埋め込まれる値です。

```text
/employees/emp-12
```

この `emp-12` は `params.id` です。

### `query`

URL の `?` より後ろに付く補足情報です。

```text
/login?redirect=/employees/emp-12
```

この `redirect` は `query.redirect` です。

ざっくり言うと、

- `params`: そのページを特定するのに必要な値
- `query`: 補足オプションや一時的な情報

です。

## 13. 社員一覧 -> 社員詳細の実際の流れ

1. 社員一覧で `router.push(\`/employees/${id}\`)`
2. Router が `'/employees/:id'` にマッチ
3. `beforeEach` が走る
4. 認証条件を満たせば `EmployeeDetailView.vue` が表示される
5. 画面側で `useRoute()` から `route.params.id` を取る
6. `fetchEmployeeById(id)` が呼ばれる
7. デモモードならローカルデータ、本番なら Supabase から社員詳細を取得する

つまり、

```text
router.push()
-> route matching
-> guard
-> component 表示
-> component 内で params を使ってデータ取得
```

という順です。

## 14. まとめ

- `routes` は静的設定、`to` / `from` は実行時の遷移情報
- `router.push()` は遷移処理を開始する
- matching は Router が行う
- `meta` は guard が読むための自前情報
- guard は画面遷移前のチェックポイント
- `requiresAuth !== false` は "基本ログイン必須"
- `requiresAdmin === true` は "admin ページだけ特別扱い"
- `next()` は通す、`next(false)` は止める、`next({ ... })` はリダイレクト
- `query` はクエリストリングで、ログイン後リダイレクトのような補足情報を渡すのに使う
