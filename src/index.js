import { Client, GatewayIntentBits, Events } from 'discord.js';
import { appendToDailyNote } from './scrapbox.js';
import { addWikiLinks } from './claude.js';
import { uploadToGyazo } from './gyazo.js';

const required = ['DISCORD_TOKEN', 'DISCORD_CHANNEL_ID', 'SCRAPBOX_PROJECT', 'COSENSE_SID'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;

function getJSTTime() {
  return new Date().toLocaleTimeString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

const discord = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

discord.once(Events.ClientReady, (c) => {
  console.log(`Bot ready: ${c.user.tag}`);
  console.log(`Listening on channel: ${CHANNEL_ID}`);
  console.log(`Scrapbox project: ${process.env.SCRAPBOX_PROJECT}`);
});

discord.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;
  if (message.channelId !== CHANNEL_ID) return;

  const lines = [];

  const text = message.content.trim();
  if (text) {
    const time = getJSTTime();
    const linked = await addWikiLinks(text);
    lines.push(`${time} ${linked}`);
  }

  for (const attachment of message.attachments.values()) {
    if (attachment.contentType?.startsWith('image/')) {
      const gyazoUrl = await uploadToGyazo(attachment.url);
      lines.push(`[${gyazoUrl}]`);
    }
  }

  if (lines.length === 0) return;

  try {
    for (const line of lines) {
      await appendToDailyNote(line);
    }
    await message.react('✅');
  } catch (error) {
    console.error('Failed to append to Scrapbox:', error);
    await message.react('❌');
  }
});

discord.login(process.env.DISCORD_TOKEN);
