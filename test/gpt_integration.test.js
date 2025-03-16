const { extractBrowserCommand } = require('../src/backend/gptIntegration');

describe('GPT統合', () => {
  test('コマンド抽出 - JSON形式', () => {
    const response = '```json\n{"action":"navigate","params":{"url":"https://www.google.com"},"reasoning":"検索エンジンにアクセスするため"}\n```';
    const command = extractBrowserCommand(response);
    expect(command).toEqual({
      action: 'navigate',
      params: { url: 'https://www.google.com' },
      reasoning: '検索エンジンにアクセスするため'
    });
  });
  
  test('コマンド抽出 - テキスト内のJSON', () => {
    const response = 'ブラウザを操作するために、以下のコマンドを実行します：\n\n```json\n{"action":"click","params":{"selector":"button.submit"},"reasoning":"フォームを送信するため"}\n```\n\nこれによりフォームが送信されます。';
    const command = extractBrowserCommand(response);
    expect(command).toEqual({
      action: 'click',
      params: { selector: 'button.submit' },
      reasoning: 'フォームを送信するため'
    });
  });
  
  test('コマンド抽出 - 直接JSON', () => {
    const response = '{"action":"type","params":{"selector":"input#search","text":"OpenAI"},"reasoning":"検索キーワードを入力するため"}';
    const command = extractBrowserCommand(response);
    expect(command).toEqual({
      action: 'type',
      params: { selector: 'input#search', text: 'OpenAI' },
      reasoning: '検索キーワードを入力するため'
    });
  });
  
  test('コマンド抽出 - テキスト形式（URL）', () => {
    const response = 'URLをhttps://www.openai.comに移動します。OpenAIのウェブサイトを確認するためです。';
    const command = extractBrowserCommand(response);
    expect(command.action).toBe('navigate');
    // 正規表現でURLを抽出しているため、完全一致ではなくURLが含まれているかをチェック
    expect(command.params.url).toContain('https://www.openai.com');
    expect(command.reasoning).toContain('抽出しました');
  });
  
  test('コマンド抽出 - テキスト形式（クリック）', () => {
    const response = '「ログイン」ボタンをクリックしてください。ユーザーアカウントにアクセスするためです。';
    const command = extractBrowserCommand(response);
    expect(command.action).toBe('click');
    expect(command.params.selector).toContain('ログイン');
    expect(command.reasoning).toContain('抽出しました');
  });
  
  test('コマンド抽出 - テキスト形式（入力）', () => {
    const response = '検索ボックスに「GPT-4 tutorial」と入力してください。チュートリアルを検索するためです。';
    const command = extractBrowserCommand(response);
    expect(command.action).toBe('type');
    expect(command.params.text).toContain('GPT-4 tutorial');
    expect(command.reasoning).toContain('抽出しました');
  });
  
  test('コマンド抽出 - 無効な応答', () => {
    const response = 'すみません、どのように操作すればよいかわかりません。';
    const command = extractBrowserCommand(response);
    expect(command).toBeNull();
  });
});
