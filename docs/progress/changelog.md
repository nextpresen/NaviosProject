# Changelog

最終更新: 2026-03-10

## 2026-03-10 — MapLibre 依存削除・地図実装リセット

### 背景

`@maplibre/maplibre-react-native` をインストール済みだったが、ネイティブモジュールエラーが発生。
根本原因は「ネイティブビルド（android/）が maplibre インストール前に生成されていたため、
ネイティブコードに maplibre が組み込まれていなかった」こと。

本来の解決策は `expo prebuild --clean` → `expo run:android` の再ビルドだが、
地図実装方式（maplibre / react-native-maps / WebView 等）を改めて検討する方針のため、
一旦すべての maplibre 依存を削除してクリーンな状態に戻した。

### 変更内容

#### app.json
- `plugins` から `"@maplibre/maplibre-react-native"` を削除

#### package.json
- `dependencies` から `"@maplibre/maplibre-react-native": "^10.4.2"` を削除

#### app/(tabs)/nearby.tsx
- `MapLibreModule` 型定義を削除
- `require('@maplibre/maplibre-react-native')` の try/catch ブロックを削除
- `MAPTILER_KEY` / `MAP_STYLE` / `DEFAULT_CENTER` 定数を削除
- `MLNMapView` / `MLNCamera` / `MLNUserLocation` / `MLNPointAnnotation` の参照をすべて削除
- 地図エリアをプレースホルダー（`<View style={styles.mapPlaceholder}>`）のみに統一

#### node_modules（手動作業が必要）
- `npm uninstall @maplibre/maplibre-react-native` を実行して node_modules から除去すること

### 現在の nearby.tsx 地図エリアの状態
- プレースホルダー表示（緑背景 + "Map Placeholder" テキスト + 現在地ピンアニメーション + 投稿ピン）
- 実際の地図は表示されない（次回実装時に差し替え予定）

### 次の地図実装時の方針（未決定）

以下のいずれかを選択して再実装する:

| 選択肢 | 特徴 | 注意点 |
|---|---|---|
| `@maplibre/maplibre-react-native` 再導入 | MapTiler 連携・OSS | `expo prebuild --clean` + ネイティブ再ビルド必須 |
| `react-native-maps` | Expo 標準に近い | Google Maps API が必要（コスト発生の可能性） |
| WebView + Leaflet.js | ネイティブビルド不要 | パフォーマンスはやや劣る |

---

## 2026-03-09 — Supabase DB・RLS・Storage 構築 + 投稿作成動作確認

### Supabase テーブル作成
- 拡張機能: `uuid-ossp` / `postgis` / `pg_trgm` を有効化
- テーブル: `users` / `places` / `posts` / `post_details` / `post_images` / `comments` を作成
- `places` に `update_place_location` トリガー（latitude/longitude → geography 自動変換）
- `get_nearby_posts` RPC 関数を作成（PostGIS ST_DWithin による半径フィルタ + ST_Distance 距離計算）
- 伊集院エリアの初期スポット4件を挿入

### RLS ポリシー設定
- 全テーブルで `ENABLE ROW LEVEL SECURITY`
- SELECT: 全テーブル全員公開（postsは is_ended=FALSE かつ未期限のみ）
- INSERT/UPDATE: 本人または親投稿の author_id と一致する場合のみ許可

### Supabase Storage 設定
- `post-images` バケット作成（Public、5MB制限、画像MIMEのみ許可）

### Auth → users 自動同期トリガー
- `on_auth_user_created` トリガー設定（`auth.users` INSERT → `public.users` 自動INSERT）
- トリガー設定前の既存ユーザーは手動SQLで `public.users` に挿入

### バグ修正

#### app/post/create.tsx
- `handleSubmit` のエラーハンドリングを改善（Supabase PostgrestError の `.message` を表示）
- 場所未設定時に GPS 座標を自動セットする処理を追加
  - `form.place` なし + `coords` あり → `現在地付近` として自動セット
  - `form.place` なし + `coords` なし → バリデーションエラー

#### app/post/[id].tsx
- `useEffect` が import に含まれていなかった問題を修正
- `useRef(new Animated.Value(1))` が early return の後に呼ばれていた Hooks ルール違反を修正

#### hooks/useLocation.ts
- GPS 取得失敗時に `__DEV__` のみ伊集院町座標（31.6234, 130.3856）をフォールバックとして返す処理を追加

### 動作確認
- 投稿作成 → Supabase DB insert + Storage 画像アップロード ✅
- 投稿一覧に表示 ✅
- 投稿詳細画面表示 ✅

---

## 2026-03-09 — Supabase Auth 接続

### 環境設定
- `.env` 新規作成（EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY / EXPO_PUBLIC_MAPTILER_KEY）
- `.gitignore` に `.env` 追加（シークレット漏洩防止）
- `@supabase/supabase-js` インストール（`npm install --legacy-peer-deps`）

### lib/auth.ts
- `signIn(email, password)`: `supabase.auth.signInWithPassword` でログイン
- `signUp(email, password, displayName)`: `supabase.auth.signUp` + `options.data.display_name` でユーザーメタデータ保存
- `signOut()`: セッション破棄

### hooks/useAuth.ts
- `supabase.auth.getSession()` で初期セッション取得
- `supabase.auth.onAuthStateChange` でセッション変化を購読
- `{ session, loading, user }` を返す

### app/_layout.tsx — AuthGuard 追加
- `useAuth()` + `useSegments()` でセッション状態を監視
- 未ログイン かつ auth グループ外 → `/auth/login` へリダイレクト
- ログイン済み かつ auth グループ内 → `/(tabs)` へリダイレクト

### app/auth/login.tsx
- `handleLogin` を async 化、`signIn()` 呼び出し
- エラー時: `Alert.alert` でメッセージ表示
- ローディング中: ボタンを無効化・「処理中...」表示

### app/auth/register.tsx
- `handleRegister` を async 化、`signUp()` 呼び出し
- 成功時: 確認メール送信の案内 Alert → ログイン画面へ
- エラー時: `Alert.alert` でメッセージ表示
- ローディング中: ボタンを無効化・「処理中...」表示

### app/(tabs)/profile.tsx
- `signOut` インポート・`handleLogout` 実装
- ログアウトボタン → `signOut()` + `router.replace('/auth/login')`

### 動作確認
- ログイン（Supabase Authユーザー）→ ホーム画面遷移 ✅
- 未ログイン状態での起動 → ログイン画面自動遷移 ✅
- ログアウト → ログイン画面遷移 ✅
- メール未確認エラー（Email not confirmed）の挙動確認 ✅

---

## 2026-03-09 — Expo Router 完全移行

### 設定ファイル
- `package.json`: `main` を `"expo-router/entry"` に変更、依存に `"expo-router": "~5.0.0"` 追加
- `app.json`: `scheme: "navios"`, `plugins: ["expo-router"]`, `web: { bundler: "metro" }` 追加

### ルートレイアウト新設 (`app/_layout.tsx`)
- `SafeAreaProvider` + `StatusBar` でラップ
- `Stack` に5画面を宣言:
  - `(tabs)`: `headerShown: false`
  - `post/[id]`: `slide_from_right` アニメーション
  - `post/create`: `modal` プレゼンテーション
  - `auth/login` / `auth/register`: `headerShown: false`

### タブレイアウト新設 (`app/(tabs)/_layout.tsx`)
- カスタム `tabBar` でボトムタブバーを描画
  - 左2タブ（Pulse・近く）/ 中央投稿ボタン / 右2タブ（検索・マイページ）の5分割
  - 中央ボタン: `router.push('/post/create')`
  - `TAB_ITEMS` 定数 + `TabButton` コンポーネントで管理

### 全画面: ナビゲーション Props 削除 → `useRouter()` 置換
- `app/(tabs)/index.tsx`: `onPostPress` prop を削除、`router.push('/post/${post.id}')`
- `app/(tabs)/nearby.tsx`: `onPostPress` 削除、`useLocalSearchParams()` でカテゴリ初期値受け取り
- `app/(tabs)/search.tsx`: `onPostPress`/`onCategorySelect` 削除、`router.push()` に統一
- `app/post/[id].tsx`: `post: Post`/`onBack` 削除 → `useLocalSearchParams({ id })` + `MOCK_POSTS.find()`
- `app/post/create.tsx`: `onClose` 削除 → `router.back()`
- `app/auth/login.tsx`: `onGoRegister`/`onLoginSuccess` → `router.push('/auth/register')` / `router.replace('/(tabs)')`
- `app/auth/register.tsx`: `onGoLogin`/`onRegisterSuccess` → `router.back()` / `router.replace('/(tabs)')`

### 不要になったファイル
- `App.tsx`: 画面ルーティングの中央管理が不要に（削除可）
- `BottomTabBar.tsx`: `_layout.tsx` 内の `CustomTabBar` に統合（削除可）

### 次回起動前に必要な作業
```bash
cd Mobile
npx expo install expo-router
```

---

## 2026-03-09 — Phase 1 UI 完成

### アイコン・UI修正
- Pulse 検索ボタン: `sparkles` → `search`（mock.jsx 準拠）
- 近助カテゴリアイコン: `people-outline` → `hand-left-outline`
- CategoryFilter: 各チップにカテゴリアイコン追加（getCategoryIconName 使用）
- PostCard: カテゴリドット → アイコン付き角丸ボックス（categoryIconBox）
- PostListItem: カテゴリアイコン追加

### Nearby 画面 UI改善
- ボトムシートアニメーション: height → translateY（useNativeDriver: true）に変更
  - SHEET_TRANSLATE 定数 (closed / half / full) で translateY 値を管理
  - animateSheet() ヘルパー関数で状態遷移を統一
- 現在地マーカー: 青いパルスアニメーション追加
  - pingScale (1→2.4) + pingOpacity (0.7→0) のループ
  - locationDot（32×32 青丸 + navigate アイコン）
- 地図ピン: カテゴリ別カラー・アイコン・緊急バッジ・選択状態の太ボーダー
- overflow: hidden 削除 → 横スクロール ScrollView が正常動作

### 投稿残り時間表示
- lib/utils.ts: getExpiryLabel(post: Post): string | null 追加
  - stock: stockDuration に応じたラベル（今日中 / 残り48h / 残り3日 / 残り1週間 / 手動終了）
  - event: eventDate + eventTime を結合
  - help: 残り48h（固定）
  - admin: 〆 + deadline
- PostCard: タイトル下に time-outline アイコン + カテゴリカラーラベル
- PostListItem: メタ行末尾に · time-outline アイコン + カテゴリカラーラベル

### 投稿詳細 いいね・シェアボタン
- app/post/[id].tsx にエンゲージメント行を追加（著者行と場所カードの間）
  - いいね: heart / heart-outline アイコン + カウント + scale アニメーション (1→1.4→1)
  - コメント数: 表示のみ
  - シェア: Share.share() でOSネイティブシェートを呼び出し
- ヘッダーの share-social-outline ボタンも handleShare に接続
- types/index.ts: Post に likeCount?: number 追加
- lib/mockData.ts: 全8投稿に likeCount 設定

### 検索画面 キーワード検索
- app/(tabs)/search.tsx 全面書き換え
  - query state + クリアボタン（×）付き検索入力
  - isSearching フラグで表示を切り替え
  - calcMatchScore で全 MOCK_POSTS をスコアリング → 降順ソート → PostListItem 表示
  - TrendItem / PastHotItem: TouchableOpacity でラップ → handleTrendPress でカテゴリ一致投稿の詳細へ
- App.tsx: SearchScreen に onPostPress を追加

### 認証画面 UI実装
- app/auth/login.tsx: フル実装
  - NaviOs ロゴ（緑丸 + location アイコン）+ タイトル + タグライン
  - メールアドレス・パスワード入力（パスワード表示切替）
  - パスワードを忘れた場合リンク
  - ログインボタン（プライマリカラー・シャドウ）
  - 新規登録へのリンク
- app/auth/register.tsx: フル実装
  - 表示名・メールアドレス・パスワード（8文字バリデーション + リアルタイムヒント）
  - 利用規約・プライバシーポリシー表示
  - アカウント作成ボタン
  - ログインへのリンク

---

## 2026-03-08 Chat 5

### バグ修正
- 投稿ボタン押下で真っ白になる問題を修正
  - App.tsx に `view === 'post'` の条件分岐と `<CreatePostScreen>` のレンダリングを追加
- ✕ボタンで前画面に戻れない問題を修正
  - App.tsx の `<CreatePostScreen onClose={() => setView(activeTab)} />` を接続

### UI実装
- `app/post/create.tsx`: mock.jsx の投稿作成画面をフル実装
  - カテゴリ選択（stock / event / help / admin）
  - カテゴリ別追加フィールド（価格・在庫・日時・参加費・お礼など）
  - 場所セクション・コメントトグル・投稿のコツ
  - バリデーション（タイトル必須）・投稿完了 Alert

### ドキュメント整理
- 重複ファイルを統合・削除
- CLAUDE.md にコーディングルール・ファイル管理ルール追記

### コンポーネント改善
- `BottomTabBar.tsx`: Ionicons アイコン追加、TAB_ITEMS 定数化
- `app/(tabs)/index.tsx`: Pulse 画面のアイコン・アニメーション刷新（usePulseAnimation）

---

## 2026-03-08 Chat 1〜4

- mobile/ → NaviOs/ → Mobile/ としてディレクトリ整備
- CLAUDE.md・mock.jsx を Mobile/ 直下に移動
- 予定構成に沿った画面ファイルの再配置
- GitHub (nextpresen/NaviosProject 01_NaviosProject/NaviosProject/02-Mobile) へプッシュ
- docs/progress/ 作成・progress.md・changelog.md 初版作成

---

## 2026-03-09 — 開発環境セットアップ・動作確認

### 問題解決: エミュレーター青くるくる（接続不可）
- **原因**: WSL上のMetroバンドラーにAndroidエミュレーター（Windows側）から届かない
- **解決**:  を使用（ngrok経由でトンネル）
-  では解決しないことを確認

### 問題解決: npm install ERESSOLVEエラー
- **原因**:  後に  を実行するとpeer依存関係の競合
- **解決手順**:
  1. 
added 473 packages in 1m

41 packages are looking for funding
  run `npm fund` for details
  2. 
  3. 

### GitHub push 完了
- リポジトリ: 
- パス: 
- コミット: 
