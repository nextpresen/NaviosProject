# Progress

最終更新: 2026-03-09（不要ファイル整理完了）

## 全体進捗

- 基盤整理: ✅ 完了
- ディレクトリ再編: ✅ 完了
- ドキュメント集約: ✅ 完了
- **Phase 1 UI実装（mock移植）: ✅ 完了**
- **Expo Router本実装: ✅ 完了**
- **Supabase Auth 接続: ✅ 完了**（ログイン・ログアウト・認証ガード）
- **hooks/useLocation.ts 実装: ✅ 完了**（expo-location、権限要求・GPS取得）
- **hooks/usePosts.ts + Supabase API 接続: ✅ 完了**（PostGIS RPC + JOIN クエリ）
- **lib/mockData.ts 依存の段階移行: ✅ 完了**（全画面でフックに切り替え済み）
- **投稿作成 → Supabase DB insert + Storage 画像アップロード: ✅ 完了**
- **不要ファイル整理: ✅ 完了**（死コード削除・外部残骸削除）
- MapLibre GL 実地図表示: ⬜ 未着手

---

## 完了したこと

### 不要ファイル整理（2026-03-09）

#### 削除したファイル・ディレクトリ

| ファイル | 理由 |
| --- | --- |
| `App.tsx` | Expo Router 移行済みで死コード（`package.json` の `main` は `expo-router/entry`） |
| `index.ts` | `App.tsx` を登録するだけの旧エントリポイント |
| `components/common/BottomTabBar.tsx` | `App.tsx` からのみ参照されていた死コード（タブナビは `app/(tabs)/_layout.tsx` に移行済み） |
| `components/map/` | 空フォルダ |
| `dev/node_modules/`・`dev/package.json`・`dev/package-lock.json` | `dev/` 直下で誤って `npm install` した残骸 |

### 投稿作成 Supabase 連携（2026-03-09）

#### lib/postsApi.ts（投稿作成関数を追加）

- `calcExpiresAt(form)`: カテゴリ別に `expires_at` を計算
  - `stock`: stockDuration に応じて今日中 / 2日 / 3日 / 7日後（`manual` は null）
  - `event`: 開催日の 23:59:59+09:00
  - `help`: 48時間後
  - `admin`: deadline の 23:59:59+09:00
- `uploadPostImages(localUris)`: ローカル URI → `fetch` → blob → Supabase Storage `post-images` バケットへアップロード → 公開 URL を返す
- `createPost(form, authorId)`: 以下の順で INSERT
  1. `places` テーブル（`form.place.id` がなければ新規 insert、`source: 'user'`）
  2. `posts` テーブル（PostGIS の `location` カラムに `SRID=4326;POINT(lng lat)` 形式で保存）
  3. `post_details` テーブル（カテゴリ別フィールドをすべて保存）
  4. 画像があれば Storage アップロード → `post_images` テーブルに display_order 付きで保存

#### app/post/create.tsx（handleSubmit 実装・カメラ/ギャラリー接続）

- `handleCamera()`: カメラ権限取得 → `launchCameraAsync` → `form.images` に URI 追加
- `handleGallery()`: ライブラリ権限取得 → `launchImageLibraryAsync`（最大4枚、複数選択対応）
- 画像プレビュー UI: 選択済み画像をサムネイル（72×72）表示＋×ボタンで個別削除
- `handleSubmit()`:
  1. タイトルバリデーション
  2. `supabase.auth.getUser()` で認証確認
  3. `createPost(form, user.id)` を呼び出し
  4. 成功 → Alert → フォームリセット → `router.back()`
  5. 失敗 → Alert にエラーメッセージ表示
- 投稿ボタン: `isSubmitting` 中はスピナー表示 + タップ無効化（二重送信防止）

#### Supabase Storage セットアップ（要確認）

- バケット名: `post-images`（Supabase ダッシュボードで作成・公開設定が必要）

### Supabase 投稿データ連携（2026-03-09）

#### lib/postsApi.ts（新規作成）
- `DbPost` / `DbAuthor` / `DbPlace` / `DbPostDetails`：DB レスポンス型（snake_case）を定義
- 共有 `POST_SELECT` 定数：JOINクエリ文字列（author, place, post_details, post_images, comments）
- `mapDbDetails(d)`: snake_case → camelCase 変換（PostDetails 型へ）
- `mapDbPostToPost(dbPost, distanceMeters)`: DB レコード → フロントエンドの `Post` 型へ変換
  - null値のフォールバック、画像の display_order ソート、comment_count 集計抽出
  - `formatRelativeTime()` で `created_at` → 表示用相対時間文字列
- `fetchNearbyPosts(lat, lng, radiusMeters)`: 2ステップ取得
  1. `get_nearby_posts` RPC で投稿 ID + 距離を取得
  2. `.from('posts').select(...).in('id', ids)` で詳細データを JOIN 取得
  3. 距離順ソートして返す
- `fetchPostById(id)`: 単一投稿を UUID で取得

#### lib/utils.ts
- `formatRelativeTime(isoString)` 追加：ISO 文字列 → 「30分前」「2時間前」「3日前」等の表示文字列

#### hooks/usePosts.ts（Supabase 連携に書き換え）
- `coords` が null/未指定 → モックデータを即時返す
- `coords` 指定時 → `fetchNearbyPosts(lat, lng, 1000)` を呼び出し
- エラー時 → `MOCK_POSTS` にフォールバック

#### hooks/usePost.ts（新規作成）
- `fetchPostById(id)` で単一投稿を非同期取得
- エラー時 → `MOCK_POSTS.find(p => p.id === id)` にフォールバック

#### 全画面の mockData 依存を解消
- `app/(tabs)/index.tsx`: `MOCK_POSTS` 直接参照 → `usePosts()` に変更
- `app/(tabs)/nearby.tsx`: `MOCK_POSTS` 直接参照 → `useLocation()` + `usePosts(coords)` に変更
- `app/(tabs)/search.tsx`: `MOCK_POSTS` 直接参照 → `usePosts()` に変更
- `app/post/[id].tsx`: `MOCK_POSTS.find()` → `usePost(id)` に変更（非同期ロード対応、likeCount の useEffect 同期追加）
- `app/post/create.tsx`: `useLocation()` の現在地をフォームの場所入力に接続（「現在地を使用」ボタン実装）

### Supabase Auth 接続（2026-03-09）
- `.env` 作成（EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY）
- `.gitignore` に `.env` 追加（キー漏洩防止）
- `lib/auth.ts`: signIn / signUp（displayName付き）/ signOut 実装
- `hooks/useAuth.ts`: セッション管理・onAuthStateChange 購読
- `app/_layout.tsx`: AuthGuard 追加（未ログイン→ログイン画面、ログイン済み→タブ画面）
- `app/auth/login.tsx`: Supabase signIn 接続・ローディング状態・エラーAlert
- `app/auth/register.tsx`: Supabase signUp 接続・確認メール送信フロー
- `app/(tabs)/profile.tsx`: ログアウトボタン → signOut + ログイン画面へリダイレクト
- 動作確認: ログイン・セッション維持・ログアウト すべて正常

### 開発環境確認（2026-03-09）
- WSL + Androidエミュレーター: `--tunnel` モードで動作確認
- GitHub push 完了（nextpresen/NaviosProject 02-Mobile）

### 基盤・構成（2026-03-08）
- mobile/ の既存実装をベースに NaviOs/ → Mobile/ として再配置
- CLAUDE.md・mock.jsx を Mobile/ 直下に移動
- 予定構成に沿って画面を再配置
- App.tsx の import を新構成へ更新
- GitHub (nextpresen/NaviosProject) へプッシュ

### Phase 1 UI実装（2026-03-09）

#### アイコン・コンポーネント修正
- Pulse 検索ボタン: `sparkles` → `search`
- 近助カテゴリアイコン: `people-outline` → `hand-left-outline`
- CategoryFilter: 各チップにカテゴリアイコン追加
- PostCard: カテゴリドット → アイコン付き角丸ボックス
- PostListItem: カテゴリアイコン追加

#### Nearby 画面 (app/(tabs)/nearby.tsx)
- ボトムシートアニメーション: translateY + useNativeDriver: true (300ms)
- 現在地マーカー: 青いパルスアニメーション (scale + opacity ループ)
- 地図ピン: カテゴリ別カラー + アイコン + 緊急バッジ + 選択状態
- ボトムシート overflow: hidden 削除 → 横スクロール正常動作

#### 投稿詳細 (app/post/[id].tsx)
- エンゲージメント行追加（いいね / コメント数 / シェア）
- いいねボタン: ハートアニメーション (scale 1→1.4→1)、カウントトグル
- シェアボタン: Share.share() によるOSネイティブシェート

#### 残り時間表示 (lib/utils.ts + PostCard + PostListItem)
- `getExpiryLabel(post)` 追加（カテゴリ別: 今日中/残り48h/イベント日時/〆日など）
- PostCard: タイトル下にアイコン + カテゴリカラーラベル
- PostListItem: メタ行末尾にアイコン + カテゴリカラーラベル

#### 検索画面 (app/(tabs)/search.tsx)
- query state + クリアボタン（×）
- 検索中: calcMatchScore でフィルタリング → PostListItem でスコア付き表示
- 非検索時: トレンド / 過去の盛り上がり / カテゴリグリッド（変わらず）
- TrendItem / PastHotItem: TouchableOpacity でラップ → 詳細遷移

#### 認証画面 UI
- app/auth/login.tsx: NaviOs ロゴ + メール/パスワード + パスワード表示切替 + ログインボタン
- app/auth/register.tsx: 表示名/メール/パスワード + バリデーション + 利用規約表示

#### 型・データ更新
- types/index.ts: Post に `likeCount?: number` 追加
- lib/mockData.ts: 全8投稿に likeCount 設定

### Expo Router 移行（2026-03-09）
- `package.json` `main` を `"expo-router/entry"` に変更、`expo-router: ~5.0.0` 追加
- `app.json` に `scheme: "navios"`, `plugins: ["expo-router"]`, `web.bundler: "metro"` 追加
- `app/_layout.tsx` 新規作成（SafeAreaProvider + StatusBar + Stack）
- `app/(tabs)/_layout.tsx` 新規作成（カスタムタブバー + 中央投稿ボタン）
- 全画面から Props 型・ナビゲーションコールバックを削除し `useRouter()` に置換
  - `app/(tabs)/index.tsx`: `onPostPress` → `router.push('/post/${post.id}')`
  - `app/(tabs)/nearby.tsx`: `onPostPress` → `router.push()` + `useLocalSearchParams()` でカテゴリ受け取り
  - `app/(tabs)/search.tsx`: `onPostPress`/`onCategorySelect` → `router.push()`
  - `app/post/[id].tsx`: `post: Post` + `onBack` → `useLocalSearchParams()` + `MOCK_POSTS` lookup
  - `app/post/create.tsx`: `onClose` → `router.back()`
  - `app/auth/login.tsx`: `onGoRegister`/`onLoginSuccess` → `router.push()`/`router.replace()`
  - `app/auth/register.tsx`: `onGoLogin`/`onRegisterSuccess` → `router.back()`/`router.replace()`
- `App.tsx` / `index.ts` / `BottomTabBar.tsx` は死コード → 後日削除済み

---

## 残タスク（Phase 2）

### 高優先

- **MapLibre GL による実地図表示**（`@maplibre/maplibre-react-native` 未インストール）
  - `EXPO_PUBLIC_MAPTILER_KEY` 未設定
  - 現在は `nearby.tsx` 内のプレースホルダー表示

### 低優先
- プッシュ通知
- Claude API 連携 Pulse 検索
- テスト・Lint・型チェック導入
- 管理画面（Supabaseダッシュボードで代替予定）

## 残タスク（Phase 3 以降）

- Cloudflare Workers（キャッシュ・レート制限）← ユーザー数増加後に検討
