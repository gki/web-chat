# インフラ全体構成

## 概要

リアルタイムチャットアプリケーションのインフラストラクチャは、開発・テスト・本番の各環境において、シンプルかつ効率的な構成を採用しています。現在は軽量なシングルノード構成から始まり、将来的なスケーリングを見据えた設計となっています。

## 現在のインフラ構成

### 1. 開発環境（Local Development）

```
Developer Machine
├── Node.js (18+)
│   ├── Backend Server (localhost:4000)
│   │   ├── Express + Apollo Server
│   │   ├── GraphQL API
│   │   └── WebSocket (Subscriptions)
│   └── Frontend Dev Server (localhost:5173)
│       ├── Vite Development Server
│       ├── React Application
│       └── Hot Module Replacement
├── SQLite Database
│   ├── dev.db (開発用データ)
│   └── test*.db (テスト用一時DB)
└── ローカルツール
    ├── Prisma Studio (localhost:5555)
    ├── Apollo Studio (GraphQL Playground)
    └── Browser DevTools
```

#### 開発環境の特徴
- **軽量性**: SQLiteによるファイルベースDB
- **高速起動**: Viteによる高速な開発サーバー
- **ホットリロード**: コード変更の即座反映
- **デバッグ支援**: 豊富な開発ツール

### 2. テスト環境

```
Test Environment
├── Node.js Test Runner
│   ├── Jest (Backend Tests)
│   │   ├── Unit Tests
│   │   ├── Integration Tests
│   │   └── GraphQL API Tests
│   └── Jest + React Testing Library (Frontend)
│       ├── Component Tests
│       ├── Hook Tests
│       └── Integration Tests
├── 一時的リソース
│   ├── 分離されたSQLiteインスタンス
│   ├── Mock WebSocket Server
│   └── MSW (API Mocking)
└── CI/CD環境（将来的）
    ├── GitHub Actions
    ├── Docker Container
    └── 自動テスト実行
```

### 3. 本番環境（想定構成）

```
Production Environment
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                        │
│                     (Nginx / HAProxy)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                   Application Server                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Node.js Application                    │   │
│  │  ├── Express Server                                 │   │
│  │  ├── Apollo GraphQL Server                          │   │
│  │  ├── WebSocket Handler                              │   │
│  │  └── Static File Serving                            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────┴───────────────────────────────────────┐
│                      Database Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              PostgreSQL                             │   │
│  │  ├── Primary Database                               │   │
│  │  ├── Connection Pooling                             │   │
│  │  └── Backup & Recovery                              │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                     External Services                      │
│  ├── CDN (Static Assets)                                   │
│  ├── SSL/TLS Certificate (Let's Encrypt)                   │
│  ├── DNS Provider                                          │
│  ├── Monitoring (Prometheus + Grafana)                     │
│  └── Log Aggregation (ELK Stack)                           │
└─────────────────────────────────────────────────────────────┘
```

## ネットワーク設計

### 1. ポート構成

#### 開発環境
| サービス | ポート | プロトコル | 用途 |
|----------|--------|------------|------|
| Frontend Dev Server | 5173 | HTTP | React開発サーバー |
| Backend API Server | 4000 | HTTP/WebSocket | GraphQL API + Subscriptions |
| Prisma Studio | 5555 | HTTP | データベース管理UI |
| Database | ファイル | SQLite | ローカルファイルアクセス |

#### 本番環境（想定）
| サービス | ポート | プロトコル | 用途 |
|----------|--------|------------|------|
| Load Balancer | 80/443 | HTTP/HTTPS | 外部からのアクセス |
| Application Server | 4000 | HTTP/WebSocket | 内部API通信 |
| Database | 5432 | PostgreSQL | データベース接続 |
| Monitoring | 9090/3000 | HTTP | Prometheus/Grafana |

### 2. セキュリティグループ/ファイアウォール設定

```
External (Internet)
│
├── HTTPS (443) ──→ Load Balancer
├── HTTP (80) ───→ Load Balancer (HTTPS Redirect)
│
Application Tier
│
├── Load Balancer ──→ App Server (4000)
├── App Server ────→ Database (5432)
├── App Server ────→ Redis (6379) ※将来的
│
Internal Monitoring
│
├── Prometheus (9090) ← App Server
├── Grafana (3000) ←── Prometheus
└── Log Collector ←── All Services
```

## データ永続化戦略

### 1. データベース選択

#### 現在：SQLite
**選択理由**:
- 開発・テストの簡便性
- ファイルベースでの簡単なバックアップ
- トランザクション対応
- 小〜中規模での十分な性能

**制限事項**:
- 同時書き込み制限
- ネットワーク越しアクセス不可
- レプリケーション未対応

#### 将来：PostgreSQL移行
**移行理由**:
- 高い同時実行性能
- 豊富な機能（JSON、全文検索等）
- 成熟したレプリケーション
- スケーラビリティ

### 2. データバックアップ戦略

#### 開発環境
```bash
# SQLite バックアップ
cp backend/prisma/dev.db backup/dev-$(date +%Y%m%d_%H%M%S).db

# 自動バックアップスクリプト（日次）
#!/bin/bash
BACKUP_DIR="./backup"
DB_FILE="./backend/prisma/dev.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
sqlite3 $DB_FILE ".backup $BACKUP_DIR/dev-$TIMESTAMP.db"

# 30日以上古いバックアップを削除
find $BACKUP_DIR -name "dev-*.db" -mtime +30 -delete
```

#### 本番環境（想定）
```bash
# PostgreSQL バックアップ
pg_dump -h localhost -U chatapp -d chatapp_prod > backup/prod-$(date +%Y%m%d_%H%M%S).sql

# 継続的バックアップ（WAL-E / pgBackRest）
# Point-in-Time Recovery対応
# レプリケーション先への自動バックアップ
```

## リソース要件・容量計画

### 1. 開発環境要件

#### 最小要件
- **CPU**: 2コア以上
- **メモリ**: 4GB以上
- **ストレージ**: 10GB以上の空き容量
- **ネットワーク**: ブロードバンド接続

#### 推奨要件
- **CPU**: 4コア以上
- **メモリ**: 8GB以上
- **ストレージ**: SSD 20GB以上
- **ネットワーク**: 安定したインターネット接続

### 2. 本番環境要件（想定）

#### 小規模構成（〜50同時ユーザー）
| リソース | スペック | 用途 |
|----------|----------|------|
| **CPU** | 2vCPU | Node.js アプリケーション |
| **メモリ** | 4GB | アプリケーション + OS |
| **ストレージ** | 20GB SSD | アプリケーション + DB |
| **ネットワーク** | 1Gbps | WebSocket通信対応 |

#### 中規模構成（〜500同時ユーザー）
| リソース | スペック | 用途 |
|----------|----------|------|
| **CPU** | 4vCPU | 負荷分散・並列処理 |
| **メモリ** | 8GB | キャッシュ・セッション管理 |
| **ストレージ** | 100GB SSD | データ増加・ログ対応 |
| **ネットワーク** | 10Gbps | 高スループット対応 |

### 3. 成長予測・スケーリング計画

#### 段階的スケーリング
```
Phase 1: Single Server (Current)
├── SQLite Database
├── Node.js Application
└── Static File Serving

Phase 2: Database Separation (3-6 months)
├── PostgreSQL (Separate Server)
├── Node.js Application Server
└── CDN for Static Assets

Phase 3: Horizontal Scaling (6-12 months)
├── Load Balancer
├── Multiple App Server Instances
├── Database Cluster (Primary + Replicas)
├── Redis for Session Management
└── Message Queue for Background Jobs

Phase 4: Microservices (12+ months)
├── API Gateway
├── User Service
├── Message Service
├── Notification Service
├── Event Streaming (Kafka)
└── Container Orchestration (Kubernetes)
```

## 監視・ログ設計

### 1. アプリケーション監視

#### メトリクス収集
```typescript
// Prometheus メトリクス例
const promClient = require('prom-client');

// アプリケーションメトリクス
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const activeWebSocketConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections'
});

const messagesProcessed = new promClient.Counter({
  name: 'messages_processed_total',
  help: 'Total number of messages processed',
  labelNames: ['type']
});
```

#### ヘルスチェック
```typescript
// アプリケーションヘルスチェック
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    checks: {
      database: await checkDatabaseHealth(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };

  const isHealthy = health.checks.database.status === 'connected';
  res.status(isHealthy ? 200 : 503).json(health);
});

const checkDatabaseHealth = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'connected', latency: '< 10ms' };
  } catch (error) {
    return { status: 'disconnected', error: error.message };
  }
};
```

### 2. ログ管理

#### 構造化ログ
```typescript
// Winston ロガー設定
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'chat-app',
    version: process.env.APP_VERSION
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// 使用例
logger.info('User created', {
  userId: user.id,
  username: user.name,
  ipAddress: req.ip
});

logger.error('Database connection failed', {
  error: error.message,
  stack: error.stack,
  query: failedQuery
});
```

## 災害復旧・事業継続

### 1. 復旧目標

#### Recovery Time Objective (RTO)
- **開発環境**: 30分以内
- **本番環境**: 4時間以内（将来目標：1時間以内）

#### Recovery Point Objective (RPO)
- **開発環境**: 24時間
- **本番環境**: 1時間以内（将来目標：15分以内）

### 2. バックアップ戦略

#### 自動バックアップ
```bash
#!/bin/bash
# 自動バックアップスクリプト

BACKUP_DIR="/backup/chat-app"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_FILE="./backend/prisma/dev.db"

# データベースバックアップ
mkdir -p $BACKUP_DIR/database
sqlite3 $DB_FILE ".backup $BACKUP_DIR/database/backup-$TIMESTAMP.db"

# アプリケーションコードバックアップ
tar -czf $BACKUP_DIR/code/app-$TIMESTAMP.tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=coverage \
  .

# ローテーション（7日保持）
find $BACKUP_DIR -type f -mtime +7 -delete

# バックアップ検証
sqlite3 $BACKUP_DIR/database/backup-$TIMESTAMP.db "SELECT COUNT(*) FROM users;"
```

### 3. 復旧手順

#### 開発環境復旧
```bash
# 1. 環境確認
node --version
npm --version

# 2. 依存関係復元
npm install

# 3. データベース復旧
cp backup/latest-backup.db backend/prisma/dev.db

# 4. アプリケーション起動
npm run dev

# 5. 疎通確認
curl http://localhost:4000/health
```

#### 本番環境復旧（想定手順）
```bash
# 1. インフラ復旧
terraform apply -auto-approve

# 2. アプリケーションデプロイ
docker pull chat-app:latest
docker run -d --name chat-app -p 4000:4000 chat-app:latest

# 3. データベース復旧
pg_restore -h db-server -U chatapp -d chatapp_prod latest-backup.sql

# 4. ヘルスチェック
curl https://chat-app.example.com/health

# 5. 監視復旧確認
curl http://monitoring.example.com:9090/targets
```

## セキュリティ・コンプライアンス

### 1. ネットワークセキュリティ

#### 現在の実装
- **HTTPS推奨**: 開発環境でも証明書使用を推奨
- **Same-Origin Policy**: ブラウザの標準保護
- **WebSocket Secure**: WSS プロトコルの使用

#### 将来的な強化
- **WAF (Web Application Firewall)**: 悪意のあるトラフィックのフィルタリング
- **DDoS Protection**: Cloudflareなどのサービス利用
- **IP Whitelisting**: 管理機能への IP 制限

### 2. データ保護

#### 暗号化
- **Transport Encryption**: TLS 1.3
- **Data at Rest**: データベース暗号化（将来的）
- **Key Management**: 暗号化キーの安全な管理

#### プライバシー
- **データ最小化**: 必要最小限のデータのみ収集
- **データ保持期間**: 明確な保持ポリシー
- **ユーザー権利**: データアクセス・削除権の保障

## 運用・保守

### 1. デプロイメント戦略

#### 現在の手動デプロイ
```bash
# ビルド
npm run build

# テスト実行
npm test

# 本番デプロイ（手動）
rsync -av dist/ production-server:/var/www/chat-app/
pm2 restart chat-app
```

#### 将来的な自動デプロイ（CI/CD）
```yaml
# GitHub Actions例
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build application
        run: npm run build
      - name: Deploy to production
        run: |
          docker build -t chat-app:${{ github.sha }} .
          docker push registry.example.com/chat-app:${{ github.sha }}
          kubectl set image deployment/chat-app chat-app=registry.example.com/chat-app:${{ github.sha }}
```

### 2. 監視・アラート

#### アラート条件
- **応答時間**: 95%ile > 1秒
- **エラー率**: > 5%
- **メモリ使用率**: > 80%
- **ディスク使用率**: > 85%
- **WebSocket接続エラー**: > 10/分

#### 通知チャネル
- **Slack**: 開発チーム向け即座通知
- **Email**: 重要アラートの記録
- **PagerDuty**: 緊急時のオンコール対応