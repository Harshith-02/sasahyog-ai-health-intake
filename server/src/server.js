import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { config, validateEnv } from './config/env.js';
import { handleWebSocketConnection } from './websocket/callHandler.js';

// Validate environment variables on startup
validateEnv();

const app = express();
app.use(cors({ origin: config.clientOrigin }));
app.use(express.json());

// Basic HTTP health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Sasahyog AI Health Intake Backend',
    timestamp: new Date().toISOString(),
    env: {
      openaiConfigured: Boolean(config.openaiApiKey),
      deepgramConfigured: Boolean(config.deepgramApiKey)
    }
  });
});

const server = http.createServer(app);

// Attach WebSocket server
const wss = new WebSocketServer({ server });

const handleServerError = (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [ERROR] Port ${config.port} is currently in use by another process.`);
    console.error(`👉 Please run: npx kill-port ${config.port} (or taskkill /F /IM node.exe on Windows)\n`);
    process.exit(1);
  } else {
    console.error('[Server Error]:', err);
  }
};

server.on('error', handleServerError);
wss.on('error', handleServerError);

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[Server] New WebSocket connection established from ${ip}`);
  handleWebSocketConnection(ws);
});

server.listen(config.port, () => {
  console.log(`\n🚀 Sasahyog AI Health Server running at http://localhost:${config.port}`);
  console.log(`🔌 WebSocket server listening on ws://localhost:${config.port}\n`);
});


