import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { initSchema } from './db/database';
import { seedDatabase } from './db/seed';
import { attachSocketServer } from './socket';

import authRoutes from './routes/auth';
import usersRoutes from './routes/users';
import roomsRoutes from './routes/rooms';
import walletRoutes from './routes/wallet';
import storeRoutes from './routes/store';
import tasksRoutes from './routes/tasks';
import agencyRoutes from './routes/agency';
import messagesRoutes from './routes/messages';
import gamesRoutes from './routes/games';
import adminRoutes from './routes/admin';
import momentsRoutes from './routes/moments';
import familiesRoutes from './routes/families';

initSchema();
seedDatabase();

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', app: 'ZoraLive API', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/rooms', roomsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/moments', momentsRoutes);
app.use('/api/families', familiesRoutes);

// Serve built client in production mode if dist exists
const clientDist = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/socket.io')) return next();
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

const httpServer = http.createServer(app);
attachSocketServer(httpServer, config.clientUrl);

httpServer.listen(config.port, () => {
  console.log(`🚀 ZoraLive API + Socket.IO server running on http://localhost:${config.port}`);
});
