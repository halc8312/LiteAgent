const puppeteer = require('puppeteer');

/**
 * ブラウザエンジンクラス - Puppeteerを使用したブラウザ操作を管理
 */
class BrowserEngine {
  constructor() {
    this.browser = null;
    this.page = null;
    this.isInitialized = false;
  }

  /**
   * ブラウザを初期化する
   * @returns {Promise<boolean>} 初期化成功時はtrue
   */
  async initialize() {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      this.page = await this.browser.newPage();
      this.isInitialized = true;
      
      // デフォルトのタイムアウトを設定
      await this.page.setDefaultNavigationTimeout(30000);
      await this.page.setDefaultTimeout(30000);
      
      // ビューポートを設定
      await this.page.setViewport({ width: 1280, height: 800 });
      
      return true;
    } catch (error) {
      console.error('ブラウザ初期化エラー:', error);
      this.isInitialized = false;
      return false;
    }
  }

  /**
   * コマンドを実行する
   * @param {object} command - 実行するコマンド
   * @returns {Promise<object>} 実行結果
   */
  async executeCommand(command) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.isInitialized || !this.page) {
      return {
        success: false,
        error: 'ブラウザが初期化されていません'
      };
    }

    try {
      let result = {
        success: true,
        action: command.action
      };

      switch (command.action) {
        case 'navigate':
          await this.page.goto(command.params.url, { waitUntil: 'networkidle2' });
          result = { ...result, ...(await this.getCurrentState()) };
          break;

        case 'click':
          if (command.params.selector) {
            await this.page.click(command.params.selector);
          } else if (command.params.x !== undefined && command.params.y !== undefined) {
            await this.page.mouse.click(command.params.x, command.params.y);
          } else {
            throw new Error('クリック操作にはセレクタまたは座標が必要です');
          }
          result = { ...result, ...(await this.getCurrentState()) };
          break;

        case 'type':
          if (!command.params.selector) {
            throw new Error('テキスト入力操作にはセレクタが必要です');
          }
          await this.page.type(command.params.selector, command.params.text);
          if (command.params.pressEnter) {
            await this.page.keyboard.press('Enter');
          }
          result = { ...result, ...(await this.getCurrentState()) };
          break;

        case 'wait':
          const waitTime = command.params.time || 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          result = { ...result, ...(await this.getCurrentState()) };
          break;

        case 'extract':
          if (!command.params.selector) {
            throw new Error('抽出操作にはセレクタが必要です');
          }
          const extractedContent = await this.page.evaluate((selector) => {
            const element = document.querySelector(selector);
            return element ? element.textContent : null;
          }, command.params.selector);
          result.extractedContent = extractedContent;
          break;

        case 'scroll':
          const direction = command.params.direction || 'down';
          const amount = command.params.amount || 300;
          
          await this.page.evaluate((direction, amount) => {
            if (direction === 'down') {
              window.scrollBy(0, amount);
            } else if (direction === 'up') {
              window.scrollBy(0, -amount);
            } else if (direction === 'left') {
              window.scrollBy(-amount, 0);
            } else if (direction === 'right') {
              window.scrollBy(amount, 0);
            }
          }, direction, amount);
          
          result = { ...result, ...(await this.getCurrentState()) };
          break;

        default:
          return {
            success: false,
            error: `未知の操作タイプ: ${command.action}`
          };
      }

      return result;
    } catch (error) {
      console.error('ブラウザ操作エラー:', error);
      return {
        success: false,
        action: command.action,
        error: error.message
      };
    }
  }

  /**
   * 現在のブラウザの状態を取得する
   * @returns {Promise<object>} ブラウザの状態
   */
  async getCurrentState() {
    if (!this.isInitialized || !this.page) {
      return {
        url: null,
        title: null,
        screenshot: null,
        content: null
      };
    }

    try {
      const url = this.page.url();
      const title = await this.page.title();
      const screenshot = await this.page.screenshot({ encoding: 'base64' });
      const content = await this.page.content();

      return {
        url,
        title,
        screenshot,
        content
      };
    } catch (error) {
      console.error('状態取得エラー:', error);
      return {
        url: null,
        title: null,
        screenshot: null,
        content: null,
        error: error.message
      };
    }
  }

  /**
   * ブラウザを終了する
   * @returns {Promise<boolean>} 終了成功時はtrue
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.isInitialized = false;
      return true;
    }
    return false;
  }
}

module.exports = BrowserEngine;
