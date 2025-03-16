const { OpenAI } = require('openai');
const dotenv = require('dotenv');

// 環境変数の読み込み
dotenv.config();

// OpenAI APIクライアントの初期化
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * GPTにタスクを送信して応答を得る関数
 * @param {string} prompt - ユーザーからの指示
 * @param {object} browserState - ブラウザの現在の状態情報
 * @returns {Promise<string>} - GPTからの応答テキスト
 */
async function getGptResponse(prompt, browserState) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `あなたはブラウザを操作するAIアシスタントです。ユーザーからの指示に基づいてウェブブラウザを操作し、タスクを実行します。
          
以下の形式でブラウザ操作コマンドを出力してください：
\`\`\`json
{
  "action": "操作タイプ",
  "params": {
    // 操作に必要なパラメータ
  },
  "reasoning": "この操作を選んだ理由"
}
\`\`\`

利用可能な操作タイプ:
1. navigate - URLに移動します
   例: {"action": "navigate", "params": {"url": "https://www.google.com"}}
   
2. click - 指定された要素をクリックします
   例: {"action": "click", "params": {"selector": "button.submit"}}
   
3. type - 指定された要素にテキストを入力します
   例: {"action": "type", "params": {"selector": "input#search", "text": "検索キーワード"}}
   
4. wait - 指定された時間（ミリ秒）待機します
   例: {"action": "wait", "params": {"time": 2000}}
   
5. extract - ページから情報を抽出します
   例: {"action": "extract", "params": {"selector": "div.content"}}

6. scroll - ページをスクロールします
   例: {"action": "scroll", "params": {"direction": "down", "amount": 500}}

操作を決定する際は、現在のブラウザの状態とユーザーの指示を考慮してください。`
        },
        {
          role: "user",
          content: `現在のブラウザの状態:
URL: ${browserState.url || 'なし'}
タイトル: ${browserState.title || 'なし'}
スクリーンショット: ${browserState.screenshot ? '[利用可能]' : '[利用不可]'}
ページコンテンツ: ${browserState.content ? '利用可能' : '利用不可'}

ユーザーの指示: ${prompt}

次に実行すべきブラウザ操作を決定してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 500
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API エラー:', error);
    return JSON.stringify({
      error: "OpenAI APIとの通信中にエラーが発生しました。",
      details: error.message
    });
  }
}

/**
 * GPTの応答からブラウザ操作コマンドを抽出する関数
 * @param {string} response - GPTからの応答テキスト
 * @returns {object|null} - 抽出されたブラウザ操作コマンド、または抽出失敗時はnull
 */
function extractBrowserCommand(response) {
  try {
    // JSONブロックを抽出するための正規表現
    const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
    const match = response.match(jsonRegex);
    
    if (match && match[1]) {
      // 抽出されたJSONをパース
      const command = JSON.parse(match[1]);
      return command;
    }
    
    // JSONブロックが見つからない場合は、テキスト全体をJSONとしてパースを試みる
    try {
      return JSON.parse(response);
    } catch (e) {
      console.warn('応答全体をJSONとしてパースできませんでした:', e);
      
      // 最後の手段として、応答テキストから操作を推測
      if (response.includes('navigate') || response.includes('URL') || response.includes('移動')) {
        // URLを抽出する正規表現を改善
        const urlRegex = /(https?:\/\/[^\s"']+)(?:\s|$|\.|\)|\]|に|を)/;
        const urlMatch = response.match(urlRegex);
        if (urlMatch) {
          return {
            action: "navigate",
            params: { url: urlMatch[1] },
            reasoning: "応答テキストからURLを抽出しました"
          };
        }
      }
      
      // クリック操作の抽出を改善
      if (response.includes('click') || response.includes('クリック')) {
        // 「ログイン」ボタンのような表現からセレクタを抽出
        const buttonMatch = response.match(/「([^」]+)」(?:ボタン|リンク)/);
        if (buttonMatch) {
          return {
            action: "click",
            params: { selector: buttonMatch[1] },
            reasoning: "応答テキストからクリック対象を抽出しました"
          };
        }
      }
      
      // テキスト入力操作の抽出を改善
      if (response.includes('type') || response.includes('入力')) {
        // 「GPT-4 tutorial」のような表現から入力テキストを抽出
        const inputMatch = response.match(/「([^」]+)」と(?:入力|タイプ)/);
        if (inputMatch) {
          return {
            action: "type",
            params: { 
              selector: "input", // デフォルトセレクタ
              text: inputMatch[1] 
            },
            reasoning: "応答テキストから入力テキストを抽出しました"
          };
        }
      }
      
      return null;
    }
  } catch (error) {
    console.error('コマンド抽出エラー:', error);
    return null;
  }
}

/**
 * GPTにブラウザ操作の結果をフィードバックする関数
 * @param {object} result - ブラウザ操作の結果
 * @param {string} originalPrompt - 元のユーザー指示
 * @returns {Promise<string>} - GPTからのフィードバック
 */
async function getGptFeedback(result, originalPrompt) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "あなたはブラウザ操作の結果を評価するAIアシスタントです。操作結果を分析し、次のステップを提案してください。"
        },
        {
          role: "user",
          content: `元のユーザー指示: ${originalPrompt}
          
ブラウザ操作の結果:
URL: ${result.url || 'なし'}
タイトル: ${result.title || 'なし'}
操作成功: ${result.success ? '成功' : '失敗'}
${result.error ? `エラー: ${result.error}` : ''}

この結果を評価し、ユーザーの指示に対する進捗状況と次のステップを提案してください。`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('OpenAI API フィードバックエラー:', error);
    return "操作結果の評価中にエラーが発生しました。";
  }
}

/**
 * GPTにブラウザの視覚的状態を分析させる関数
 * @param {string} screenshot - Base64エンコードされたスクリーンショット
 * @param {string} url - 現在のURL
 * @param {string} title - 現在のページタイトル
 * @returns {Promise<object>} - ページ分析結果
 */
async function analyzePageContent(screenshot, url, title) {
  try {
    // Vision APIを使用してスクリーンショットを分析
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "あなたはウェブページの視覚的内容を分析するAIアシスタントです。スクリーンショットからページの構造、主要要素、操作可能な部分を特定してください。"
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `このウェブページを分析してください:
URL: ${url}
タイトル: ${title}

以下の情報を抽出してください:
1. ページの主要なセクションと内容
2. クリック可能な要素（ボタン、リンクなど）とその位置
3. 入力フィールドとその目的
4. ページの全体的な目的や機能

JSONフォーマットで結果を返してください。`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${screenshot}`
              }
            }
          ]
        }
      ],
      max_tokens: 800
    });
    
    // 応答からJSONを抽出
    const content = response.choices[0].message.content;
    try {
      // JSONブロックを抽出するための正規表現
      const jsonRegex = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/;
      const match = content.match(jsonRegex);
      
      if (match && match[1]) {
        return JSON.parse(match[1]);
      }
      
      // JSONブロックがない場合は全体をJSONとしてパース
      return JSON.parse(content);
    } catch (e) {
      console.warn('ページ分析結果をJSONとしてパースできませんでした:', e);
      return {
        rawAnalysis: content,
        error: "JSON形式での解析に失敗しました"
      };
    }
  } catch (error) {
    console.error('ページ分析エラー:', error);
    return {
      error: "ページ分析中にエラーが発生しました",
      details: error.message
    };
  }
}

module.exports = {
  getGptResponse,
  extractBrowserCommand,
  getGptFeedback,
  analyzePageContent
};
