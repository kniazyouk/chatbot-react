import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import chatRouter from './routes/chat.js';
import whatsappRouter from './routes/whatsapp.js';
import { setIO } from './socket.js';
import { rateLimit } from './middleware/rateLimit.js';

dotenv.config();

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

app.use('/api', rateLimit(), chatRouter);
app.use('/api', whatsappRouter);

io.on('connection', (socket) => {
  socket.on('join-room', ({ sessionId }: { sessionId: string }) => {
    socket.join(sessionId);
    console.log(`Socket joined room: ${sessionId}`);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Chatbot backend running on http://localhost:${PORT}`);
});
