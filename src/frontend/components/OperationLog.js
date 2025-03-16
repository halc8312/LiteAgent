import React from 'react';

const OperationLog = ({ logs }) => {
  return (
    <div className="operation-log-container">
      <h2>操作ログ</h2>
      <div className="log-content">
        {logs.length > 0 ? (
          logs.map((log, index) => (
            <div key={index} className={`log-entry ${log.type}`}>
              <span className="timestamp">{log.timestamp}</span>
              <span className="log-message">{log.message}</span>
            </div>
          ))
        ) : (
          <div className="empty-log">操作ログはまだありません</div>
        )}
      </div>

      <style jsx>{`
        .operation-log-container {
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          margin-bottom: 20px;
        }
        
        h2 {
          background-color: #f5f5f5;
          margin: 0;
          padding: 12px 16px;
          border-bottom: 1px solid #e0e0e0;
          font-size: 16px;
        }
        
        .log-content {
          height: 300px;
          overflow-y: auto;
          background-color: #1e1e1e;
          color: #f0f0f0;
          padding: 10px;
          font-family: 'Consolas', 'Monaco', monospace;
          font-size: 14px;
        }
        
        .log-entry {
          margin-bottom: 8px;
          padding: 6px 8px;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
        }
        
        .timestamp {
          color: #888;
          font-size: 12px;
          margin-bottom: 2px;
        }
        
        .log-message {
          word-break: break-word;
        }
        
        .user {
          background-color: #2d3748;
        }
        
        .gpt {
          background-color: #2c5282;
        }
        
        .browser {
          background-color: #285e61;
        }
        
        .error {
          background-color: #742a2a;
        }
        
        .info {
          background-color: #2a4365;
        }
        
        .empty-log {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100%;
          color: #666;
        }
      `}</style>
    </div>
  );
};

export default OperationLog;
