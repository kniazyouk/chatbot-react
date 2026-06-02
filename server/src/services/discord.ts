import {
  Client,
  GatewayIntentBits,
  TextChannel,
  ThreadAutoArchiveDuration,
} from 'discord.js';

let client: Client | null = null;
const threadToSession = new Map<string, string>();

export async function initDiscordBot(): Promise<void> {
  const token = process.env.DISCORD_BOT_TOKEN;
  const channelId = process.env.DISCORD_CHANNEL_ID;

  if (!token || !channelId) {
    console.warn('Discord not configured. Set DISCORD_BOT_TOKEN and DISCORD_CHANNEL_ID in .env');
    return;
  }

  client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on('ready', () => {
    console.log(`Discord bot logged in as ${client?.user?.tag}`);
    console.log(`Listening for handoffs in channel: ${channelId}`);
  });

  client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.channel.isThread()) return;

    const sessionId = threadToSession.get(message.channel.id);
    if (!sessionId) return;

    const { getIO } = await import('../socket.js');
    const io = getIO();

    io.to(sessionId).emit('agent-response', {
      message: message.content,
    });

    console.log(`Forwarded Discord response to session ${sessionId.slice(0, 8)}...`);
  });

  await client.login(token);
}

export async function sendHandoffToDiscord(
  sessionId: string,
  historyText: string,
  contactInfo?: string,
): Promise<boolean> {
  if (!client) return false;

  const channelId = process.env.DISCORD_CHANNEL_ID;
  if (!channelId) return false;

  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel || !(channel instanceof TextChannel)) {
      console.error(`Discord channel ${channelId} not found or is not a text channel`);
      return false;
    }

    const thread = await channel.threads.create({
      name: `${sessionId.slice(0, 8)}...`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
      reason: `Handoff de sesión ${sessionId}`,
    });

    await thread.send(`🔔 **Nuevo Handoff - Chatbot**
**Sesión:** ${sessionId}
**Contacto:** ${contactInfo || 'No proporcionado'}

**Historial de la conversación:**
${historyText}

---
Responde en este hilo y tu mensaje llegará al usuario en el chat web.`);

    threadToSession.set(thread.id, sessionId);
    console.log(`Created Discord thread for session ${sessionId.slice(0, 8)}...`);
    return true;
  } catch (err) {
    console.error('Failed to send handoff to Discord:', err);
    return false;
  }
}
