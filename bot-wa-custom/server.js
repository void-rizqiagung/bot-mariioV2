const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs-extra');
require('dotenv').config();
const logger = require('./services/logger');
const settings = require('./config/settings');
const { initializeDatabase } = require('./config/database');
const bot = require('./bot');
const geminiService = require('./services/gemini');
const cron = require('node-cron');
const scheduleService = require('./services/schedule');
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {

    origin: "*",

    methods: ["GET", "POST"]

  }

});

// Security middleware

app.use(helmet({

  contentSecurityPolicy: {

    directives: {

      defaultSrc: ["'self'"],

      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.replit.com", "https://cdn.jsdelivr.net"],

      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdn.socket.io"],

      imgSrc: ["'self'", "data:", "https:"],

      connectSrc: ["'self'", "ws:", "wss:"]

    }

  }

}));

app.use(cors());

app.use(express.json({ limit: '50mb' }));

app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rate limiting

const limiter = rateLimit({

  windowMs: 15 * 60 * 1000, // 15 minutes

  max: 100, // limit each IP to 100 requests per windowMs

  message: {

    error: 'Too many requests from this IP, please try again later.'

  }

});

app.use('/api', limiter);

// API Routes

app.get('/api/settings', (req, res) => {

  res.json({

    success: true,

    data: settings.debugSettings()

  });

});

app.post('/api/settings/:key', express.json(), async (req, res) => {

  try {

    const { key } = req.params;

    const { value, description } = req.body;

    await settings.saveToDatabase(key, value, description);

    res.json({

      success: true,

      message: 'Setting updated successfully'

    });

  } catch (error) {

    res.status(500).json({

      success: false,

      error: error.message

    });

  }

});

// Static files

app.use(express.static('public'));

// Global bot status

global.botStatus = {

  connected: false,

  qrGenerated: false,

  messagesProcessed: 0,

  errors: 0,

  lastActivity: null,

  startTime: new Date(),

  settings: settings.debugSettings()

};

global.io = io;

// Socket.IO connection handling

io.on('connection', (socket) => {

  logger.info('📱 Dashboard client connected', { socketId: socket.id });

  // Send current bot status

  socket.emit('botStatus', global.botStatus);

  socket.on('disconnect', () => {

    logger.info('📱 Dashboard client disconnected', { socketId: socket.id });

  });

  socket.on('getBotStats', () => {

    socket.emit('botStatus', global.botStatus);

  });

});

// API Routes

app.get('/api/status', (req, res) => {

  res.json({

    success: true,

    status: global.botStatus,

    uptime: process.uptime(),

    memory: process.memoryUsage(),

    timestamp: new Date().toISOString()

  });

});

app.get('/api/logs', async (req, res) => {

  try {

    const logFile = path.join(__dirname, 'logs', 'combined.log');

    if (await fs.pathExists(logFile)) {

      const logs = await fs.readFile(logFile, 'utf8');

      const logLines = logs.split('\n').filter(line => line.trim()).slice(-100);

      res.json({ success: true, logs: logLines });

    } else {

      res.json({ success: true, logs: [] });

    }

  } catch (error) {

    logger.error('❌ Error reading logs', { error: error.message });

    res.status(500).json({ success: false, error: 'Failed to read logs' });

  }

});

app.post('/api/restart', (req, res) => {

  logger.warn('🔄 Bot restart requested via API');

  res.json({ success: true, message: 'Restart initiated' });

  // Restart bot process

  setTimeout(() => {

    process.exit(1);

  }, 1000);

});

// Health check endpoint

app.get('/health', async (req, res) => {

  try {

    const DatabaseHealth = require('./utils/dbHealth');

    const dbHealth = await DatabaseHealth.runHealthCheck();

    res.json({

      status: 'healthy',

      timestamp: new Date().toISOString(),

      uptime: process.uptime(),

      bot: global.botStatus,

      database: dbHealth

    });

  } catch (error) {

    res.status(500).json({

      status: 'unhealthy',

      timestamp: new Date().toISOString(),

      error: error.message,

      bot: global.botStatus

    });

  }

});

// Error handling middleware

app.use((error, req, res, next) => {

  logger.error('🚨 Express error', {

    error: error.message,

    stack: error.stack,

    url: req.url,

    method: req.method

  });

  res.status(500).json({

    success: false,

    error: 'Internal server error',

    timestamp: new Date().toISOString()

  });

});

// 404 handler

app.use((req, res) => {

  res.status(404).json({

    success: false,

    error: 'Endpoint not found',

    timestamp: new Date().toISOString()

  });

});

async function startServer() {

  const serverConfig = settings.getServerConfig();

  const PORT = serverConfig.port;

  server.listen(PORT, serverConfig.host, async () => {

    logger.info(`🌐 Dashboard available at http://${serverConfig.host}:${PORT}`);

    logger.info('⚙️ Bot settings loaded', {

      botName: settings.getSetting('bot.name'),

      privateOnly: settings.getSetting('bot.privateOnly'),

      aiEnabled: settings.isFeatureEnabled('aiEnabled')

    });

    try {

      // --- PERBAIKAN UTAMA ADA DI SINI ---

      // 1. Inisialisasi Database terlebih dahulu

      await initializeDatabase();

      logger.info('✅ Database initialized successfully');

      // 2. BARU update settings dari database setelah koneksi siap

      await settings.updateFromDatabase();

      // Initialize Gemini AI

      geminiService.initialize();

      // Initialize WhatsApp bot

      await bot.initialize();

    } catch (error) {

      logger.error('💥 Failed to initialize services', { error: error.message });

      process.exit(1);

    }

  });

}

// Graceful shutdown

process.on('SIGTERM', () => {

  logger.info('🛑 SIGTERM received, shutting down gracefully');

  server.close(() => {

    logger.info('✅ Server closed');

    process.exit(0);

  });

});

process.on('SIGINT', () => {

  logger.info('🛑 SIGINT received, shutting down gracefully');

  server.close(() => {

    logger.info('✅ Server closed');

    process.exit(0);

  });

});

// Handle uncaught exceptions

process.on('uncaughtException', (error) => {

  logger.error('💥 Uncaught Exception', {

    error: error.message,

    stack: error.stack

  });

  process.exit(1);

});

process.on('unhandledRejection', (reason, promise) => {

  logger.error('💥 Unhandled Rejection', {

    reason: reason.toString(),

    promise: promise.toString()

  });

  process.exit(1);

});

cron.schedule('0 5 * * *', () => {
  logger.info('⏰ Waktunya mengirim jadwal harian...');
    scheduleService.sendDailySchedule();
    
}, {
  scheduled: true,
  timezone: "Asia/Jakarta"
});

logger.info('✅ Penjadwal pesan harian (cron job) berhasil diaktifkan.');

startServer();

module.exports = { app, server, io };