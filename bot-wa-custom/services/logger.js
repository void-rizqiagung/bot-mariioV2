const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const { Signale } = require('signale');

// Simple color functions to replace chalk
const colors = {
  gray: (text) => `\x1b[90m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`
};
const path = require('path');
const fs = require('fs-extra');

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '..', 'logs');
    this.setupLogDirectory();
    this.setupWinston();
    this.setupSignale();
    this.setupConsoleLogger();
  }

  async setupLogDirectory() {
    try {
      await fs.ensureDir(this.logDir);
    } catch (error) {
      console.error('Failed to create log directory:', error);
    }
  }

  setupWinston() {
    // Custom format with colors and emojis
    const customFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.json()
    );

    const consoleFormat = winston.format.combine(
      winston.format.timestamp({ format: 'HH:mm:ss' }),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        const emoji = this.getLevelEmoji(level);
        const coloredLevel = this.getColoredLevel(level);
        const metaStr = Object.keys(meta).length ? colors.gray(JSON.stringify(meta, null, 2)) : '';
        
        return `${colors.gray(timestamp)} ${emoji} ${coloredLevel} ${message} ${metaStr}`;
      })
    );

    this.winston = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: customFormat,
      transports: [
        // Console transport with colors
        new winston.transports.Console({
          format: consoleFormat,
          silent: process.env.NODE_ENV === 'test'
        }),

        // Rotating file for all logs
        new DailyRotateFile({
          filename: path.join(this.logDir, 'combined-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: customFormat
        }),

        // Rotating file for errors only
        new DailyRotateFile({
          filename: path.join(this.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '30d',
          format: customFormat
        })
      ],
      exitOnError: false
    });

    // Handle winston errors
    this.winston.on('error', (error) => {
      console.error('Logger error:', error);
    });
  }

  setupSignale() {
    this.signale = new Signale({
      disabled: false,
      interactive: false,
      scope: 'whatsapp-bot',
      types: {
        success: {
          badge: '✅',
          color: 'green',
          label: 'success'
        },
        error: {
          badge: '❌',
          color: 'red',
          label: 'error'
        },
        warn: {
          badge: '⚠️',
          color: 'yellow',
          label: 'warn'
        },
        info: {
          badge: 'ℹ️',
          color: 'blue',
          label: 'info'
        },
        debug: {
          badge: '🐛',
          color: 'gray',
          label: 'debug'
        },
        message: {
          badge: '📨',
          color: 'cyan',
          label: 'message'
        },
        ai: {
          badge: '🤖',
          color: 'magenta',
          label: 'ai'
        },
        whatsapp: {
          badge: '📱',
          color: 'green',
          label: 'whatsapp'
        },
        download: {
          badge: '⬇️',
          color: 'blue',
          label: 'download'
        }
      }
    });
  }

  setupConsoleLogger() {
    // Beautiful startup banner
    this.showStartupBanner();
  }

  showStartupBanner() {
    const banner = `
${colors.green('┌')}${colors.green('─'.repeat(60))}${colors.green('┐')}
${colors.green('│')} ${colors.bold('🤖 WhatsApp AI Bot with Gemini & PostgreSQL')} ${colors.green('│')}
${colors.green('│')} ${colors.gray('Advanced logging, private chat only, AI-powered')} ${colors.green('│')}
${colors.green('│')} ${colors.blue('Version: 1.0.0')} ${' '.repeat(38)} ${colors.green('│')}
${colors.green('└')}${colors.green('─'.repeat(60))}${colors.green('┘')}
    `;
    
    console.log(banner);
    
    this.info('🚀 Starting WhatsApp Bot...');
    this.debug('🔧 Debug mode enabled');
  }

  getLevelEmoji(level) {
    const emojis = {
      error: '❌',
      warn: '⚠️',
      info: 'ℹ️',
      debug: '🐛',
      verbose: '📝'
    };
    return emojis[level] || 'ℹ️';
  }

  getColoredLevel(level) {
    const levelColors = {
      error: colors.red(colors.bold('ERROR')),
      warn: colors.yellow(colors.bold('WARN ')),
      info: colors.blue(colors.bold('INFO ')),
      debug: colors.gray(colors.bold('DEBUG')),
      verbose: colors.magenta(colors.bold('VERB '))
    };
    return levelColors[level] || colors.blue(colors.bold(level.toUpperCase()));
  }

  // Main logging methods
  error(message, meta = {}) {
    this.winston.error(message, meta);
    if (process.env.NODE_ENV !== 'test') {
      this.signale.error(message);
    }
  }

  warn(message, meta = {}) {
    this.winston.warn(message, meta);
    if (process.env.NODE_ENV !== 'test') {
      this.signale.warn(message);
    }
  }

  info(message, meta = {}) {
    this.winston.info(message, meta);
    if (process.env.NODE_ENV !== 'test') {
      this.signale.info(message);
    }
  }

  debug(message, meta = {}) {
    this.winston.debug(message, meta);
    if (process.env.LOG_LEVEL === 'debug' && process.env.NODE_ENV !== 'test') {
      this.signale.debug(message);
    }
  }

  success(message, meta = {}) {
    this.winston.info(message, meta);
    if (process.env.NODE_ENV !== 'test') {
      this.signale.success(message);
    }
  }

  // Child method for Baileys compatibility
  child(bindings) {
    // Return a simplified logger for Baileys
    return {
      info: () => {}, // Silent for Baileys
      debug: () => {}, // Silent for Baileys
      warn: () => {}, // Silent for Baileys
      error: () => {}, // Silent for Baileys
      trace: () => {}, // Silent for Baileys
      child: () => this.child(bindings) // Return another silent logger
    };
  }

  // Add trace method for Baileys compatibility
  trace(message, meta = {}) {
    this.winston.debug(message, meta);
  }

  // Specialized logging methods
  message(direction, chatId, content, meta = {}) {
    const logMessage = `${direction} message: ${chatId}`;
    this.winston.info(logMessage, { content, ...meta });
    
    if (process.env.NODE_ENV !== 'test') {
      const emoji = direction === 'incoming' ? '📥' : '📤';
      console.log(`${colors.gray(new Date().toLocaleTimeString())} ${emoji} ${colors.cyan('MESSAGE')} ${logMessage}`);
    }
  }

  ai(prompt, response, meta = {}) {
    const logMessage = `AI interaction: ${prompt.substring(0, 50)}...`;
    this.winston.info(logMessage, { prompt, response, ...meta });
    
    if (process.env.NODE_ENV !== 'test') {
      this.signale.ai(`Generated response (${meta.responseTime}ms)`);
    }
  }

  whatsapp(event, data = {}) {
    const logMessage = `WhatsApp event: ${event}`;
    this.winston.info(logMessage, data);
    
    if (process.env.NODE_ENV !== 'test') {
      this.signale.whatsapp(logMessage);
    }
  }

  download(platform, url, result, meta = {}) {
    const logMessage = `${platform} download: ${result ? 'success' : 'failed'}`;
    this.winston.info(logMessage, { url, result, ...meta });
    
    if (process.env.NODE_ENV !== 'test') {
      this.signale.download(logMessage);
    }
  }

  // Performance logging
  startTimer(label) {
    return {
      label,
      startTime: Date.now(),
      end: () => {
        const duration = Date.now() - this.startTime;
        this.debug(`⏱️ ${label} completed in ${duration}ms`, { duration });
        return duration;
      }
    };
  }

  // Memory usage logging
  logMemoryUsage() {
    const usage = process.memoryUsage();
    const formatBytes = (bytes) => (bytes / 1024 / 1024).toFixed(2) + 'MB';
    
    this.debug('💾 Memory usage', {
      rss: formatBytes(usage.rss),
      heapTotal: formatBytes(usage.heapTotal),
      heapUsed: formatBytes(usage.heapUsed),
      external: formatBytes(usage.external)
    });
  }

  // Request correlation
  createRequestLogger(requestId) {
    return {
      error: (message, meta = {}) => this.error(message, { requestId, ...meta }),
      warn: (message, meta = {}) => this.warn(message, { requestId, ...meta }),
      info: (message, meta = {}) => this.info(message, { requestId, ...meta }),
      debug: (message, meta = {}) => this.debug(message, { requestId, ...meta }),
      success: (message, meta = {}) => this.success(message, { requestId, ...meta })
    };
  }
}

module.exports = new Logger();
