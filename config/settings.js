const logger = require('../services/logger');

class BotSettings {
  constructor() {
    this.settings = {
      // Bot Configuration
      bot: {
        name: process.env.BOT_NAME || 'WhatsApp AI Bot',
        version: '1.0.0',
        phoneNumber: process.env.PHONE_NUMBER || '6281212236166',
        ownerJid: process.env.BOT_OWNER_JID || '6281212236166@s.whatsapp.net',
        adminPhone: process.env.ADMIN_PHONE || '6281212236166',
        sessionPath: process.env.WHATSAPP_SESSION_PATH || './session',
        privateOnly: process.env.PRIVATE_CHAT_ONLY !== 'false',
        silentInGroups: process.env.SILENT_IN_GROUPS !== 'false'
      },

      // Features Toggle
      features: {
        aiEnabled: process.env.ENABLE_AI !== 'false', // Default true
        mediaDownload: process.env.ENABLE_MEDIA_DOWNLOAD !== 'false',
        viewOnceForward: process.env.ENABLE_VIEW_ONCE_FORWARD !== 'false', // Default true
        autoViewStatus: process.env.ENABLE_AUTO_VIEW_STATUS !== 'false', // Default true
        typingIndicators: process.env.ENABLE_TYPING_INDICATORS !== 'false' // Default true
      },

      // Rate Limiting
      rateLimit: {
        messages: parseInt(process.env.RATE_LIMIT_MESSAGES) || 10,
        commands: parseInt(process.env.RATE_LIMIT_COMMANDS) || 5,
        media: parseInt(process.env.RATE_LIMIT_MEDIA) || 3,
        ai: parseInt(process.env.RATE_LIMIT_AI) || 8
      },

      // Media Configuration
      media: {
        maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB) || 50,
        tempDir: process.env.TEMP_DIR || './temp',
        youtubeQuality: process.env.YOUTUBE_QUALITY || 'highest',
        tiktokNoWatermark: process.env.TIKTOK_NO_WATERMARK === 'true',
        imageCompressionQuality: parseInt(process.env.IMAGE_COMPRESSION_QUALITY) || 80,
        videoCompressionEnabled: process.env.VIDEO_COMPRESSION_ENABLED === 'true',
        thumbnailSize: parseInt(process.env.THUMBNAIL_SIZE) || 200
      },

      // AI Configuration
      ai: {
        model: 'gemini-1.5-pro',
        apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
        personality: process.env.BOT_PERSONALITY || 'professional,intelligent,comprehensive',
        languageStyle: process.env.BOT_LANGUAGE_STYLE || 'professional',
        defaultLanguage: process.env.DEFAULT_LANGUAGE || 'id',
        maxTokens: parseInt(process.env.AI_MAX_TOKENS) || 2048,
        temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.3,
        systemInstruction: process.env.AI_SYSTEM_INSTRUCTION || 'You are a professional, knowledgeable AI assistant for WhatsApp. Provide comprehensive, accurate, and well-structured responses in Indonesian.',
        safetySettings: {
          threshold: 'BLOCK_MEDIUM_AND_ABOVE'
        }
      },

      // Database Configuration
      database: {
        url: process.env.DATABASE_URL,
        poolMin: parseInt(process.env.DB_POOL_MIN) || 2,
        poolMax: parseInt(process.env.DB_POOL_MAX) || 20,
        poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 20000,
        poolConnectTimeout: parseInt(process.env.DB_POOL_CONNECT_TIMEOUT) || 60000
      },

      // Server Configuration
      server: {
        port: parseInt(process.env.PORT) || 5000,
        host: '0.0.0.0',
        corsOrigin: process.env.CORS_ORIGIN || '*',
        helmetEnabled: process.env.HELMET_ENABLED === 'true',
        sessionSecret: process.env.SESSION_SECRET || 'your-session-secret'
      },

      // Logging Configuration
      logging: {
        level: process.env.LOG_LEVEL || 'info',
        enableDebugLogs: process.env.ENABLE_DEBUG_LOGS === 'true',
        enableProfiling: process.env.ENABLE_PROFILING === 'true',
        enableMetricsEndpoint: process.env.ENABLE_METRICS_ENDPOINT === 'true'
      },

      // Content Filtering
      content: {
        filteringEnabled: process.env.CONTENT_FILTERING_ENABLED === 'true',
        profanityFilter: process.env.PROFANITY_FILTER === 'true',
        spamDetection: process.env.SPAM_DETECTION === 'true',
        maxMessageLength: parseInt(process.env.MAX_MESSAGE_LENGTH) || 4096,
        maxCaptionLength: parseInt(process.env.MAX_CAPTION_LENGTH) || 1024,
        maxFilenameLength: parseInt(process.env.MAX_FILENAME_LENGTH) || 100
      },

      // Performance Configuration
      performance: {
        maxConcurrentDownloads: parseInt(process.env.MAX_CONCURRENT_DOWNLOADS) || 3,
        requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 30000,
        keepAliveTimeout: parseInt(process.env.KEEP_ALIVE_TIMEOUT) || 65000,
        memoryWarningThreshold: parseInt(process.env.MEMORY_USAGE_WARNING_THRESHOLD) || 500
      },

      // Security Configuration
      security: {
        enableHttps: process.env.SSL_ENABLED === 'true',
        sslCertPath: process.env.SSL_CERT_PATH || '',
        sslKeyPath: process.env.SSL_KEY_PATH || '',
        allowCustomCommands: process.env.ALLOW_CUSTOM_COMMANDS === 'true',
        customCommandPrefix: process.env.CUSTOM_COMMAND_PREFIX || '!'
      },

      // Maintenance Configuration
      maintenance: {
        enabled: process.env.MAINTENANCE_MODE === 'true',
        message: process.env.MAINTENANCE_MESSAGE || 'Bot sedang dalam maintenance. Silakan coba lagi nanti.',
        cleanupInterval: parseInt(process.env.CLEANUP_TEMP_FILES_INTERVAL) || 3600,
        logRotationInterval: parseInt(process.env.LOG_ROTATION_INTERVAL) || 86400
      },

      // External Services
      external: {
        discordWebhook: process.env.DISCORD_WEBHOOK || '',
        slackWebhook: process.env.SLACK_WEBHOOK || '',
        telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
        webhookUrl: process.env.WEBHOOK_URL || '',
        sentryDsn: process.env.SENTRY_DSN || ''
      },

      // Analytics & Monitoring
      analytics: {
        enabled: process.env.ANALYTICS_ENABLED === 'true',
        trackCommandUsage: process.env.TRACK_COMMAND_USAGE === 'true',
        trackAiInteractions: process.env.TRACK_AI_INTERACTIONS === 'true',
        trackMediaDownloads: process.env.TRACK_MEDIA_DOWNLOADS === 'true',
        metricsCollectionInterval: parseInt(process.env.METRICS_COLLECTION_INTERVAL) || 300
      },

      // Localization
      localization: {
        timezone: process.env.TIMEZONE || 'Asia/Jakarta',
        dateFormat: 'DD/MM/YYYY HH:mm:ss',
        currency: 'IDR'
      }
    };

    this.validateSettings();
  }

  validateSettings() {
    const required = [
      'bot.phoneNumber',
      'ai.apiKey'
    ];

    const missing = [];

    for (const path of required) {
      const value = this.getSetting(path);
      if (!value || value === '') {
        missing.push(path);
      }
    }

    // Check database URL separately with better validation
    const dbUrl = this.getSetting('database.url') || process.env.DATABASE_URL;
    if (!dbUrl || dbUrl === '' || dbUrl.includes('undefined')) {
      logger.warn('⚠️ Database URL not configured, some features may be limited');
      // Don't add to missing array to prevent blocking
    }

    if (missing.length > 0) {
      logger.warn('⚠️ Missing required settings', { missing });
    }

    // Validate phone number format
    if (this.settings.bot.phoneNumber) {
      const phoneRegex = /^\d{10,15}$/;
      if (!phoneRegex.test(this.settings.bot.phoneNumber)) {
        logger.warn('⚠️ Invalid phone number format', { 
          phoneNumber: this.settings.bot.phoneNumber 
        });
      }
    }

    // Validate owner JID format
    if (this.settings.bot.ownerJid) {
      if (!this.settings.bot.ownerJid.includes('@s.whatsapp.net')) {
        logger.warn('⚠️ Invalid owner JID format', { 
          ownerJid: this.settings.bot.ownerJid 
        });
      }
    }

    logger.info('⚙️ Settings validated successfully');
  }

  getSetting(path) {
    return path.split('.').reduce((obj, key) => obj?.[key], this.settings);
  }

  setSetting(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((obj, key) => obj[key] = obj[key] || {}, this.settings);
    target[lastKey] = value;

    logger.info('⚙️ Setting updated', { path, value });
  }

  getBotConfig() {
    return this.settings.bot;
  }

  getFeatures() {
    return this.settings.features;
  }

  getRateLimit() {
    return this.settings.rateLimit;
  }

  getMediaConfig() {
    return this.settings.media;
  }

  getAiConfig() {
    return this.settings.ai;
  }

  getDatabaseConfig() {
    return this.settings.database;
  }

  getServerConfig() {
    return this.settings.server;
  }

  isFeatureEnabled(feature) {
    return this.settings.features[feature] === true;
  }

  isMaintenanceMode() {
    return this.settings.maintenance.enabled;
  }

  getMaintenanceMessage() {
    return this.settings.maintenance.message;
  }

  // Method untuk update setting dari database
  async updateFromDatabase() {
    try {
      const { getDatabase } = require('./database');
      const { botSettings } = require('../db/schema');

      const db = getDatabase();
      const dbSettings = await db.select().from(botSettings);

      for (const setting of dbSettings) {
        this.setSetting(setting.key, setting.value);
      }

      logger.info('⚙️ Settings updated from database');
    } catch (error) {
      logger.error('💥 Failed to update settings from database', { 
        error: error.message 
      });
    }
  }

  // Method untuk save setting ke database
  async saveToDatabase(key, value, description = '') {
    try {
      const { getDatabase } = require('./database');
      const { botSettings } = require('../db/schema');

      const db = getDatabase();

      await db.insert(botSettings).values({
        key,
        value: value.toString(),
        description
      }).onConflictDoUpdate({
        target: botSettings.key,
        set: {
          value: value.toString(),
          updatedAt: new Date()
        }
      });

      // Update local settings
      this.setSetting(key, value);

      logger.info('⚙️ Setting saved to database', { key, value });
    } catch (error) {
      logger.error('💥 Failed to save setting to database', { 
        error: error.message 
      });
    }
  }

  // Method untuk reset ke default values
  resetToDefaults() {
    logger.warn('🔄 Resetting settings to defaults');
    this.__init__();
  }

  // Method untuk export settings
  exportSettings() {
    return JSON.stringify(this.settings, null, 2);
  }

  // Method untuk import settings
  importSettings(settingsJson) {
    try {
      const imported = JSON.parse(settingsJson);
      this.settings = { ...this.settings, ...imported };
      this.validateSettings();

      logger.info('📥 Settings imported successfully');
    } catch (error) {
      logger.error('💥 Failed to import settings', { 
        error: error.message 
      });
    }
  }

  // Method untuk debugging
  debugSettings() {
    const sensitiveKeys = ['apiKey', 'sessionSecret', 'password', 'token'];

    const safeLogs = JSON.parse(JSON.stringify(this.settings));

    // Hide sensitive information
    const hideSensitive = (obj, path = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          hideSensitive(obj[key], currentPath);
        } else if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
          obj[key] = '***HIDDEN***';
        }
      }
    };

    hideSensitive(safeLogs);

    logger.debug('🐛 Current settings', safeLogs);
    return safeLogs;
  }
}

module.exports = new BotSettings();