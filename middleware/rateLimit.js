const NodeCache = require('node-cache');
const logger = require('../services/logger');

class RateLimiter {
  constructor() {
    this.cache = new NodeCache({ 
      stdTTL: 60, // 1 minute TTL
      checkperiod: 10 // Check for expired keys every 10 seconds
    });
    
    this.limits = {
      messages: 10, // 10 messages per minute per user
      commands: 5,  // 5 commands per minute per user
      media: 3,     // 3 media downloads per minute per user
      ai: 8         // 8 AI requests per minute per user
    };
  }

  checkLimit(userId, type = 'messages') {
    try {
      const key = `${type}_${userId}`;
      const currentCount = this.cache.get(key) || 0;
      const limit = this.limits[type];

      if (currentCount >= limit) {
        logger.warn('⏰ Rate limit exceeded', { 
          userId, 
          type, 
          currentCount, 
          limit 
        });
        return false;
      }

      // Increment counter
      this.cache.set(key, currentCount + 1);
      
      logger.debug('📊 Rate limit check', { 
        userId, 
        type, 
        count: currentCount + 1, 
        limit 
      });

      return true;

    } catch (error) {
      logger.error('💥 Rate limit check failed', { 
        error: error.message, 
        userId, 
        type 
      });
      
      // Allow request if rate limiter fails
      return true;
    }
  }

  checkCommandLimit(userId) {
    return this.checkLimit(userId, 'commands');
  }

  checkMediaLimit(userId) {
    return this.checkLimit(userId, 'media');
  }

  checkAILimit(userId) {
    return this.checkLimit(userId, 'ai');
  }

  getRemainingRequests(userId, type = 'messages') {
    try {
      const key = `${type}_${userId}`;
      const currentCount = this.cache.get(key) || 0;
      const limit = this.limits[type];
      
      return Math.max(0, limit - currentCount);
    } catch (error) {
      logger.error('💥 Error getting remaining requests', { 
        error: error.message 
      });
      return 0;
    }
  }

  resetUserLimits(userId) {
    try {
      Object.keys(this.limits).forEach(type => {
        const key = `${type}_${userId}`;
        this.cache.del(key);
      });

      logger.info('🔄 User rate limits reset', { userId });
      return true;

    } catch (error) {
      logger.error('💥 Error resetting user limits', { 
        error: error.message, 
        userId 
      });
      return false;
    }
  }

  getStats() {
    try {
      const keys = this.cache.keys();
      const stats = {
        totalActiveUsers: new Set(keys.map(key => key.split('_')[1])).size,
        totalRequests: keys.length,
        byType: {}
      };

      Object.keys(this.limits).forEach(type => {
        stats.byType[type] = keys.filter(key => key.startsWith(type)).length;
      });

      return stats;

    } catch (error) {
      logger.error('💥 Error getting rate limit stats', { 
        error: error.message 
      });
      return {};
    }
  }

  updateLimits(newLimits) {
    try {
      this.limits = { ...this.limits, ...newLimits };
      
      logger.info('📊 Rate limits updated', { limits: this.limits });
      return true;

    } catch (error) {
      logger.error('💥 Error updating rate limits', { 
        error: error.message 
      });
      return false;
    }
  }

  // Anti-spam protection
  isSpamming(userId, messageText) {
    try {
      const spamKey = `spam_${userId}`;
      const recentMessages = this.cache.get(spamKey) || [];
      
      // Check for repeated identical messages
      const identicalCount = recentMessages.filter(msg => msg === messageText).length;
      
      if (identicalCount >= 3) {
        logger.warn('🚫 Spam detected - identical messages', { 
          userId, 
          messageText: messageText.substring(0, 50),
          count: identicalCount
        });
        return true;
      }

      // Add message to recent messages (keep last 10)
      recentMessages.push(messageText);
      if (recentMessages.length > 10) {
        recentMessages.shift();
      }
      
      this.cache.set(spamKey, recentMessages, 300); // 5 minutes TTL
      
      return false;

    } catch (error) {
      logger.error('💥 Error checking spam', { 
        error: error.message 
      });
      return false;
    }
  }

  blockUser(userId, duration = 3600) {
    try {
      const blockKey = `blocked_${userId}`;
      this.cache.set(blockKey, true, duration);
      
      logger.warn('🚫 User temporarily blocked', { 
        userId, 
        duration 
      });
      
      return true;

    } catch (error) {
      logger.error('💥 Error blocking user', { 
        error: error.message, 
        userId 
      });
      return false;
    }
  }

  isBlocked(userId) {
    try {
      const blockKey = `blocked_${userId}`;
      return !!this.cache.get(blockKey);
    } catch (error) {
      logger.error('💥 Error checking if user is blocked', { 
        error: error.message 
      });
      return false;
    }
  }

  unblockUser(userId) {
    try {
      const blockKey = `blocked_${userId}`;
      this.cache.del(blockKey);
      
      logger.info('✅ User unblocked', { userId });
      return true;

    } catch (error) {
      logger.error('💥 Error unblocking user', { 
        error: error.message, 
        userId 
      });
      return false;
    }
  }
}

const rateLimiter = new RateLimiter();

module.exports = { rateLimiter };
