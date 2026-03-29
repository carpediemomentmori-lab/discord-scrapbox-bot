import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const NON_EXISTENT_LINE = '\x00__append_sentinel__\x00';

let mcpClient = null;
let mcpTransport = null;

async function getMcpClient() {
  if (mcpClient) return mcpClient;

  mcpTransport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', 'scrapbox-cosense-mcp'],
    env: {
      ...process.env,
      COSENSE_PROJECT_NAME: process.env.SCRAPBOX_PROJECT,
      COSENSE_SID: process.env.COSENSE_SID,
    },
  });

  mcpClient = new Client(
    { name: 'discord-scrapbox-bot', version: '1.0.0' },
    { capabilities: {} }
  );

  mcpTransport.onclose = () => {
    console.log('MCP connection closed, will reconnect on next request');
    mcpClient = null;
    mcpTransport = null;
  };

  await mcpClient.connect(mcpTransport);
  console.log('MCP client connected to scrapbox-cosense-mcp');
  return mcpClient;
}

function getTodayTitle() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export async function appendToDailyNote(content) {
  const title = getTodayTitle();
  const line = `　・${content}`;

  const client = await getMcpClient();

  // ページ存在確認
  const getResult = await client.callTool({
    name: 'get_page',
    arguments: { pageTitle: title },
  });

  if (getResult.isError) {
    // ページ未作成 → 新規作成
    const createResult = await client.callTool({
      name: 'create_page',
      arguments: {
        pageTitle: title,
        pageBody: line,
        format: 'scrapbox',
      },
    });
    if (createResult.isError) {
      throw new Error(`create_page failed: ${JSON.stringify(createResult.content)}`);
    }
  } else {
    // ページあり → 末尾に追記
    // targetLine に存在しない文字列を指定すると末尾に追記される
    const insertResult = await client.callTool({
      name: 'insert_lines',
      arguments: {
        pageTitle: title,
        targetLine: NON_EXISTENT_LINE,
        text: line,
        format: 'scrapbox',
      },
    });
    if (insertResult.isError) {
      throw new Error(`insert_lines failed: ${JSON.stringify(insertResult.content)}`);
    }
  }

  console.log(`[${title}] Appended: ${line}`);
}
