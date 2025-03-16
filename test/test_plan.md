# GPTブラウザエージェント テスト計画

## 1. テスト対象領域

### 1.1 ブラウザ初期化と基本操作
- ブラウザの初期化
- 基本的なナビゲーション（URL入力、ページ移動）
- クリック操作
- テキスト入力
- スクロール操作

### 1.2 GPT API連携
- GPTへのリクエスト送信
- レスポンスの解析
- ブラウザコマンドの抽出
- フィードバックの取得

### 1.3 リアルタイム通信
- WebSocket接続の確立
- イベント送受信
- 状態の同期
- スクリーンショットの転送

### 1.4 ユーザー介入機能
- 操作の一時停止/再開
- 操作の承認/拒否
- ユーザーフィードバック
- 直接操作

### 1.5 エラーハンドリング
- 接続エラー
- ブラウザ操作エラー
- GPT APIエラー
- 入力検証

## 2. テスト手順

### 2.1 単体テスト

#### 2.1.1 ブラウザエンジン
```javascript
// browserEngine.test.js
const BrowserEngine = require('../src/backend/browserEngine');

describe('BrowserEngine', () => {
  let browserEngine;
  
  beforeEach(() => {
    browserEngine = new BrowserEngine();
  });
  
  afterEach(async () => {
    if (browserEngine.isInitialized) {
      await browserEngine.close();
    }
  });
  
  test('初期化', async () => {
    const result = await browserEngine.initialize();
    expect(result.success).toBe(true);
    expect(browserEngine.isInitialized).toBe(true);
  });
  
  test('ナビゲーション', async () => {
    await browserEngine.initialize();
    const command = {
      action: 'navigate',
      params: { url: 'https://www.google.com' }
    };
    const result = await browserEngine.executeCommand(command);
    expect(result.success).toBe(true);
    expect(result.url).toContain('google.com');
  });
  
  // その他のテストケース...
});
```

#### 2.1.2 GPT統合
```javascript
// gptIntegration.test.js
const { extractBrowserCommand } = require('../src/backend/gptIntegration');

describe('GPT統合', () => {
  test('コマンド抽出 - JSON形式', () => {
    const response = '```json\n{"action":"navigate","params":{"url":"https://www.google.com"}}\n```';
    const command = extractBrowserCommand(response);
    expect(command).toEqual({
      action: 'navigate',
      params: { url: 'https://www.google.com' }
    });
  });
  
  test('コマンド抽出 - テキスト形式', () => {
    const response = 'URLをhttps://www.google.comに移動します。';
    const command = extractBrowserCommand(response);
    expect(command.action).toBe('navigate');
    expect(command.params.url).toContain('google.com');
  });
  
  // その他のテストケース...
});
```

#### 2.1.3 ユーザー操作ハンドラー
```javascript
// userInteractionHandler.test.js
const UserInteractionHandler = require('../src/backend/userInteractionHandler');
const BrowserEngine = require('../src/backend/browserEngine');

describe('UserInteractionHandler', () => {
  let browserEngine;
  let handler;
  
  beforeEach(async () => {
    browserEngine = new BrowserEngine();
    await browserEngine.initialize();
    handler = new UserInteractionHandler(browserEngine);
  });
  
  afterEach(async () => {
    await browserEngine.close();
  });
  
  test('ナビゲーション操作', async () => {
    const result = await handler.handleUserAction('navigate_home');
    expect(result.success).toBe(true);
    expect(result.url).toContain('google.com');
  });
  
  test('一時停止と再開', async () => {
    await handler.handleUserAction('pause');
    expect(handler.isPausedState()).toBe(true);
    
    await handler.handleUserAction('resume');
    expect(handler.isPausedState()).toBe(false);
  });
  
  // その他のテストケース...
});
```

### 2.2 統合テスト

#### 2.2.1 バックエンド統合
```javascript
// backend.test.js
const request = require('supertest');
const io = require('socket.io-client');
const { app, server } = require('../src/backend/server');

describe('バックエンド統合', () => {
  let socket;
  
  beforeEach((done) => {
    socket = io('http://localhost:3000');
    socket.on('connect', done);
  });
  
  afterEach((done) => {
    if (socket.connected) {
      socket.disconnect();
    }
    done();
  });
  
  test('ブラウザ初期化', (done) => {
    socket.emit('init_browser');
    socket.on('browser_initialized', (data) => {
      expect(data.success).toBe(true);
      done();
    });
  });
  
  test('タスク実行', (done) => {
    socket.emit('init_browser');
    socket.on('browser_initialized', () => {
      socket.emit('execute_task', { prompt: 'Googleで検索してください' });
      
      socket.on('gpt_response', (data) => {
        expect(data.response).toBeTruthy();
        done();
      });
    });
  });
  
  // その他のテストケース...
});
```

#### 2.2.2 フロントエンド統合
```javascript
// frontend.test.js
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../src/frontend/pages/index';

describe('フロントエンド統合', () => {
  test('UIコンポーネントのレンダリング', () => {
    render(<Home />);
    expect(screen.getByText('GPTブラウザエージェント')).toBeInTheDocument();
    expect(screen.getByText('ブラウザを初期化')).toBeInTheDocument();
  });
  
  test('ユーザー入力', () => {
    render(<Home />);
    const input = screen.getByPlaceholderText('GPTエージェントへの指示を入力してください...');
    fireEvent.change(input, { target: { value: 'Googleで検索してください' } });
    expect(input.value).toBe('Googleで検索してください');
  });
  
  // その他のテストケース...
});
```

### 2.3 エンドツーエンドテスト

#### 2.3.1 基本的なワークフロー
1. ブラウザの初期化
2. タスク指示の入力
3. GPTレスポンスの確認
4. ブラウザ操作の実行
5. 結果の確認

#### 2.3.2 ユーザー介入ワークフロー
1. ブラウザの初期化
2. タスク指示の入力
3. 操作の一時停止
4. ユーザーによる直接操作
5. 操作の再開
6. 結果の確認

#### 2.3.3 承認ワークフロー
1. ブラウザの初期化
2. 承認設定の有効化
3. タスク指示の入力
4. 操作提案の確認
5. 操作の承認/拒否
6. 結果の確認

## 3. テスト環境

### 3.1 開発環境
- Node.js
- Jest（テストフレームワーク）
- Puppeteer（ブラウザ自動化）
- Socket.io-client（WebSocketクライアント）
- React Testing Library（フロントエンドテスト）

### 3.2 テストデータ
- テスト用のURLリスト
- 様々なタイプのタスク指示
- モック応答データ

## 4. バグ修正と改善

### 4.1 バグ修正手順
1. バグの再現
2. 原因の特定
3. 修正の実装
4. テストケースの追加
5. 修正の検証

### 4.2 パフォーマンス改善
- レスポンス時間の測定
- メモリ使用量の監視
- 非効率なコードの最適化

## 5. テスト実行スケジュール

1. 単体テスト
2. 統合テスト
3. エンドツーエンドテスト
4. バグ修正と再テスト
5. パフォーマンステスト
