# 99_AI向け

最終更新: 2026-02-16

## このフォルダについて

AIエージェント（Claude Code等）が効率的にプロジェクトを理解するための要約ドキュメントが格納されています。

## ファイル一覧

### AI_DESIGN.md

プロジェクト全体をAIが短時間で復元できるよう要約した設計書です。

**内容:**
- System Summary（システム概要）
- Architecture Snapshot（アーキテクチャ要約）
- Business Rules（ビジネスルール）
- UI Interaction Contracts（UI仕様）
- API Contracts（API仕様）
- Data Model Contracts（データモデル）
- Validation & Security（バリデーション）
- Operational Commands（運用コマンド）
- Known Decisions（既知の判断事項）
- Phase2 Backlog（次フェーズ候補）

**特徴:**
- 簡潔で構造化された記述
- 重要な仕様のみを抽出
- AIが次の改修を安全に継続できる情報に特化

## 人間向けドキュメントとの違い

### 人間向け（02_設計書/Phase1設計書.md）
- 詳しい説明
- 図や例を多用
- 段階的に理解できる構成

### AI向け（AI_DESIGN.md）
- 要点のみ抽出
- 構造化された箇条書き
- 仕様の「契約（Contract）」を重視

## いつ使う？

### 人間の開発者
通常は `02_設計書/` や `04_開発ガイド/` を参照してください。
AI_DESIGN.mdは、AIと協働する際の補助資料として参照できます。

### AIエージェント
新しいセッションでプロジェクトを理解する際、まずAI_DESIGN.mdを読み込むことで、短時間で全体像を把握できます。

## 更新タイミング

AI_DESIGN.mdは、以下のタイミングで更新します:

- Phase完了時
- 主要な設計変更時
- API仕様変更時
- データモデル変更時

## 関連ドキュメント

- [02_設計書/Phase1設計書.md] - 詳細版の設計書
- [03_データベース/database設計.md] - データベースの詳細
- [05_改修履歴/] - 変更履歴
