# Navios Phase1 設計書 Vol.1 — UI/UX改修編

最終更新: 2026-02-16
対象: `/home/zer0/ドキュメント/NaviosProject/01-navios/navios`
前提: `NaviosProjectDesign_Phase1.md` Phase1完了後の改修

## 1. 改修概要

Phase1完了後のUI/UX品質向上改修。以下4項目を実施。

| # | 項目 | 状態 |
|---|---|---|
| 1 | UI/UXの洗練（デザインポリッシュ） | 完了 |
| 2 | モバイル: フィルターをナビからヘッダー下に移動 | 完了 |
| 3 | 認証（ログイン/新規登録）はナビゲーション維持 | 変更なし |
| 4 | 検索機能を全投稿対象に修正 | 完了 |

## 2. 検索機能の修正

### 2.1 問題
`hooks/useEvents.ts` の `filteredEvents` が `matchFilter && matchQuery` のAND条件で算出されていた。フィルター（例: LIVE NOW）適用中に検索すると、フィルター結果内のみが検索対象となり、他ステータスの投稿がヒットしなかった。

### 2.2 修正内容
検索クエリがある場合はフィルターを無視し、全投稿から検索するよう変更。

```typescript
// hooks/useEvents.ts (filteredEvents計算部分)
// Before: return matchFilter && matchQuery;
// After:
if (q) return matchQuery;
return matchFilter;
```

### 2.3 挙動
- 検索クエリ入力時 → 全投稿（today/upcoming/ended問わず）から title/content で検索
- 検索クエリ空 → 従来通りフィルター（ALL/LIVE NOW/SOON/FINISHED）で絞り込み
- searchResults（検索サジェスト）は従来から全投稿対象のため変更なし

## 3. モバイルフィルターUI移動

### 3.1 Before
- フィルターはMenuDrawer（ハンバーガーメニュー）内に配置
- SpotBadge（LIVE NOW件数表示）が地図右上に浮遊

### 3.2 After
- **MobileFilterBar** を新規作成し、MobileHeader直下に配置
- SpotBadgeのガラスモーフィズムデザインを踏襲したフィルターチップ
- MenuDrawerからフィルターセクションを削除（認証セクションのみ残存）
- SpotBadgeは MobileFilterBar の LIVE NOW チップに統合し削除

### 3.3 MobileFilterBar デザイン仕様
- 位置: `absolute top-[46px]` / `z-[1050]`（MobileHeaderの直下）
- スタイル: `rounded-full`, `bg-white/85`, `backdrop-blur-xl`, `border border-white/60`, `shadow-lg`
- アクティブ状態:
  - ALL: `bg-slate-800 text-white`
  - LIVE NOW: `bg-gradient-to-r from-pink-500 to-fuchsia-600 text-white`
  - SOON: `bg-blue-600 text-white`
  - FINISHED: `bg-slate-500 text-white`
- 各チップにイベント件数を表示
- 横スクロール対応（`overflow-x-auto no-scrollbar`）

### 3.4 変更ファイル
| ファイル | 変更 |
|---|---|
| `components/mobile/MobileFilterBar.tsx` | 新規作成 |
| `components/mobile/MenuDrawer.tsx` | フィルターセクション削除、props簡素化 |
| `components/mobile/SpotBadge.tsx` | 削除（MobileFilterBarに統合） |
| `components/map/MapContainer.tsx` | SpotBadge参照削除、`mobileLiveNowCount` prop削除 |
| `app/page.tsx` | MobileFilterBar配置、MenuDrawer props更新 |

## 4. UI/UXデザインポリッシュ

### 4.1 Tailwindカスタムカラー定義
`app/globals.css` の `@theme inline` ブロックに `brand-*` / `surface-*` カラーを追加。既存コードで使用されていたが未定義だったカスタムカラーを正式定義。

| トークン | 値 | 用途 |
|---|---|---|
| `brand-50` | `#eff6ff` | ブランドライト背景 |
| `brand-100` | `#dbeafe` | ブランド薄背景 |
| `brand-200` | `#bfdbfe` | ブランドボーダー |
| `brand-500` | `#3b82f6` | プライマリアクション |
| `brand-600` | `#2563eb` | アクティブ状態 |
| `brand-700` | `#1d4ed8` | 強調 |
| `surface-50` | `#f8fafc` | 背景最薄 |
| `surface-100` | `#f1f5f9` | セクション背景 |
| `surface-200` | `#e2e8f0` | ボーダー標準 |
| `surface-300` | `#cbd5e1` | ボーダー強 |

### 4.2 フォント改善
`body` の `font-family` をシステムフォントスタックに更新。`-webkit-font-smoothing: antialiased` でレンダリング品質向上。

### 4.3 コンポーネント別変更

#### Header（デスクトップ）
- ガラスモーフィズム追加: `bg-white/90 backdrop-blur-xl`
- ボーダー: `border-slate-200/60`（ソフト化）
- `shadow-sm` 追加

#### MobileHeader
- ボーダー: `border-slate-200/40`
- `shadow-sm` 追加
- ハンバーガーボタン: `rounded-xl`, `bg-white/60`追加、タッチターゲット拡大（`w-9 h-9`）

#### Sidebar（デスクトップ）
- ガラスモーフィズム: `bg-white/95 backdrop-blur-sm`
- ボーダー: `border-slate-200/60`
- セクション区切り: `border-slate-200/40`

#### EventCard
- 左ボーダー: `border-l-4` → `border-l-[3px]`（洗練）
- 画像: `h-32 object-contain` → `h-36 object-cover`（ビジュアルフィル向上）

#### FilterTabs（デスクトップ）
- シェイプ: `rounded-lg` → `rounded-full`（ピル型に統一）
- パディング: `px-3` → `px-3.5`
- トランジション: `transition` → `transition-all duration-200`
- 非アクティブ hover: `hover:text-slate-700` 追加

#### StatusBadge
- シェイプ: `rounded-md` → `rounded-full`（ピル型に統一）
- パディング: `px-2` → `px-2.5`
- `shadow-sm` 追加
- SOON: `bg-blue-50` → `bg-blue-100/80`（視認性向上）

#### PCカードポップアップ（page.tsx）
- 画像: `object-contain` → `object-cover`

#### アニメーション（page.tsx inline styles）
- `.post-card:hover`: `translateY(-3px)` → `translateY(-2px)`（控えめに）
- `.post-card.active`: `border-color: #2a91ff` → `#3b82f6`（brand-500に統一）
- スクロールバー: `#cbd5e1` → `#94a3b8`（視認性向上）

## 5. 追加改修（Vol.1 追記）

### 5.1 モバイルフィルターバーのスクロールバー非表示
- `app/globals.css`: `no-scrollbar`をTailwind v4の`@utility`ディレクティブで再定義
- 横スクロール機能は維持しつつスクロールバーのみ非表示化

### 5.2 カテゴリタブ上部余白の縮小
- `components/mobile/MobileFilterBar.tsx`: `top-[52px]` → `top-[46px]`、`py-1.5` → `py-1`
- MobileHeaderとの間の余白を詰めてコンパクトに

### 5.3 現在地マーカーの改善
- `components/map/MapInner.tsx`: `CircleMarker`（SVGベース）から`divIcon`（CSSベース）に変更
- 青いドット（14px）+ 白ボーダー + シャドウ + パルスアニメーションのリング
- アニメーション: `locationPulse` — 2.5秒周期でリングが拡大→フェードアウト
- イベントピンより控えめだが視認しやすいデザイン

### 5.4 全体表示を現在位置基準に変更
- `components/map/MapInner.tsx` の `MapActionsBridge.resetView`:
  - Before: イベントのみの座標からboundsを計算
  - After: イベント座標 + 現在位置（取得済みの場合）を含めてboundsを計算
- 現在位置が未取得の場合は従来通りイベントのみでbounds計算

### 5.5 追加変更ファイル
| ファイル | 変更 |
|---|---|
| `app/globals.css` | `@utility no-scrollbar`に再定義 |
| `components/mobile/MobileFilterBar.tsx` | top/padding調整 |
| `components/map/MapInner.tsx` | 現在地マーカーCSS化、resetView改善 |
| `app/page.tsx` | 現在地マーカーCSS追加（`locationPulse`アニメーション） |

### 5.6 イベントピンの「カテゴリ優先」デザインに変更
- 目的: 地図上でイベント内容を瞬時に判別できるようにする
- 方針:
  - ピン本体色をカテゴリ色に統一（カテゴリごとに固定色）
  - ピン中央をカテゴリ絵文字の大表示に変更
  - 投稿者アバターは通常表示しない
  - 投稿者アバターは選択中ピンのみ右下バッジ表示（詳細カード/ポップアップ側で補完）
- 実装:
  - `components/map/MarkerIcon.tsx`:
    - 中央要素を `pin-avatar + pin-category` 構成から `pin-glyph`（カテゴリ絵文字）へ変更
    - 選択中のみ `pin-selected-avatar` を追加表示
    - カテゴリ色をCSS変数 `--pin-category-color` で `pin-body` に注入
  - `components/map/MapInner.tsx`:
    - `selectedEventId` と一致するピンのみ `isSelected=true` で `buildMarkerHTML` を生成
    - 選択中ピンの `zIndexOffset` を引き上げ、重なり時の視認性を確保
  - `app/page.tsx`:
    - ピンCSSをカテゴリ優先仕様に更新（カテゴリ色の本体、中央絵文字、選択時アバターバッジ）
    - 既存の「ピン外側カテゴリ丸チップ」を廃止

## 6. 変更ファイル一覧

| ファイル | 変更種別 |
|---|---|
| `app/globals.css` | 編集（カラー定義、フォント、no-scrollbar） |
| `hooks/useEvents.ts` | 編集（検索ロジック修正） |
| `components/mobile/MobileFilterBar.tsx` | **新規**（モバイルフィルターバー） |
| `components/mobile/MenuDrawer.tsx` | 編集（フィルターセクション削除） |
| `components/mobile/SpotBadge.tsx` | **削除**（MobileFilterBarに統合） |
| `components/map/MapContainer.tsx` | 編集（SpotBadge参照削除） |
| `components/map/MarkerIcon.tsx` | 編集（カテゴリ優先ピンHTMLに変更） |
| `components/map/MapInner.tsx` | 編集（選択中ピンのアバター表示制御） |
| `app/page.tsx` | 編集（MobileFilterBar配置、props更新、UIポリッシュ） |
| `components/layout/Header.tsx` | 編集（ガラスモーフィズム追加） |
| `components/layout/MobileHeader.tsx` | 編集（UIポリッシュ） |
| `components/layout/Sidebar.tsx` | 編集（UIポリッシュ） |
| `components/event/EventCard.tsx` | 編集（ボーダー・画像改善） |
| `components/ui/FilterTabs.tsx` | 編集（ピル型化） |
| `components/ui/StatusBadge.tsx` | 編集（ピル型化） |

## 6. 検証結果
- `npm run build`: 成功（TypeScriptエラーなし）
- `npm run lint`: 既存warning/errorのみ（今回の変更による新規エラーなし）
- `npm run test`: DB接続設定の既存問題により失敗（今回の変更とは無関係）

## 7. 未変更事項（Phase1設計書からの継続）
- API仕様: 変更なし
- データモデル: 変更なし
- 認証/認可: 変更なし
- 投稿/編集/削除フロー: 変更なし

## 8. 地図SDK差し替え可能設計（2026-02-16 追記）

### 8.1 目的
- Web（Leaflet）とMobile（将来 Google Maps SDK）を並行運用できる構成にする
- 画面側の呼び出しを「地図プロバイダ非依存」にする
- Phase1時点では挙動を壊さず、Leafletをデフォルト維持する

### 8.2 設計方針
- プロバイダ判定を `lib/map-provider.ts` に集約
- UI層は直接 `MapInner` / `PostLocationPickerInner` を参照せず、Facade経由に統一
- Provider別実装を `components/map/providers/` 配下に分離
- 型（地図描画・位置ピッカーの契約）は `components/map/types.ts` で共通化

### 8.3 実装内容（今回反映）
| 区分 | ファイル | 内容 |
|---|---|---|
| 新規 | `navios/lib/map-provider.ts` | `MapProvider` 型・`normalizeMapProvider`・`getClientMapProvider` を追加 |
| 新規 | `navios/components/map/types.ts` | `MapCanvasProps` / `PostLocationPickerCanvasProps` を追加 |
| 新規 | `navios/components/map/MapCanvas.tsx` | プロバイダ選択Facade。現状 `leaflet` と `google(フォールバック)` を切替 |
| 新規 | `navios/components/map/providers/GoogleMapCanvasFallback.tsx` | Google未実装時のLeafletフォールバック |
| 新規 | `navios/components/map/providers/GooglePostLocationPickerFallback.tsx` | Google未実装時のLeafletフォールバック |
| 編集 | `navios/components/map/MapContainer.tsx` | `MapInner` 直参照を `MapCanvas` に置換 |
| 編集 | `navios/components/map/MapInner.tsx` | props型を共通契約 `MapCanvasProps` に統一 |
| 編集 | `navios/components/map/PostLocationPicker.tsx` | プロバイダ選択Facadeへ変更 |
| 編集 | `navios/components/map/PostLocationPickerInner.tsx` | props型を `PostLocationPickerCanvasProps` に統一 |
| 編集 | `navios/app/page.tsx` | Leaflet専用CSSの適用を provider 判定で条件化 |

### 8.4 環境変数仕様
- `NEXT_PUBLIC_MAP_PROVIDER=leaflet`（既定）
- `NEXT_PUBLIC_MAP_PROVIDER=google`（現時点では警告を出しつつLeafletにフォールバック）

### 8.5 現時点の到達点
- 呼び出し側は「どの地図SDKを使うか」を直接知らない構成になった
- 将来は `GoogleMapCanvas` / `GooglePostLocationPicker` を実装し、Facade切替のみで導入可能
- 既存画面のLeaflet挙動・機能（ピン、ポップアップ、現在地、投稿位置選択）は維持

### 8.6 Google Maps実装時の差し替え手順（次フェーズ）
1. `components/map/providers/GoogleMapCanvas.tsx` を新規実装（地図表示/ピン/現在地）
2. `components/map/providers/GooglePostLocationPicker.tsx` を新規実装（投稿地点選択）
3. `MapCanvas.tsx` / `PostLocationPicker.tsx` の `google` 分岐をフォールバックから本実装へ置換
4. `app/layout.tsx` のLeaflet CSSグローバル読込を provider に応じて整理（不要時除外）
5. 主要導線（トップ地図・投稿画面）を provider 別にE2E検証

## 9. 「投稿しました」画面追加（2026-02-16 追記）

### 9.1 目的
- 投稿完了直後のユーザーに、次の行動を迷わせない導線を提供する
- 投稿直後の達成感と安心感を明示する

### 9.2 遷移仕様
- 新規投稿成功時: `/new/success?id={eventId}` に遷移
- 編集成功時: 従来どおり `/event/{eventId}` に遷移（既存挙動維持）

### 9.3 success画面仕様
- 表示文言: 「投稿しました」
- 補助文言: 投稿完了のお礼 + 次アクション案内
- ボタン:
  - `投稿を見る`（`/event/{id}`）
  - `続けて投稿する`（`/new`）
  - `トップへ戻る`（`/`）
- 直アクセス対策:
  - `id` なしの場合は警告文を表示し、`投稿を見る` の代わりに `トップへ移動する` を表示

### 9.4 メタ情報
- `app/new/success/page.tsx` にページ専用 `title` / `description` を設定

### 9.5 変更ファイル
| ファイル | 変更 |
|---|---|
| `navios/app/new/page.tsx` | 新規投稿時の遷移先を success 画面へ変更（編集時は従来維持） |
| `navios/app/new/success/page.tsx` | **新規作成**（投稿完了画面UI、直アクセス対策、メタ情報） |

### 9.6 確認項目
1. 新規投稿成功後に `/new/success?id=...` へ遷移する
2. `投稿を見る` で対象イベント詳細へ遷移する
3. `続けて投稿する` で新規投稿フォームへ遷移する
4. `id` なしで success 画面へアクセスしても破綻しない

## 10. イベントアーカイブ + 過去人気表示（2026-02-16 追記）

### 10.1 目的
- 終了済みイベントをDBに保持したまま、通常UIの情報過多を防ぐ
- 過去イベントは「人気」文脈で再利用する

### 10.2 仕様
- 終了イベントは「終了後24時間」までは通常一覧に表示
- 24時間を超えたイベントは archive 扱いとして通常一覧から除外
- archiveイベントは `GET /api/events/popular-past` で別取得し、Sidebarの `PAST POPULAR` 枠に表示

### 10.3 実装ポイント
- `lib/event-archive.ts` で archive 判定を共通化
- `GET /api/events` は archive 除外済みデータのみ返却
- `GET /api/events/popular-past` は `popularity_score` 優先で上位件数を返却
- `app/page.tsx` で通常一覧 + 過去人気を並行取得して分離表示

### 10.4 変更ファイル（主要）
| ファイル | 変更 |
|---|---|
| `navios/lib/event-archive.ts` | **新規**（archive判定ロジック） |
| `navios/app/api/events/route.ts` | archive除外を適用 |
| `navios/app/api/events/popular-past/route.ts` | **新規**（過去人気API） |
| `navios/app/page.tsx` | 過去人気API取得を追加 |
| `navios/components/layout/Sidebar.tsx` | `PAST POPULAR` セクションを追加 |
| `navios/prisma/schema.prisma` | `popularity_score` 追加 |

## 11. view_count実装（2026-02-16 追記）

### 11.1 目的
- イベント詳細の閲覧実績を収集し、将来の人気指標に利用する

### 11.2 仕様
- `Event.view_count` を追加（初期値 `0`）
- `POST /api/events/{id}/view` で閲覧数を `+1`
- 詳細ページ表示時にフロントから加算APIを呼び出す
- 同一ブラウザで30分以内の再訪は加算抑制（`localStorage`）

### 11.3 UI反映
- イベント詳細画面に「閲覧数バッジ（👁 N 閲覧）」を表示
- 加算成功時は返却値でカウントを更新

### 11.4 変更ファイル（主要）
| ファイル | 変更 |
|---|---|
| `navios/prisma/schema.prisma` | `view_count` 追加 |
| `navios/prisma/schema.supabase.prisma` | `view_count` 追加 |
| `navios/app/api/events/[id]/view/route.ts` | **新規**（閲覧数加算API） |
| `navios/components/event/EventViewCount.tsx` | **新規**（閲覧数表示 + 加算トリガ） |
| `navios/components/event/EventDetail.tsx` | 閲覧数バッジ表示追加 |
| `navios/app/event/[id]/page.tsx` | `viewCount` props連携 |
| `navios/lib/event-mapper.ts` | `view_count` マッピング追加 |
| `navios/lib/mock-events.ts` | `view_count` 追加 |
| `navios/prisma/seed.mjs` | `view_count` 追加 |

### 11.5 確認項目
1. イベント詳細画面表示時に `POST /api/events/{id}/view` が発火する
2. 初回表示で `view_count` が1増加する
3. 同一ブラウザ同一イベントで30分以内の再表示時は再加算されない

## 12. 住所自動補完（逆ジオコーディング）実装（2026-02-16 追記）

### 12.1 目的
- 緯度経度のみで投稿されたイベントにも住所情報を持たせ、表示/検索で活用可能にする

### 12.2 仕様
- `Event.address` を追加（nullable）
- 新規投稿時（`POST /api/events`）に `latitude/longitude` から逆ジオコーディングし `address` を保存
- 編集時（`PUT /api/events/{id}`）は座標が変わった場合のみ再取得
- 逆ジオコーディング失敗時は `address = null` で保存継続（投稿は成功）

### 12.3 実装ポイント
- 共通処理 `lib/reverse-geocode.ts` を新規追加
  - Nominatim reverse API を利用
  - サーバー側メモリキャッシュ（10分）を実装
- 検索対象を `title/content` に加えて `address` も対象化
- 詳細画面で住所を表示（住所がある場合のみ）

### 12.4 変更ファイル（主要）
| ファイル | 変更 |
|---|---|
| `navios/prisma/schema.prisma` | `address` カラム追加 |
| `navios/prisma/schema.supabase.prisma` | `address` カラム追加 |
| `navios/lib/reverse-geocode.ts` | **新規**（逆ジオコーディング共通処理） |
| `navios/app/api/events/route.ts` | 投稿時の住所取得/保存、検索対象に `address` 追加 |
| `navios/app/api/events/[id]/route.ts` | 座標変更時の住所再取得/保存 |
| `navios/types/event.ts` | `address` 追加 |
| `navios/lib/event-mapper.ts` | `address` マッピング追加 |
| `navios/components/event/EventDetail.tsx` | 住所表示UI追加 |
| `navios/app/event/[id]/page.tsx` | `address` props連携 |
| `navios/lib/mock-events.ts` | モック住所追加 |
| `navios/prisma/seed.mjs` | seed住所追加 |

### 12.5 確認項目
1. 緯度経度のみで新規投稿しても `address` が自動保存される
2. 座標を変えずに編集した場合、既存 `address` が維持される
3. 座標を変更して編集した場合、`address` が再計算される
4. 逆ジオコーディング失敗時でも投稿/更新は成功する
