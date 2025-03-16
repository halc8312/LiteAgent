import React, { useState } from 'react';

const UserInteractionControls = ({ onUserAction, connected, browserState }) => {
  const [showApprovalPanel, setShowApprovalPanel] = useState(false);
  const [pendingCommand, setPendingCommand] = useState(null);
  const [userFeedback, setUserFeedback] = useState('');

  // 操作承認パネルを表示
  const showApproval = (command) => {
    setPendingCommand(command);
    setShowApprovalPanel(true);
  };

  // 操作を承認
  const approveAction = () => {
    if (pendingCommand) {
      onUserAction('approve', pendingCommand);
      setShowApprovalPanel(false);
      setPendingCommand(null);
    }
  };

  // 操作を拒否
  const rejectAction = () => {
    if (pendingCommand) {
      onUserAction('reject', pendingCommand);
      setShowApprovalPanel(false);
      setPendingCommand(null);
    }
  };

  // 操作を修正
  const modifyAction = () => {
    if (pendingCommand && userFeedback) {
      onUserAction('modify', { command: pendingCommand, feedback: userFeedback });
      setShowApprovalPanel(false);
      setPendingCommand(null);
      setUserFeedback('');
    }
  };

  return (
    <div className="user-interaction-controls">
      <h3>詳細操作コントロール</h3>
      
      <div className="control-section">
        <div className="control-group">
          <h4>ナビゲーション</h4>
          <div className="button-group">
            <button 
              onClick={() => onUserAction('navigate_back')}
              disabled={!connected}
              className="control-button"
            >
              戻る
            </button>
            <button 
              onClick={() => onUserAction('navigate_forward')}
              disabled={!connected}
              className="control-button"
            >
              進む
            </button>
            <button 
              onClick={() => onUserAction('navigate_home')}
              disabled={!connected}
              className="control-button"
            >
              ホーム
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <h4>ページ操作</h4>
          <div className="button-group">
            <button 
              onClick={() => onUserAction('scroll_up')}
              disabled={!connected}
              className="control-button"
            >
              上スクロール
            </button>
            <button 
              onClick={() => onUserAction('scroll_down')}
              disabled={!connected}
              className="control-button"
            >
              下スクロール
            </button>
            <button 
              onClick={() => onUserAction('capture_screenshot')}
              disabled={!connected}
              className="control-button"
            >
              スクリーンショット
            </button>
          </div>
        </div>
        
        <div className="control-group">
          <h4>GPT制御</h4>
          <div className="button-group">
            <button 
              onClick={() => onUserAction('request_analysis')}
              disabled={!connected}
              className="control-button"
            >
              ページ分析
            </button>
            <button 
              onClick={() => onUserAction('suggest_actions')}
              disabled={!connected}
              className="control-button"
            >
              操作提案
            </button>
            <button 
              onClick={() => onUserAction('explain_current_state')}
              disabled={!connected}
              className="control-button"
            >
              状態説明
            </button>
          </div>
        </div>
      </div>
      
      {/* 操作承認パネル */}
      {showApprovalPanel && pendingCommand && (
        <div className="approval-panel">
          <h4>操作承認</h4>
          <div className="command-details">
            <p><strong>操作タイプ:</strong> {pendingCommand.action}</p>
            <p><strong>パラメータ:</strong> {JSON.stringify(pendingCommand.params)}</p>
            {pendingCommand.reasoning && (
              <p><strong>理由:</strong> {pendingCommand.reasoning}</p>
            )}
          </div>
          
          <div className="feedback-input">
            <textarea
              value={userFeedback}
              onChange={(e) => setUserFeedback(e.target.value)}
              placeholder="操作に対するフィードバックや修正指示を入力..."
              rows={3}
            />
          </div>
          
          <div className="approval-buttons">
            <button 
              onClick={approveAction}
              className="approve-button"
            >
              承認
            </button>
            <button 
              onClick={rejectAction}
              className="reject-button"
            >
              拒否
            </button>
            <button 
              onClick={modifyAction}
              disabled={!userFeedback}
              className="modify-button"
            >
              修正して実行
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        .user-interaction-controls {
          background-color: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          margin-top: 20px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 16px;
          font-size: 16px;
          color: #333;
        }
        
        h4 {
          margin-top: 0;
          margin-bottom: 8px;
          font-size: 14px;
          color: #555;
        }
        
        .control-section {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .control-group {
          flex: 1;
          min-width: 200px;
        }
        
        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .control-button {
          padding: 8px 12px;
          background-color: #e0e0e0;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          color: #333;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .control-button:hover:not(:disabled) {
          background-color: #d0d0d0;
        }
        
        .control-button:disabled {
          background-color: #f0f0f0;
          color: #999;
          cursor: not-allowed;
        }
        
        .approval-panel {
          margin-top: 16px;
          padding: 16px;
          background-color: #fff;
          border: 1px solid #ddd;
          border-radius: 6px;
        }
        
        .command-details {
          background-color: #f5f5f5;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 12px;
        }
        
        .command-details p {
          margin: 6px 0;
          font-size: 14px;
        }
        
        .feedback-input textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
        }
        
        .approval-buttons {
          display: flex;
          gap: 8px;
          margin-top: 12px;
        }
        
        .approve-button {
          padding: 8px 16px;
          background-color: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .approve-button:hover {
          background-color: #388E3C;
        }
        
        .reject-button {
          padding: 8px 16px;
          background-color: #F44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .reject-button:hover {
          background-color: #D32F2F;
        }
        
        .modify-button {
          padding: 8px 16px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .modify-button:hover:not(:disabled) {
          background-color: #1976D2;
        }
        
        .modify-button:disabled {
          background-color: #90CAF9;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default UserInteractionControls;
