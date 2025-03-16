import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';
import BrowserView from '../components/BrowserView';
import OperationLog from '../components/OperationLog';
import GptResponsePanel from '../components/GptResponsePanel';
import UserInputPanel from '../components/UserInputPanel';
import UserInteractionControls from '../components/UserInteractionControls';

export default function Home() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [browserState, setBrowserState] = useState({
    screenshot: null,
    url: '',
    title: ''
  });
  const [operationLogs, setOperationLogs] = useState([]);
  const [gptResponse, setGptResponse] = useState('');
  const [gptFeedback, setGptFeedback] = useState('');
  const [isInitializing, setIsInitializing] = useState(false);
  const [suggestedActions, setSuggestedActions] = useState([]);
  const [requireApproval, setRequireApproval] = useState(true);

  // Socket.io接続の初期化
  useEffect(() => {
    const socketIo = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:3000');
    
    socketIo.on('connect', () => {
      console.log('WebSocket接続確立');
      setConnected(true);
      addLog('info', 'WebSocketサーバーに接続しました');
    });
    
    socketIo.on('disconnect', () => {
      console.log('WebSocket切断');
      setConnected(false);
      addLog('error', 'WebSocketサーバーから切断されました');
    });
    
    socketIo.on('browser_initialized', (data) => {
      setIsInitializing(false);
      if (data.success) {
        addLog('info', 'ブラウザが初期化されました');
        if (data.state) {
          setBrowserState(data.state);
        }
      } else {
        addLog('error', `ブラウザの初期化に失敗しました: ${data.error}`);
      }
    });
    
    socketIo.on('task_started', (data) => {
      addLog('info', `タスク実行開始: ${data.prompt}`);
    });
    
    socketIo.on('gpt_response', (data) => {
      setGptResponse(data.response);
      addLog('gpt', `GPTレスポンス: ${data.response.substring(0, 100)}...`);
    });
    
    socketIo.on('browser_command', (data) => {
      const { command } = data;
      addLog('info', `ブラウザコマンド: ${command.action} - ${JSON.stringify(command.params)}`);
    });
    
    socketIo.on('command_approval_required', (data) => {
      const { command } = data;
      addLog('info', `承認待ちコマンド: ${command.action} - ${JSON.stringify(command.params)}`);
      setSuggestedActions([command]);
    });
    
    socketIo.on('browser_state_update', (data) => {
      setBrowserState({
        screenshot: data.screenshot,
        url: data.url,
        title: data.title,
        content: data.content
      });
      
      if (data.success) {
        addLog('browser', `ブラウザ更新: ${data.url} - ${data.title}`);
      } else if (data.error) {
        addLog('error', `ブラウザ操作エラー: ${data.error}`);
      }
    });
    
    socketIo.on('gpt_feedback', (data) => {
      setGptFeedback(data.feedback);
      addLog('gpt', `GPTフィードバック: ${data.feedback.substring(0, 100)}...`);
    });
    
    socketIo.on('suggested_actions', (data) => {
      setSuggestedActions(data.actions);
      addLog('info', `操作提案: ${data.actions.length}個の提案を受信`);
    });
    
    socketIo.on('state_explanation', (data) => {
      addLog('info', `状態説明: ${data.explanation.substring(0, 100)}...`);
    });
    
    socketIo.on('page_analysis', (data) => {
      addLog('info', `ページ分析完了`);
    });
    
    socketIo.on('operation_paused', () => {
      addLog('info', '操作が一時停止されました');
    });
    
    socketIo.on('operation_resumed', () => {
      addLog('info', '操作が再開されました');
    });
    
    socketIo.on('user_action_result', (data) => {
      if (data.success) {
        addLog('info', `ユーザー操作成功: ${data.actionType}`);
      } else {
        addLog('error', `ユーザー操作エラー: ${data.error}`);
      }
    });
    
    socketIo.on('command_history', (data) => {
      addLog('info', `コマンド履歴取得: ${data.history.length}件`);
    });
    
    socketIo.on('error', (data) => {
      addLog('error', `エラー: ${data.message}`);
    });
    
    setSocket(socketIo);
    
    return () => {
      socketIo.disconnect();
    };
  }, []);
  
  // 操作ログの追加
  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString();
    setOperationLogs(prev => [...prev, { type, timestamp, message }]);
  };
  
  // ブラウザの初期化
  const initializeBrowser = () => {
    if (socket && connected) {
      setIsInitializing(true);
      socket.emit('init_browser');
      addLog('info', 'ブラウザの初期化をリクエスト中...');
    }
  };
  
  // タスクの実行
  const executeTask = (prompt) => {
    if (socket && connected) {
      socket.emit('execute_task', { prompt, requireApproval });
      addLog('user', `ユーザー指示: ${prompt}`);
    }
  };
  
  // ユーザーによる直接操作
  const performUserAction = (actionType, data) => {
    if (socket && connected) {
      socket.emit('user_action', { actionType, data });
      addLog('user', `ユーザー操作: ${actionType}`);
    }
  };
  
  // コマンド履歴の取得
  const getCommandHistory = () => {
    if (socket && connected) {
      socket.emit('get_command_history');
    }
  };
  
  // 承認設定の切り替え
  const toggleApprovalRequired = () => {
    setRequireApproval(!requireApproval);
    addLog('info', `承認設定を${!requireApproval ? '有効' : '無効'}に変更しました`);
  };

  return (
    <div className="container">
      <header className="header">
        <h1>GPTブラウザエージェント</h1>
        <div className="status-bar">
          <span className={`status-indicator ${connected ? 'connected' : 'disconnected'}`}>
            {connected ? '接続済み' : '未接続'}
          </span>
          <button 
            onClick={initializeBrowser} 
            disabled={!connected || isInitializing}
            className="init-button"
          >
            {isInitializing ? 'ブラウザ初期化中...' : 'ブラウザを初期化'}
          </button>
          <div className="approval-toggle">
            <label>
              <input 
                type="checkbox" 
                checked={requireApproval} 
                onChange={toggleApprovalRequired} 
              />
              操作承認を要求
            </label>
          </div>
        </div>
      </header>
      
      <div className="main-content">
        <div className="browser-section">
          <BrowserView browserState={browserState} />
          <UserInteractionControls 
            onUserAction={performUserAction} 
            connected={connected} 
            browserState={browserState}
          />
        </div>
        
        <div className="side-panel">
          <GptResponsePanel response={gptResponse} feedback={gptFeedback} />
          <OperationLog logs={operationLogs} />
        </div>
      </div>
      
      <div className="input-section">
        <UserInputPanel 
          onSubmit={executeTask} 
          onUserAction={performUserAction}
          connected={connected}
        />
      </div>
      
      <style jsx>{`
        .container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        h1 {
          font-size: 24px;
          margin: 0;
        }
        
        .status-bar {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .status-indicator {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
        }
        
        .connected {
          background-color: #4CAF50;
          color: white;
        }
        
        .disconnected {
          background-color: #F44336;
          color: white;
        }
        
        .init-button {
          padding: 8px 16px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .init-button:hover:not(:disabled) {
          background-color: #1976D2;
        }
        
        .init-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .approval-toggle {
          display: flex;
          align-items: center;
          font-size: 14px;
        }
        
        .approval-toggle input {
          margin-right: 6px;
        }
        
        .main-content {
          display: flex;
          gap: 20px;
          margin-bottom: 20px;
        }
        
        .browser-section {
          flex: 3;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .side-panel {
          flex: 2;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .input-section {
          width: 100%;
        }
      `}</style>
    </div>
  );
}
