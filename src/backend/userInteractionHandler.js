const { getGptResponse, getGptFeedback, analyzePageContent } = require('./gptIntegration');

/**
 * ユーザー操作ハンドラークラス - ユーザーからの操作リクエストを処理
 */
class UserInteractionHandler {
  constructor(browserEngine) {
    this.browserEngine = browserEngine;
    this.pendingCommands = [];
    this.commandHistory = [];
    this.isPaused = false;
  }

  /**
   * ユーザー操作を処理する
   * @param {string} actionType - 操作タイプ
   * @param {object} data - 操作データ
   * @returns {Promise<object>} 処理結果
   */
  async handleUserAction(actionType, data) {
    // ブラウザが初期化されていない場合のチェック（特定の操作は初期化なしでも実行可能）
    const noInitRequiredActions = ['pause', 'resume', 'stop'];
    if (!this.browserEngine || !this.browserEngine.isInitialized) {
      if (!noInitRequiredActions.includes(actionType)) {
        return {
          success: false,
          error: 'ブラウザが初期化されていません'
        };
      }
    }

    try {
      let result = {
        success: true,
        actionType
      };

      switch (actionType) {
        // ナビゲーション操作
        case 'navigate_back':
          await this.browserEngine.page.goBack();
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        case 'navigate_forward':
          await this.browserEngine.page.goForward();
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        case 'navigate_home':
          await this.browserEngine.executeCommand({
            action: 'navigate',
            params: { url: 'https://www.google.com' }
          });
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        // ページ操作
        case 'scroll_up':
          await this.browserEngine.executeCommand({
            action: 'scroll',
            params: { direction: 'up', amount: 300 }
          });
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        case 'scroll_down':
          await this.browserEngine.executeCommand({
            action: 'scroll',
            params: { direction: 'down', amount: 300 }
          });
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        case 'capture_screenshot':
          result = { ...result, ...(await this.browserEngine.getCurrentState()) };
          break;

        // GPT制御
        case 'request_analysis':
          const state = await this.browserEngine.getCurrentState();
          try {
            const analysis = await analyzePageContent(
              state.screenshot,
              state.url,
              state.title
            );
            result.analysis = analysis;
            result = { ...result, ...state };
          } catch (error) {
            console.error('分析エラー:', error);
            result.success = false;
            result.error = `ページ分析中にエラーが発生しました: ${error.message}`;
          }
          break;

        case 'suggest_actions':
          const browserState = await this.browserEngine.getCurrentState();
          try {
            const suggestedActions = await this.getSuggestedActions(browserState);
            result.suggestedActions = suggestedActions;
            result = { ...result, ...browserState };
          } catch (error) {
            console.error('操作提案エラー:', error);
            result.success = false;
            result.error = `操作提案の取得中にエラーが発生しました: ${error.message}`;
          }
          break;

        case 'explain_current_state':
          const currentState = await this.browserEngine.getCurrentState();
          try {
            const explanation = await this.getStateExplanation(currentState);
            result.explanation = explanation;
            result = { ...result, ...currentState };
          } catch (error) {
            console.error('状態説明エラー:', error);
            result.success = false;
            result.error = `状態説明の取得中にエラーが発生しました: ${error.message}`;
          }
          break;

        // 操作制御
        case 'pause':
          this.isPaused = true;
          break;

        case 'resume':
          this.isPaused = false;
          break;

        case 'stop':
          this.pendingCommands = [];
          break;

        // 承認システム
        case 'approve':
          if (data) {
            try {
              await this.executeApprovedCommand(data);
              this.commandHistory.push({
                command: data,
                timestamp: new Date(),
                approved: true
              });
              result = { ...result, ...(await this.browserEngine.getCurrentState()) };
            } catch (error) {
              console.error('コマンド実行エラー:', error);
              result.success = false;
              result.error = `コマンド実行中にエラーが発生しました: ${error.message}`;
            }
          } else {
            result.success = false;
            result.error = 'コマンドデータが提供されていません';
          }
          break;

        case 'reject':
          if (data) {
            this.commandHistory.push({
              command: data,
              timestamp: new Date(),
              approved: false
            });
          } else {
            result.success = false;
            result.error = 'コマンドデータが提供されていません';
          }
          break;

        case 'modify':
          if (data && data.command && data.feedback) {
            try {
              const modifiedCommand = await this.getModifiedCommand(
                data.command,
                data.feedback
              );
              await this.executeApprovedCommand(modifiedCommand);
              this.commandHistory.push({
                command: modifiedCommand,
                originalCommand: data.command,
                feedback: data.feedback,
                timestamp: new Date(),
                modified: true
              });
              result.modifiedCommand = modifiedCommand;
              result = { ...result, ...(await this.browserEngine.getCurrentState()) };
            } catch (error) {
              console.error('コマンド修正エラー:', error);
              result.success = false;
              result.error = `コマンド修正中にエラーが発生しました: ${error.message}`;
            }
          } else {
            result.success = false;
            result.error = 'コマンドデータまたはフィードバックが提供されていません';
          }
          break;

        // 履歴操作
        case 'replay_command':
          if (data && data.commandIndex !== undefined) {
            const command = this.commandHistory[data.commandIndex]?.command;
            if (command) {
              try {
                await this.executeApprovedCommand(command);
                result.replayedCommand = command;
                result = { ...result, ...(await this.browserEngine.getCurrentState()) };
              } catch (error) {
                console.error('コマンド再実行エラー:', error);
                result.success = false;
                result.error = `コマンド再実行中にエラーが発生しました: ${error.message}`;
              }
            } else {
              result.success = false;
              result.error = '指定されたコマンドが履歴に存在しません';
            }
          } else {
            result.success = false;
            result.error = 'コマンドインデックスが提供されていません';
          }
          break;

        default:
          return {
            success: false,
            error: `未知の操作タイプ: ${actionType}`
          };
      }

      // 操作後の状態を取得（一部の操作では既に取得済み）
      if (!result.screenshot && ['pause', 'resume', 'stop'].includes(actionType) === false) {
        const state = await this.browserEngine.getCurrentState();
        return { ...result, ...state };
      }
      
      return result;
    } catch (error) {
      console.error('ユーザー操作エラー:', error);
      return {
        success: false,
        actionType,
        error: error.message
      };
    }
  }

  /**
   * 承認されたコマンドを実行する
   * @param {object} command - 実行するコマンド
   * @returns {Promise<object>} 実行結果
   */
  async executeApprovedCommand(command) {
    return await this.browserEngine.executeCommand(command);
  }

  /**
   * GPTに現在の状態に基づいた操作提案を要求する
   * @param {object} browserState - ブラウザの現在の状態
   * @returns {Promise<Array>} 提案された操作のリスト
   */
  async getSuggestedActions(browserState) {
    try {
      const prompt = `現在表示されているウェブページを分析し、次に実行可能な操作を3つ提案してください。
URL: ${browserState.url}
タイトル: ${browserState.title}

各提案は以下の形式でJSON配列として返してください：
[
  {
    "action": "操作タイプ",
    "params": { /* パラメータ */ },
    "description": "この操作の説明",
    "reasoning": "この操作を提案する理由"
  },
  // 他の提案...
]`;

      const response = await getGptResponse(prompt, browserState);
      
      // JSONを抽出
      const jsonRegex = /```(?:json)?\s*(\[[\s\S]*?\])\s*```/;
      const match = response.match(jsonRegex);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      
      // JSONブロックがない場合は全体をJSONとしてパース
      try {
        return JSON.parse(response);
      } catch (e) {
        console.warn('提案をJSONとしてパースできませんでした:', e);
        return [
          {
            action: "error",
            params: {},
            description: "提案の解析に失敗しました",
            reasoning: "GPTの応答をJSONとして解析できませんでした"
          }
        ];
      }
    } catch (error) {
      console.error('操作提案エラー:', error);
      return [
        {
          action: "error",
          params: {},
          description: "提案の取得に失敗しました",
          reasoning: error.message
        }
      ];
    }
  }

  /**
   * GPTに現在の状態の説明を要求する
   * @param {object} browserState - ブラウザの現在の状態
   * @returns {Promise<string>} 状態の説明
   */
  async getStateExplanation(browserState) {
    try {
      const prompt = `現在表示されているウェブページの状態を簡潔に説明してください。
URL: ${browserState.url}
タイトル: ${browserState.title}

以下の情報を含めてください：
1. ページの主な目的
2. 主要なコンテンツ要素
3. 利用可能な操作（リンク、ボタン、フォームなど）
4. ユーザーが次に取るべき可能性のある行動`;

      const response = await getGptResponse(prompt, browserState);
      return response;
    } catch (error) {
      console.error('状態説明エラー:', error);
      return `状態の説明を取得できませんでした: ${error.message}`;
    }
  }

  /**
   * GPTにユーザーフィードバックに基づいてコマンドを修正させる
   * @param {object} originalCommand - 元のコマンド
   * @param {string} feedback - ユーザーからのフィードバック
   * @returns {Promise<object>} 修正されたコマンド
   */
  async getModifiedCommand(originalCommand, feedback) {
    try {
      const prompt = `以下のブラウザ操作コマンドをユーザーのフィードバックに基づいて修正してください。

元のコマンド:
\`\`\`json
${JSON.stringify(originalCommand, null, 2)}
\`\`\`

ユーザーフィードバック:
${feedback}

修正したコマンドをJSON形式で返してください。`;

      const response = await getGptResponse(prompt, {});
      
      // JSONを抽出
      const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      const match = response.match(jsonRegex);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      
      // JSONブロックがない場合は全体をJSONとしてパース
      try {
        return JSON.parse(response);
      } catch (e) {
        console.warn('修正コマンドをJSONとしてパースできませんでした:', e);
        return originalCommand; // 解析に失敗した場合は元のコマンドを返す
      }
    } catch (error) {
      console.error('コマンド修正エラー:', error);
      return originalCommand; // エラーの場合は元のコマンドを返す
    }
  }

  /**
   * コマンド履歴を取得する
   * @returns {Array} コマンド履歴
   */
  getCommandHistory() {
    return this.commandHistory;
  }

  /**
   * 一時停止状態を取得する
   * @returns {boolean} 一時停止状態
   */
  isPausedState() {
    return this.isPaused;
  }
}

module.exports = UserInteractionHandler;
