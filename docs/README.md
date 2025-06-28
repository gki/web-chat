# リアルタイムチャットアプリケーション - ドキュメント

このディレクトリには、リアルタイムチャットアプリケーションの技術仕様書・設計書が含まれています。

## プロジェクト概要

Node.js、React、GraphQL、SQLiteを使用したリアルタイムチャットアプリケーション。モノレポ構造でTypeScriptによる厳密な型チェックを採用。

## ドキュメント構成

### 📐 アーキテクチャ
- [**architecture/**](./architecture/) - システム全体の設計・構成
  - [overview.md](./architecture/overview.md) - システム全体概要
  - [tech-stack.md](./architecture/tech-stack.md) - 技術スタック詳細
  - [monorepo-structure.md](./architecture/monorepo-structure.md) - モノレポ構成の説明
  - [data-flow.md](./architecture/data-flow.md) - データフロー・リアルタイム通信

### 📋 要件定義
- [**requirements/**](./requirements/) - 機能要件・非機能要件
  - [**functional/**](./requirements/functional/) - 機能要件
    - [user-management.md](./requirements/functional/user-management.md) - ユーザー管理機能
    - [messaging.md](./requirements/functional/messaging.md) - メッセージ機能
    - [real-time-updates.md](./requirements/functional/real-time-updates.md) - リアルタイム更新機能
  - [**non-functional/**](./requirements/non-functional/) - 非機能要件
    - [performance.md](./requirements/non-functional/performance.md) - パフォーマンス要件
    - [scalability.md](./requirements/non-functional/scalability.md) - スケーラビリティ設計
    - [reliability.md](./requirements/non-functional/reliability.md) - 可用性・信頼性
    - [security.md](./requirements/non-functional/security.md) - セキュリティ要件
    - [monitoring.md](./requirements/non-functional/monitoring.md) - 監視・ログ戦略
    - [maintenance.md](./requirements/non-functional/maintenance.md) - 保守性・運用性

### 🔐 認証・認可
- [**auth/**](./auth/) - 認証・認可システム
  - [overview.md](./auth/overview.md) - 認証システム概要
  - [user-session.md](./auth/user-session.md) - ユーザーセッション管理
  - [browser-storage.md](./auth/browser-storage.md) - ブラウザストレージ活用
  - [security.md](./auth/security.md) - セキュリティ対策

### 🏗️ インフラ・運用
- [**infrastructure/**](./infrastructure/) - インフラ仕様
  - [overview.md](./infrastructure/overview.md) - インフラ全体構成
  - [server-requirements.md](./infrastructure/server-requirements.md) - サーバー要件・スペック
  - [database-setup.md](./infrastructure/database-setup.md) - データベース環境構築
  - [networking.md](./infrastructure/networking.md) - ネットワーク設計
  - [storage.md](./infrastructure/storage.md) - ストレージ設計
  - [backup-recovery.md](./infrastructure/backup-recovery.md) - バックアップ・復旧手順

- [**devops/**](./devops/) - DevOps・CI/CD
  - [ci-cd-pipeline.md](./devops/ci-cd-pipeline.md) - CI/CDパイプライン設計
  - [docker.md](./devops/docker.md) - Docker化戦略
  - [deployment-strategy.md](./devops/deployment-strategy.md) - デプロイメント戦略
  - [environment-management.md](./devops/environment-management.md) - 環境管理（dev/staging/prod）
  - [automation.md](./devops/automation.md) - 自動化ツール・スクリプト
  - [rollback-procedures.md](./devops/rollback-procedures.md) - ロールバック手順

### 🧪 品質保証
- [**qa/**](./qa/) - QA・テスト戦略
  - [test-strategy.md](./qa/test-strategy.md) - 全体テスト戦略
  - [unit-testing.md](./qa/unit-testing.md) - 単体テスト指針
  - [integration-testing.md](./qa/integration-testing.md) - 結合テスト指針
  - [e2e-testing.md](./qa/e2e-testing.md) - E2Eテスト指針
  - [performance-testing.md](./qa/performance-testing.md) - パフォーマンステスト
  - [security-testing.md](./qa/security-testing.md) - セキュリティテスト
  - [code-quality.md](./qa/code-quality.md) - ESLint/Prettier/TypeScript設定

### 💾 技術仕様
- [**database/**](./database/) - データベース仕様
  - [entities.md](./database/entities.md) - エンティティ関連図
  - [migrations.md](./database/migrations.md) - マイグレーション手順
  - [naming-rules.md](./database/naming-rules.md) - DB命名規則

- [**frontend/**](./frontend/) - フロントエンド仕様
  - [components.md](./frontend/components.md) - コンポーネント一覧・役割
  - [state-management.md](./frontend/state-management.md) - 状態管理（Apollo Client）
  - [routing.md](./frontend/routing.md) - ルーティング仕様
  - [ui-ux.md](./frontend/ui-ux.md) - UI/UX設計思想
  - [naming-rules.md](./frontend/naming-rules.md) - フロントエンド命名規則

- [**backend/**](./backend/) - バックエンド仕様
  - [resolvers.md](./backend/resolvers.md) - GraphQLリゾルバー解説
  - [server-setup.md](./backend/server-setup.md) - サーバー設定・起動
  - [error-handling.md](./backend/error-handling.md) - エラーハンドリング
  - [naming-rules.md](./backend/naming-rules.md) - バックエンド命名規則

## 開発者向けリソース

- **開発環境セットアップ**: [../CLAUDE.md](../CLAUDE.md) を参照
- **GraphQL API**: 自動生成される型定義とスキーマを活用
- **テスト実行**: `npm test` でプロジェクト全体のテスト実行

## ドキュメント記述方針

docs配下のmdには具体的なコード例や設定ファイルの例を記載せず、実現しなければならないポイント、その決定の背景、考えられる代替手段に対してなぜ採用しなかったのか、の3点を必ず記載すること。

## 貢献・更新

ドキュメントの更新や改善については、以下の原則に従ってください：

1. **最新性**: コードの変更に合わせてドキュメントを更新
2. **一貫性**: 既存の構造・フォーマットに従って記述
3. **設計思想重視**: 実装よりも設計判断の理由を重視
4. **相互参照**: 関連するドキュメント間のリンクを適切に設定