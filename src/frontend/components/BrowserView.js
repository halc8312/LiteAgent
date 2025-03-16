import React from 'react';

const BrowserView = ({ browserState }) => {
  const { screenshot, url, title } = browserState;

  return (
    <div className="browser-view-container">
      <h2>ブラウザビュー</h2>
      {screenshot ? (
        <div className="browser-frame">
          <div className="browser-header">
            <div className="browser-controls">
              <span className="control-dot"></span>
              <span className="control-dot"></span>
              <span className="control-dot"></span>
            </div>
            <div className="browser-url-bar">
              <span className="url-text">{url}</span>
            </div>
          </div>
          <div className="browser-content">
            <img 
              src={`data:image/png;base64,${screenshot}`} 
              alt="ブラウザスクリーンショット" 
              className="browser-screenshot"
            />
          </div>
          <div className="browser-footer">
            <span className="page-title">{title}</span>
          </div>
        </div>
      ) : (
        <div className="browser-placeholder">
          <p>ブラウザが初期化されていないか、スクリーンショットがありません</p>
          <p>「ブラウザを初期化」ボタンをクリックしてください</p>
        </div>
      )}

      <style jsx>{`
        .browser-view-container {
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
        
        .browser-frame {
          display: flex;
          flex-direction: column;
          height: 100%;
          background-color: white;
        }
        
        .browser-header {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          background-color: #f1f1f1;
          border-bottom: 1px solid #ddd;
        }
        
        .browser-controls {
          display: flex;
          gap: 6px;
          margin-right: 12px;
        }
        
        .control-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: #ccc;
        }
        
        .control-dot:nth-child(1) {
          background-color: #ff5f57;
        }
        
        .control-dot:nth-child(2) {
          background-color: #ffbd2e;
        }
        
        .control-dot:nth-child(3) {
          background-color: #28ca41;
        }
        
        .browser-url-bar {
          flex: 1;
          background-color: white;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 14px;
          color: #333;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .browser-content {
          flex: 1;
          position: relative;
          overflow: hidden;
        }
        
        .browser-screenshot {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .browser-footer {
          padding: 8px 12px;
          background-color: #f8f8f8;
          border-top: 1px solid #eee;
          font-size: 12px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .browser-placeholder {
          height: 400px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background-color: #f9f9f9;
          color: #666;
          text-align: center;
          padding: 20px;
        }
      `}</style>
    </div>
  );
};

export default BrowserView;
