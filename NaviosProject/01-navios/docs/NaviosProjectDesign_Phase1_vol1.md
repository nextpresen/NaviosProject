# Navios Phase1 設計書 Vol.1 — UI/UX改修編

最終更新: 2026-02-15
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
