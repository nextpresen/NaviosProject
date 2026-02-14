# プロジェクト概要
アプリ名称：NaviOs(ナビオス)  
ドメイン：navios.life  
思想：自分の住んでいる場所でしっかりと生き抜ける安心を作る。あるいは旅先でその瞬間を発見することができる。「生活判断を支援する"ライフナビOS"」

## 開発Phase1.
記載している画面を作成してください。
ｚ一般ユーザー画面
- イベント一覧表示画面※アプリを使用するユーザーが一番最初に見る画面  
- デザインはヘッダーに検索ボックス、その下にmap※googlemapを実装する予定、その下に投稿一覧の表示
- イベント詳細画面 ※イベント一覧表示画面から1項目選択することでイベント詳細画面を確認できる。
- 一般ユーザーのログイン機能を作成する
- ログイン後に投稿ができるようになる 
1. タイトル(title)
2. 本文(content)
3. イメージ画像(img_content)
4. 位置情報、緯度経度(latitude,longitude)
5. イベント日付(event_date)
6. 投稿者名(author_name)
7. 掲載終了日付(expire_date)
z. 投稿するボタン

🔸管理ユーザー画面
ログイン機能を作成して管理画面から記事を投稿することができる。
- 一般ユーザーの投稿データを確認できるユーザー管理画面※ユーザーが投稿した投稿の削除、編集、も可能な状態にする。 
- 投稿作成フォーム
1. タイトル(title)
2. 本文(content)
3. イメージ画像(img_content)
4. 位置情報、緯度経度(latitude,longitude)
5. イベント日付(event_date)
6. 投稿者名(author_name)
7. 掲載終了日付(expire_date)
8. 公開状態(status)
- draft
- published
- expired
9. 自動※並び替えに必要(created_at)


## 技術構成
🔸MVP優先
フロントエンド  
- typescirpt
- tailwind.css
- next.js appRouter
※コンポーネント化を細かくしてほしい
デプロイ
- vercel
データベース
- supabase

プロンプト
1. /home/zer0/ドキュメント/NaviosProject/01 navios/claude.mdを読んで技術構成を確認して理解してください。
2. 理解できたら開発phase1に着手してください。
3. supabase連携、vercelデプロイに関しては設定が必要になるのでわかりやすく設定方法をマークダウンで記載してください。
4. /home/zer0/ドキュメント/NaviosProject/01 navios配下にapp/adminディレクトリを作成して管理画面用に作成、ユーザー向けアプリには01 navios配下にapp/webを作成する。

今の時点の問題点は下記の通りですので修正をお願いいたします。

1. 投稿後