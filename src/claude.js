import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `あなたはScrapboxのノート整理アシスタントです。
ユーザーが送ったテキストに対して、Scrapboxのウィキリンク記法（[単語]）を適切に付けて返してください。

ウィキリンクを付けるルール：
- 付ける: 投資銘柄・投資関連のワード、アニメ/漫画/ゲームタイトル、実際に会った人物名
- 付けない: 作中の登場人物・地名、同居家族名、一般的なワード

その他のルール：
- テキストの内容・意味・言葉は一切変えないこと
- リンクを付けるべき単語がなければそのまま返す
- 説明や前置きは不要。加工後のテキストだけを返す`;

export async function addWikiLinks(text) {
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: text }],
  });

  const result = message.content[0].text.trim();
  console.log(`[Claude] "${text}" → "${result}"`);
  return result;
}
