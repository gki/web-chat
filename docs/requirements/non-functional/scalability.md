# スケーラビリティ設計

## 実現すべきポイント

### 基本的なスケーラビリティ要求
- **段階的成長対応**: 利用者数の段階的増加への適応能力
- **性能維持**: 負荷増加時のレスポンス時間・品質維持
- **リソース効率**: コスト効率的なリソース利用とスケーリング
- **可用性確保**: スケーリング時のサービス継続性維持

### システム成長への適応力
- **垂直スケーリング**: 現在のアーキテクチャ内での性能向上
- **水平スケーリング準備**: 将来的な分散アーキテクチャへの移行基盤
- **データ分散**: 効率的なデータ管理とアクセス最適化
- **監視体制**: 成長に伴う問題の早期発見と対応

## 選択の背景・理由

### 段階的スケーリング戦略の採用理由

#### 現実的な成長シナリオへの対応
- **初期段階最適化**: 単一サーバーでの効率的運用から開始
- **段階的移行**: 必要に応じた段階的なアーキテクチャ進化
- **コスト効率**: 利用規模に応じた適切なリソース投資
- **技術的学習**: システム成長を通じた運用知識の蓄積

#### 垂直から水平への移行計画
- **Phase 1**: SQLite・単一サーバーでの最適化（現在）
- **Phase 2**: Redis導入によるキャッシュ・PubSub分離
- **Phase 3**: PostgreSQL移行とレプリケーション導入
- **Phase 4**: マイクロサービス化と完全分散アーキテクチャ

### 技術アーキテクチャ戦略の意図

#### SQLite から PostgreSQL への段階的移行
- **初期最適化**: SQLite での効率的運用知識の習得
- **移行計画性**: 段階的な移行による運用リスクの最小化
- **データ整合性**: 移行時のデータ完全性確保戦略
- **パフォーマンス比較**: 実測データに基づく意思決定

#### メモリ内からRedisへのPubSub移行戦略
- **シンプル開始**: メモリ内PubSubでの基本パターン確立
- **外部依存導入**: Redis導入による分散対応準備
- **段階的依存**: 必要性が明確になった時点での技術選択
- **運用負荷配慮**: 複雑な分散システムへの段階的対応

#### 負荷分散戦略の考慮
- **WebSocket特性**: 永続接続の負荷分散における技術的課題認識
- **セッション固着**: WebSocket接続の特定サーバー固着要求への対応
- **スケーラビリティ限界**: 単一サーバー限界の明確な把握
- **将来対応準備**: 分散アーキテクチャへの移行基盤整備

### データベースアーキテクチャ発展戦略

#### 段階的データベース移行の意図
- **実装学習**: SQLiteでのORMパターン・クエリ最適化の習得
- **運用経験**: 単一データベースでの運用ノウハウ蓄積
- **移行準備**: PostgreSQL移行時の設計・実装知識の事前習得
- **リスク管理**: 段階的移行による運用継続性確保

#### レプリケーション戦略の検討背景
- **読み取り負荷分散**: 大量ユーザー時の効率的な読み取り処理
- **可用性向上**: データベース障害時の継続性確保
- **地理的分散**: 複数リージョン展開時の遅延最小化
- **コスト最適化**: 読み取り専用インスタンスによるコスト効率化

### リアルタイム通信アーキテクチャの発展

#### メッセージングシステムの進化計画
- **段階的分散**: メモリ内 → Redis → クラスター対応の段階的導入
- **可用性向上**: 単一障害点の段階的排除
- **性能最適化**: メッセージ配信の遅延最小化
- **運用経験**: 分散システム運用ノウハウの習得

#### WebSocket接続管理の進化計画
- **接続プール管理**: 効率的なメモリ・リソース管理
- **スケーラビリティ監視**: 接続数・性能のリアルタイム監視
- **障害対応**: 異常接続の自動検出・クリーンアップ
- **分散対応**: 複数サーバー間での接続管理連携

## 検討した代替案と却下理由

### スケーリング戦略代替案

#### 初期段階での大規模アーキテクチャ導入
- **長所**: 高スケーラビリティ、将来対応不要、高可用性
- **短所**: 初期開発コスト、運用複雑性、学習コスト
- **却下理由**: 現在のアプリ規模、MVP段階での開発効率重視

#### サーバーレスアーキテクチャ
- **長所**: 自動スケーリング、運用コスト最小、管理オーバーヘッドなし
- **短所**: WebSocket不対応、状態管理制限、ベンダーロックイン
- **却下理由**: リアルタイム通信要求、WebSocket継続接続必要性

#### 全編書き換えアーキテクチャ
- **長所**: 最新技術スタック、パフォーマンス最適化、モダンな設計
- **短所**: 開発コスト大、運用知識リセット、リスク高
- **却下理由**: 現在のアーキテクチャの十分性、段階的改善の効率性

### データベース技術代替案

#### NoSQLデータベース（MongoDB等）
- **長所**: 柔軟なスキーマ、水平スケーリング、JSONネイティブ
- **短所**: ACID不完全、学習コスト、データ整合性リスク
- **却下理由**: リレーショナルデータ構造、トランザクション要求

#### インメモリデータベース（Redisのみ）
- **長所**: 最高パフォーマンス、低遅延、キャッシュ統合
- **短所**: 永続化制限、メモリコスト、運用複雑性
- **却下理由**: データ永続化要求、単純なアーキテクチャ優先

#### 2.2 クエリ最適化
```typescript
// 効率的なページネーション
const getMessagesPaginated = async (roomId: string, cursor?: string, limit = 50) => {
  return prisma.message.findMany({
    where: {
      roomId,
      ...(cursor && { createdAt: { lt: new Date(cursor) } })
    },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
};

// バッチ処理による効率化
const batchCreateMessages = async (messages: MessageInput[]) => {
  return prisma.$transaction(
    messages.map(msg => 
      prisma.message.create({
        data: msg,
        include: { user: true }
      })
    )
  );
};
```

## マイクロサービス化検討

### 1. サービス分割戦略

#### 1.1 ドメイン境界
```
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  User Service   │  │ Message Service │  │ Room Service    │
│                 │  │                 │  │                 │
│ - 認証・認可     │  │ - メッセージCRUD │  │ - ルーム管理     │
│ - ユーザー管理   │  │ - 履歴管理      │  │ - 権限管理      │
│ - セッション    │  │ - 検索機能      │  │ - 設定管理      │
└─────────────────┘  └─────────────────┘  └─────────────────┘
         │                      │                      │
         └──────────────────────┼──────────────────────┘
                                │
                    ┌─────────────────┐
                    │ Gateway Service │
                    │                 │
                    │ - API Gateway   │
                    │ - 認証プロキシ   │
                    │ - レート制限     │
                    └─────────────────┘
```

#### 1.2 サービス間通信
```typescript
// GraphQL Federation
import { buildFederatedSchema } from '@apollo/federation';

// User Service
const userSchema = buildFederatedSchema([{
  typeDefs: gql`
    type User @key(fields: "id") {
      id: ID!
      name: String!
      lastSeen: DateTime!
    }
  `,
  resolvers: userResolvers
}]);

// Message Service
const messageSchema = buildFederatedSchema([{
  typeDefs: gql`
    extend type User @key(fields: "id") {
      id: ID! @external
    }
    
    type Message {
      id: ID!
      content: String!
      user: User!
    }
  `,
  resolvers: messageResolvers
}]);
```

### 2. イベント駆動アーキテクチャ

#### 2.1 イベントストリーミング
```typescript
// Apache Kafka / Redis Streams を使ったイベント配信
class EventBus {
  private kafka = kafka({ clientId: 'chat-app', brokers: ['kafka:9092'] });
  private producer = this.kafka.producer();
  
  async publishEvent(topic: string, event: any) {
    await this.producer.send({
      topic,
      messages: [{
        key: event.aggregateId,
        value: JSON.stringify(event),
        timestamp: Date.now()
      }]
    });
  }
  
  async subscribeToEvents(topic: string, handler: (event: any) => void) {
    const consumer = this.kafka.consumer({ groupId: 'message-processor' });
    await consumer.subscribe({ topic });
    
    await consumer.run({
      eachMessage: async ({ message }) => {
        const event = JSON.parse(message.value!.toString());
        await handler(event);
      }
    });
  }
}

// イベント例
interface MessageCreatedEvent {
  type: 'MESSAGE_CREATED';
  aggregateId: string;
  payload: {
    messageId: string;
    content: string;
    userId: string;
    roomId: string;
    timestamp: string;
  };
}
```

## データ分散戦略

### 1. シャーディング

#### 1.1 メッセージデータの分散
```typescript
// ルームIDベースのシャーディング
class MessageShardRouter {
  private shards = [
    { name: 'shard1', connection: 'postgresql://shard1.db:5432/messages' },
    { name: 'shard2', connection: 'postgresql://shard2.db:5432/messages' },
    { name: 'shard3', connection: 'postgresql://shard3.db:5432/messages' }
  ];
  
  getShardForRoom(roomId: string): string {
    const hash = this.hashFunction(roomId);
    const shardIndex = hash % this.shards.length;
    return this.shards[shardIndex].connection;
  }
  
  private hashFunction(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit整数に変換
    }
    return Math.abs(hash);
  }
}
```

### 2. キャッシュ戦略

#### 2.1 多層キャッシュ
```typescript
// Redis + In-Memory キャッシュ
class CacheManager {
  private l1Cache = new Map(); // アプリケーションメモリ
  private l2Cache: Redis; // Redis
  
  async get(key: string): Promise<any> {
    // L1キャッシュから取得
    if (this.l1Cache.has(key)) {
      return this.l1Cache.get(key);
    }
    
    // L2キャッシュから取得
    const l2Value = await this.l2Cache.get(key);
    if (l2Value) {
      const parsed = JSON.parse(l2Value);
      this.l1Cache.set(key, parsed);
      return parsed;
    }
    
    return null;
  }
  
  async set(key: string, value: any, ttl = 3600): Promise<void> {
    // 両方のキャッシュに保存
    this.l1Cache.set(key, value);
    await this.l2Cache.setex(key, ttl, JSON.stringify(value));
  }
}

// キャッシュ無効化戦略
const invalidateUserCache = async (userId: string) => {
  await Promise.all([
    cache.del(`user:${userId}`),
    cache.del(`user:${userId}:messages`),
    cache.del(`user:${userId}:rooms`)
  ]);
};
```

## 監視・メトリクス

### 1. スケーラビリティメトリクス

#### 1.1 リアルタイム監視
```typescript
// Prometheus メトリクス
import client from 'prom-client';

const activeConnections = new client.Gauge({
  name: 'websocket_active_connections',
  help: 'Number of active WebSocket connections',
  labelNames: ['server_id']
});

const messageRate = new client.Counter({
  name: 'messages_total',
  help: 'Total number of messages processed',
  labelNames: ['room_id', 'server_id']
});

const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query duration',
  labelNames: ['query_type'],
  buckets: [0.001, 0.005, 0.01, 0.05, 0.1, 0.5, 1, 5]
});

// メトリクス更新
setInterval(() => {
  activeConnections.set({ server_id: process.env.SERVER_ID }, 
    wsManager.getConnectionCount());
}, 1000);
```

### コスト・投資計画の影響

#### スケーリング段階別コスト予測
- **Phase 1-2**: 最小コストでの効率性検証
- **Phase 3-4**: Redis・PostgreSQL導入による段階的コスト増
- **Phase 5**: マイクロサービス化による運用コスト大幅増
- **ROI計算**: 各段階でのユーザー数対コストの効率性検証

#### 投資対効果の最適化
- **段階的投資**: 必要に応じたタイミングでの技術投資
- **メトリクス駆動**: 実績データに基づく投資判断
- **リスクヘッジ**: 過大投資リスクの回避戦略
- **可逆性**: スケールダウン時のコスト削減可能性

### 技術的制約と将来リスクの管理

#### 現在の技術的制約認識
- **WebSocket接続数**: 単一サーバーでの理論的上限
- **SQLite同時書き込み**: ファイルベースDBの本質的制限
- **メモリ管理**: Node.jsシングルスレッドモデルの限界
- **ネットワーク帯域**: 単一サーバーの物理的制約

#### 将来リスクへの備え
- **技術的負債**: 早期段階のシンプル実装からの移行コスト
- **運用複雑性**: 分散システム化に伴う運用負荷増加
- **スキルギャップ**: スケーラビリティ専門知識の組織内収集
- **ベンダーロックイン**: 特定クラウドサービスへの過度な依存回避