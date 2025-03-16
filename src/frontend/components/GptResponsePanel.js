import React from 'react';

const GptResponsePanel = ({ response, feedback }) => {
  return (
    <div className="gpt-response-container">
      <h2>GPTレスポンス</h2>
      <div className="response-content">
        {response ? (
          <div className="response-text">
            <h3>操作指示</h3>
            <div className="response-message">{response}</div>
            
            {feedback && (
              <>
                <h3>フィードバック</h3>
                <div className="feedback-message">{feedback}</div>
              </>
            )}
          </div>
        ) : (
          <div className="empty-response">GPTからの応答はまだありません</div>
        )}
      </div>

      <style jsx>{`
        .gpt-response-container {
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
        
        .response-content {
          height: 300px;
          overflow-y: auto;
          background-color: #f9f9f9;
          padding: 16px;
        }
        
        h3 {
          font-size: 14px;
          margin-top: 0;
          margin-bottom: 8px;
          color: #333;
        }
        
        .response-message {
          background-color: #e9f5ff;
          border-left: 4px solid #2196F3;
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 0 4px 4px 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .feedback-message {
          background-color: #f0f7ed;
          border-left: 4px solid #4CAF50;
          padding: 12px;
          border-radius: 0 4px 4px 0;
          font-size: 14px;
          line-height: 1.5;
          white-space: pre-wrap;
        }
        
        .empty-response {
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

export default GptResponsePanel;
