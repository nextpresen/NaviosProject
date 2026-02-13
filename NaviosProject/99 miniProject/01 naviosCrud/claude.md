# プロジェクト概要
アプリ名称：NaviOs(ナビオス)  
※生活レイヤーになり得る意味合い  
ドメイン：navios.life  
思想：自分の住んでいる場所でしっかりと生き抜ける安心を作る。あるいは旅先でその瞬間を発見することができる。「生活判断を支援する"ライフナビOS"」

## アプリを通じて得られる情報

### 地域限定・生活のお得情報を取得できる
- 「派手なクーポン」じゃなく、「地味に助かる」近くの情報だから安心する。
- 旅先で穴場を見つけたりサポートツールになれる
- 商店街情報
- 病院情報
- 役所情報
- ゴミの日・断水・工事情報
- 農家直売
- 朝市・夕市
- 移動販売

## 機能
- 管理画面 
- 投稿作成フォーム  
1. タイトル(title)
2. 本文(content)
3. 位置情報、緯度経度(latitude,longitude)
4. イベント日付(event_date)
5. 投稿者名(author_name)
6. 掲載終了日付(expire_date)
7. 公開状態(status)
- draft
- published
- expired
8. 自動※並び替えに必要(created_at)

## 技術構成は下記を使用する
🔸MVP優先
フロントエンド  
- typescirpt
- tailwind.css
- next.js appRouter
デプロイ
- vercel
データベース
- supabase

※vercel,supabaseは設定が必要になるので手順を教えてください



プロンプト
1. /home/zer0/ドキュメント/NaviosProject/99 miniProject/01 naviosCrud/claude.md
を読んで開発環境を整えて開発してみてください。ソースコードは/home/zer0/ドキュメント/NaviosProject/99 miniProject/01 naviosCrud内にディレクトリを作成してみてください
2. 書き方あってる？
NEXT_PUBLIC_SUPABASE_URL=https://jqhodqfjzdfqocspirsn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaG9kcWZqemRmcW9jc3BpcnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5NzU2MTQsImV4cCI6MjA4NjU1MTYxNH0.Ul8MUr3TkfdOb2EXVqUV7tivmhjl5vDCgg3g24hFVsY
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxaG9kcWZqemRmcW9jc3BpcnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk3NTYxNCwiZXhwIjoyMDg2NTUxNjE0fQ.4YqMFHw9t2IhICzKEMWJQpLiRhmUGtvc0HUEVkbkI9g
3. Could not find the table 'public.posts' in the schema cache
エラーが表示される
4. 次は画像の投稿もやりたい