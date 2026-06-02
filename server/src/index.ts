import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import { setIO } from './socket.js';
import { rateLimit } from './middleware/rateLimit.js';
import { initDiscordBot } from './services/discord.js';

const startTime = new Date().toISOString();

dotenv.config({ path: '../.env' });

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

setIO(io);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
}));
app.use(express.json());

app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'chatbot-backend',
    uptime: `${Math.floor(process.uptime())}s`,
    started: startTime,
    endpoints: {
      chat: 'POST /api/chat',
      session: 'GET /api/chat/session/:id',
    },
  });
});

app.use('/api/chat', rateLimit(), chatRouter);

io.on('connection', (socket) => {
  socket.on('join-room', ({ sessionId }: { sessionId: string }) => {
    socket.join(sessionId);
    console.log(`Socket joined room: ${sessionId}`);
  });
});

initDiscordBot();

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Chatbot backend running on http://localhost:${PORT}`);
});
