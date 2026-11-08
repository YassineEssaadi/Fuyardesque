import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { RoomManager } from './rooms/RoomManager';
import { setupSocketHandlers } from './socket/socketHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 4000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';
const CLIENT_URLS = CLIENT_URL.split(',').map((url) => url.trim()).filter(Boolean);

app.use(
  cors({
    origin: CLIENT_URLS,
    credentials: true,
  })
);

app.use(express.json());

const io = new Server(server, {
  cors: {
    origin: CLIENT_URLS,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

const roomManager = new RoomManager(io);
setupSocketHandlers(io, roomManager);

// API Routes
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    game: 'FUYARDESQUE',
    timestamp: Date.now(),
  });
});

// Production static client serving
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

server.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`  FUYARDESQUE Server running on port ${PORT}`);
  console.log(`  Client URL allowed: ${CLIENT_URL}`);
  console.log(`===============================================`);
});

export { app, server, io, roomManager };
