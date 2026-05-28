import { Router, type Request, type Response } from 'express';
import { getIO } from '../socket.js';

const router = Router();

router.get('/webhook/whatsapp', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verified successfully');
    res.status(200).send(challenge);
  } else {
    console.warn('WhatsApp webhook verification failed');
    res.sendStatus(403);
  }
});

router.post('/webhook/whatsapp', (req: Request, res: Response) => {
  const body = req.body;

  if (body.object !== 'whatsapp_business_account') {
    res.sendStatus(404);
    return;
  }

  const changes = body.entry?.[0]?.changes?.[0];
  const message = changes?.value?.messages?.[0];

  if (!message || message.type !== 'text') {
    res.sendStatus(200);
    return;
  }

  const from = message.from;
  const text = message.text.body;
  const agentNumber = process.env.WHATSAPP_AGENT_NUMBER;

  if (!agentNumber || from !== agentNumber) {
    res.sendStatus(200);
    return;
  }

  if (text.startsWith('/session ')) {
    const sessionId = text.split(' ')[1];
    const agentText = text.slice(`/session ${sessionId} `.length);

    const io = getIO();
    io.to(sessionId).emit('agent-response', { message: agentText });
    console.log(`Forwarded agent response to session ${sessionId}`);
  }

  res.sendStatus(200);
});

export default router;
