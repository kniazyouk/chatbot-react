const API_VERSION = 'v21.0';
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;

function getConfig() {
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneId || !accessToken) {
    return null;
  }

  return { phoneId, accessToken };
}

export async function sendWhatsAppMessage(to: string, text: string): Promise<boolean> {
  const config = getConfig();

  if (!config) {
    console.warn('WhatsApp not configured. Set WHATSAPP_PHONE_ID and WHATSAPP_ACCESS_TOKEN in .env');
    return false;
  }

  const url = `${BASE_URL}/${config.phoneId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: text },
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('WhatsApp API error:', result);
      return false;
    }

    return true;
  } catch (e) {
    console.error('Failed to send WhatsApp message:', e);
    return false;
  }
}

export function formatHandoffMessage(sessionId: string, historyText: string): string {
  return `🔔 *Nuevo Handoff - Chatbot*
*Sesión:* ${sessionId.slice(0, 8)}...
*Conversación:*
${historyText}

Responde a este mensaje y la respuesta llegará al usuario en el chat web.`;
}
