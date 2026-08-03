// Carrega variáveis de ambiente de um arquivo .env (opcional), usado para as
// credenciais de OAuth (Google/Microsoft). Nativo do Node, sem dependências.
try { (process as any).loadEnvFile?.(); } catch { /* .env é opcional */ }

import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { initDatabase } from './database.js';
import demandRoutes from './routes/demand.routes.js';
import statsRoutes from './routes/stats.routes.js';
import logsRoutes from './routes/logs.routes.js';
import exportRoutes from './routes/export.js';
import columnRoutes from './routes/column.routes.js';
import authRoutes from './routes/auth.routes.js';
import { requireAuth } from './auth/middleware.js';

import { setWebSocketServer } from './websocket.js';

const PORT = 3001;
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // URL do cliente Vite
  credentials: true, // Permite enviar cookies entre cliente e servidor
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas de autenticação (públicas login/registro/oauth)
app.use('/api/auth', authRoutes);

// Rotas de dados exigem sessão válida (cookie)
app.use('/api/demands', requireAuth, demandRoutes);
app.use('/api/stats', requireAuth, statsRoutes);
app.use('/api/logs', requireAuth, logsRoutes);
app.use('/api/export', requireAuth, exportRoutes);
app.use('/api/columns', requireAuth, columnRoutes);


// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

// Initialize database and start server
async function start() {
  try {
    console.log('🔄 Iniciando banco de dados...');
    await initDatabase();
    console.log('✅ Banco de dados inicializado');

    const server = app.listen(PORT, () => {
      console.log(`✅ API rodando em http://localhost:${PORT}`);
    });

    // WebSocket server for real-time updates
    const wss = new WebSocketServer({ server, path: '/ws' });
    setWebSocketServer(wss);
    console.log('✅ WebSocket rodando em ws://localhost:' + PORT + '/ws');

    wss.on('connection', (ws) => {
      console.log('🔌 Cliente WebSocket conectado');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('📨 Mensagem recebida:', data);

          // Broadcast to all clients
          wss.clients.forEach((client) => {
            if (client.readyState === 1) {
              client.send(JSON.stringify(data));
            }
          });
        } catch (error) {
          console.error('Erro ao processar mensagem WebSocket:', error);
        }
      });

      ws.on('close', () => {
        console.log('🔌 Cliente WebSocket desconectado');
      });

      ws.on('error', (error) => {
        console.error('Erro WebSocket:', error);
      });

      // Send welcome message
      ws.send(JSON.stringify({ type: 'connected', message: 'Conectado ao servidor ARKA' }));
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Encerrando servidor...');
      server.close(() => {
        console.log('✅ Servidor encerrado');
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}

start();
