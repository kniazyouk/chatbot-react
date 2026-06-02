import { Router, type Request, type Response } from 'express';
import { getKnowledgeBase } from '../services/knowledge.js';
import { getGroqResponse } from '../services/groq.js';
import { sendHandoffToDiscord } from '../services/discord.js';
import type { Session, ChatTurn } from '../types/index.js';
import { getIO } from '../socket.js';

const router = Router();

const sessions = new Map<string, Session>();

router.post('/', async (req: Request, res: Response) => {
  const { message, sessionId } = req.body as { message: string; sessionId: string };

  if (!message || !sessionId) {
    res.status(400).json({ error: 'message and sessionId are required' });
    return;
  }

  let session = sessions.get(sessionId);
  if (!session) {
    session = { history: [], handoffStatus: 'none' };
    sessions.set(sessionId, session);
  }

  const knowledgeBase = getKnowledgeBase();

  const result = await getGroqResponse(message, session.history, knowledgeBase);

  const userTurn: ChatTurn = { role: 'user', parts: [{ text: message }] };
  const modelTurn: ChatTurn = { role: 'model', parts: [{ text: result.response }] };
  session.history.push(userTurn, modelTurn);

  if (result.action === 'INITIATE_HANDOFF') {
    session.handoffStatus = 'pending';

    const historyText = session.history
      .map(t => `${t.role === 'user' ? 'Usuario' : 'Bot'}: ${t.parts[0].text}`)
      .join('\n');
    await sendHandoffToDiscord(sessionId, historyText, session.contactInfo);

    res.json({
      response: result.response,
      action: 'HANDOFF_INITIATED' as const,
      sessionId,
    });
    return;
  }

  res.json({
    response: result.response,
    action: result.action,
    sessionId,
  });
});

router.get('/session/:id', (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.json({ exists: false });
    return;
  }
  res.json({
    exists: true,
    handoffStatus: session.handoffStatus,
    history: session.history.slice(-10),
  });
});

export default router;
