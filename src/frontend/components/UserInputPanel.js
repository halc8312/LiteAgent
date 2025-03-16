import React, { useState } from 'react';

const UserInputPanel = ({ onSubmit, onUserAction, connected }) => {
  const [userInput, setUserInput] = useState('');

  const handleSubmit = () => {
    if (userInput.trim() && onSubmit) {
      onSubmit(userInput);
      setUserInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  return (
    <div className="user-input-container">
      <h2>指示入力</h2>
      <div className="input-area">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="GPTエージェントへの指示を入力してください..."
          disabled={!connected}
          className="input-textarea"
        />
        <button 
          onClick={handleSubmit} 
          disabled={!connected || !userInput.trim()}
          className="submit-button"
        >
          送信
        </button>
      </div>
      
      <div className="user-controls">
        <h3>ユーザー介入</h3>
        <div className="control-buttons">
          <button 
            onClick={() => onUserAction('pause')}
            disabled={!connected}
            className="control-button pause"
          >
            一時停止
          </button>
          <button 
            onClick={() => onUserAction('resume')}
            disabled={!connected}
            className="control-button resume"
          >
            再開
          </button>
          <button 
            onClick={() => onUserAction('refresh')}
            disabled={!connected}
            className="control-button refresh"
          >
            再読み込み
          </button>
          <button 
            onClick={() => onUserAction('stop')}
            disabled={!connected}
            className="control-button stop"
          >
            停止
          </button>
        </div>
      </div>

      <style jsx>{`
        .user-input-container {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }
        
        h2 {
          background-color: #f5f5f5;
          margin: 0;
          padding: 12px 16px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 16px;
        }
        
        .input-area {
          display: flex;
          padding: 16px;
          background-color: white;
        }
        
        .input-textarea {
          flex: 1;
          height: 100px;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          resize: none;
          font-family: inherit;
          font-size: 14px;
        }
        
        .input-textarea:focus {
          outline: none;
          border-color: #2196F3;
          box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.2);
        }
        
        .input-textarea:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }
        
        .submit-button {
          margin-left: 12px;
          padding: 0 20px;
          background-color: #2196F3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .submit-button:hover:not(:disabled) {
          background-color: #1976D2;
        }
        
        .submit-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .user-controls {
          padding: 16px;
          background-color: #f9f9f9;
          border-top: 1px solid #eee;
        }
        
        h3 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 14px;
          color: #333;
        }
        
        .control-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .control-button {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-size: 13px;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .control-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }
        
        .pause {
          background-color: #FFC107;
          color: #333;
        }
        
        .pause:hover:not(:disabled) {
          background-color: #FFA000;
        }
        
        .resume {
          background-color: #4CAF50;
          color: white;
        }
        
        .resume:hover:not(:disabled) {
          background-color: #388E3C;
        }
        
        .refresh {
          background-color: #9C27B0;
          color: white;
        }
        
        .refresh:hover:not(:disabled) {
          background-color: #7B1FA2;
        }
        
        .stop {
          background-color: #F44336;
          color: white;
        }
        
        .stop:hover:not(:disabled) {
          background-color: #D32F2F;
        }
      `}</style>
    </div>
  );
};

export default UserInputPanel;
