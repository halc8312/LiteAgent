const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const dotenv = require('dotenv');
const BrowserEngine = require('./browserEngine');
const { getGptResponse, extractBrowserCommand, getGptFeedback } = require('./gptIntegration');
const UserInteractionHandler = require('./userInteractionHandler');

// 環境変数の読み込み
dotenv.config();

// Expressアプリケーションの初期化
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ミドルウェアの設定
app.use(express.json());
app.use(express.static('public'));

// ブラウザエンジンとユーザー操作ハンドラーのインスタンスを保持するオブジェクト
const browserInstances = {};
const userInteractionHandlers = {};

// Socket.io接続の処理
io.on('connection', (socket) => {
  console.log('クライアント接続:', socket.id);
  
  // このソケット接続用のブラウザエンジンを作成
  browserInstances[socket.id] = new BrowserEngine();
  
  // ブラウザ初期化リクエスト
  socket.on('init_browser', async () => {
    try {
      const browserEngine = browserInstances[socket.id];
      const result = await browserEngine.initialize();
      
      if (result.success) {
        // ユーザー操作ハンドラーを初期化
        userInteractionHandlers[socket.id] = new UserInteractionHandler(browserEngine);
        
        // 初期状態を取得
        const state = await browserEngine.getCurrentState();
        socket.emit('browser_initialized', { success: true, state });
      } else {
        socket.emit('browser_initialized', { success: false, error: result.error });
      }
    } catch (error) {
      console.error('ブラウザ初期化エラー:', error);
      socket.emit('browser_initialized', { success: false, error: error.message });
    }
  });
  
  // ユーザーからのタスク指示
  socket.on('execute_task', async (data) => {
    try {
      const browserEngine = browserInstances[socket.id];
      const interactionHandler = userInteractionHandlers[socket.id];
      
      if (!browserEngine || !browserEngine.isInitialized) {
        socket.emit('error', { message: 'ブラウザが初期化されていません。まずブラウザを初期化してください。' });
        return;
      }
      
      // 一時停止中なら実行しない
      if (interactionHandler && interactionHandler.isPausedState()) {
        socket.emit('error', { message: '操作が一時停止中です。再開してから実行してください。' });
        return;
      }
      
      // 現在のブラウザ状態を取得
      const browserState = await browserEngine.getCurrentState();
      
      // タスク実行開始を通知
      socket.emit('task_started', { prompt: data.prompt });
      
      // GPTに指示を送信
      const gptResponse = await getGptResponse(data.prompt, browserState);
      socket.emit('gpt_response', { response: gptResponse });
      
      // GPTの応答からブラウザ操作を抽出
      const command = extractBrowserCommand(gptResponse);
      
      if (command) {
        // 承認が必要な場合
        if (data.requireApproval) {
          socket.emit('command_approval_required', { command });
        } else {
          socket.emit('browser_command', { command });
          
          // ブラウザ操作を実行
          const result = await browserEngine.executeCommand(command);
          
          // 操作結果を送信
          socket.emit('browser_state_update', result);
          
          // GPTにフィードバックを要求
          const feedback = await getGptFeedback(result, data.prompt);
          socket.emit('gpt_feedback', { feedback });
        }
      } else {
        socket.emit('error', { message: 'GPTの応答からブラウザ操作を抽出できませんでした。' });
      }
    } catch (error) {
      console.error('タスク実行エラー:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // ユーザーからの直接操作
  socket.on('user_action', async (data) => {
    try {
      const interactionHandler = userInteractionHandlers[socket.id];
      
      if (!interactionHandler) {
        socket.emit('error', { message: 'ユーザー操作ハンドラーが初期化されていません。まずブラウザを初期化してください。' });
        return;
      }
      
      // ユーザー操作を処理
      const result = await interactionHandler.handleUserAction(data.actionType, data.data);
      
      // 操作結果を送信
      socket.emit('user_action_result', result);
      
      // 状態が変更された場合はブラウザ状態を更新
      if (result.success && result.screenshot) {
        socket.emit('browser_state_update', result);
      }
      
      // 特定の操作結果を送信
      if (result.suggestedActions) {
        socket.emit('suggested_actions', { actions: result.suggestedActions });
      }
      
      if (result.explanation) {
        socket.emit('state_explanation', { explanation: result.explanation });
      }
      
      if (result.analysis) {
        socket.emit('page_analysis', { analysis: result.analysis });
      }
      
      // 操作の一時停止・再開状態を通知
      if (data.actionType === 'pause') {
        socket.emit('operation_paused');
      } else if (data.actionType === 'resume') {
        socket.emit('operation_resumed');
      }
    } catch (error) {
      console.error('ユーザー操作エラー:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // コマンド履歴の取得リクエスト
  socket.on('get_command_history', () => {
    try {
      const interactionHandler = userInteractionHandlers[socket.id];
      
      if (!interactionHandler) {
        socket.emit('error', { message: 'ユーザー操作ハンドラーが初期化されていません。' });
        return;
      }
      
      const history = interactionHandler.getCommandHistory();
      socket.emit('command_history', { history });
    } catch (error) {
      console.error('履歴取得エラー:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // ブラウザ状態の取得リクエスト
  socket.on('get_browser_state', async () => {
    try {
      const browserEngine = browserInstances[socket.id];
      
      if (!browserEngine || !browserEngine.isInitialized) {
        socket.emit('error', { message: 'ブラウザが初期化されていません。まずブラウザを初期化してください。' });
        return;
      }
      
      const state = await browserEngine.getCurrentState();
      socket.emit('browser_state_update', state);
    } catch (error) {
      console.error('状態取得エラー:', error);
      socket.emit('error', { message: error.message });
    }
  });
  
  // 切断処理
  socket.on('disconnect', async () => {
    console.log('クライアント切断:', socket.id);
    
    // ブラウザインスタンスのクリーンアップ
    const browserEngine = browserInstances[socket.id];
    if (browserEngine && browserEngine.isInitialized) {
      await browserEngine.close();
    }
    
    delete browserInstances[socket.id];
    delete userInteractionHandlers[socket.id];
  });
});

// サーバーの起動
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
});

// プロセス終了時のクリーンアップ
process.on('SIGINT', async () => {
  // すべてのブラウザインスタンスを閉じる
  for (const socketId in browserInstances) {
    const browserEngine = browserInstances[socketId];
    if (browserEngine && browserEngine.isInitialized) {
      await browserEngine.close();
    }
  }
  
  process.exit();
});
