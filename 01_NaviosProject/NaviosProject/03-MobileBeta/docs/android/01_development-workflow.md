# Android 開発ワークフロー

## 基本ルール

- **ビルド・スタート・dev は必ず PowerShell で実行する**
- **WSL はプログラムを書く際にのみ使用する**
- **エミュレータは Android Studio から立ち上げる**

---

## コマンド比較

| 特徴 | `npx expo start` | `npx expo run:android` |
|------|-------------------|------------------------|
| 実行速度 | 爆速（数秒） | 遅い（数分〜。ビルドするため） |
| ネイティブビルド | しない | する |
| 使うアプリ | Expo Go または 既存のビルド | 独自の開発ビルドアプリ |
| PC負荷 | 低い | 高い（CPUをフルで使う） |
| 主な用途 | 日々のコード修正・確認 | 環境構築・設定変更の反映 |

---

## `npx expo start`（開発サーバーの起動）

「Metro」と呼ばれる JavaScript の開発サーバーを立ち上げるコマンド。

- **何をするか**: JS コードをまとめ、エミュレータや実機に送る準備をする
- **受け側**: すでにインストールされている「Expo Go」アプリ、または以前にビルドした「開発ビルド（Development Build）」アプリの中で JS を動かす
- **メリット**: 起動が非常に速い
- **いつ使うか**: UI の調整、ロジックの修正など、日常的なコーディングのほとんど

## `npx expo run:android`（ネイティブビルド + 実行）

Android のネイティブコード（Java/Kotlin）を実際にビルドして、エミュレータにアプリをインストールするコマンド。

- **何をするか**: `android` フォルダを生成（または更新）し、Gradle を使って `.apk` / `.aab` を作成・インストールする。ビルドが終わると自動的に `npx expo start` も実行される
- **受け側**: エミュレータにプロジェクト専用の「カスタムアプリ」が直接インストールされる（Expo Go は使わない）
- **メリット**: `app.json` の設定変更や、ネイティブライブラリの追加が反映される
- **いつ使うか**:
  - 最初にプロジェクトを動かす時
  - 新しいネイティブライブラリ（`expo-camera` など）を追加した時
  - `app.json` でアイコンやスプラッシュ画面、権限（Permissions）などを変更した時

---

## おすすめのワークフロー

1. **初回**: `npx expo run:android` でエミュレータを立ち上げ、アプリをインストールする
2. **日常**: 以降は `npx expo start` だけを使い、エミュレータ内でアプリを開き直す（または `r` キーでリロード）
3. **設定変更時**: `app.json` をいじったり、エラーで「Native module not found」と出たりしたら、再度 `npx expo run:android` を行う

---

## エミュレータ管理

### エミュレータの起動

Android Studio からエミュレータ（Pixel 9 など）を起動する。

### エミュレータが裏で動いている場合

プロセスを停止してから再起動する:

```powershell
# プロセスIDを指定して停止（例: 13460）
Stop-Process -Id 13460
```

### 「Pixel 9 is already running as process XXXXX」が出た場合

`npx expo run:android` 実行時、Expo がエミュレータを起動しようとする際に、すでにエミュレータが動いていると表示される。エミュレータが正常に動作していれば問題なく、ビルドはそのまま進む。

---

## 環境設定

### ANDROID_HOME

Gradle ビルドには `ANDROID_HOME` 環境変数が必要。

```powershell
# セッション単位で設定
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
```

### local.properties

`android/local.properties` に SDK パスを記述する:

```
sdk.dir=C:\\Users\\takuy\\AppData\\Local\\Android\\Sdk
```

作成コマンド:

```powershell
Set-Content -Path "android\local.properties" -Value "sdk.dir=C:\\Users\\takuy\\AppData\\Local\\Android\\Sdk"
```

### PATH に adb を追加

```powershell
$env:PATH += ";$env:LOCALAPPDATA\Android\Sdk\platform-tools"
adb devices
```
