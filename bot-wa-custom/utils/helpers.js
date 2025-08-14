const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

const logger = require('../services/logger');

class Helpers {
  // Generate unique request ID for correlation
  generateRequestId() {
    return crypto.randomBytes(16).toString('hex');
  }

  // Generate correlation ID for tracking
  generateCorrelationId() {
    return `${Date.now()}-${crypto.randomBytes(8).toString('hex')}`;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Format duration for display
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  // Format timestamp for display
  formatTimestamp(timestamp, locale = 'id-ID') {
    const date = new Date(timestamp);
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  // Sanitize filename for safe storage
  sanitizeFilename(filename) {
    return filename
      .replace(/[^\w\s.-]/g, '') // Remove special characters except dots and hyphens
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .replace(/_{2,}/g, '_') // Replace multiple underscores with single
      .substring(0, 100) // Limit length
      .trim();
  }

  // Validate URL format
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Validate email format
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Validate phone number format (international)
  isValidPhoneNumber(phone) {
    const phoneRegex = /^\+?[1-9]\d{10,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  // Extract domain from URL
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch (error) {
      return null;
    }
  }

  // Generate hash for data integrity
  generateHash(data, algorithm = 'sha256') {
    return crypto.createHash(algorithm).update(JSON.stringify(data)).digest('hex');
  }

  // Encrypt sensitive data
  encryptData(data, key) {
    try {
      const cipher = crypto.createCipher('aes-256-cbc', key);
      let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return encrypted;
    } catch (error) {
      logger.error('💥 Encryption failed', { error: error.message });
      return null;
    }
  }

  // Decrypt sensitive data
  decryptData(encryptedData, key) {
    try {
      const decipher = crypto.createDecipher('aes-256-cbc', key);
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return JSON.parse(decrypted);
    } catch (error) {
      logger.error('💥 Decryption failed', { error: error.message });
      return null;
    }
  }

  // Deep clone object
  deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  // Merge objects recursively
  deepMerge(target, source) {
    const output = Object.assign({}, target);
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        if (this.isObject(source[key])) {
          if (!(key in target)) {
            Object.assign(output, { [key]: source[key] });
          } else {
            output[key] = this.deepMerge(target[key], source[key]);
          }
        } else {
          Object.assign(output, { [key]: source[key] });
        }
      });
    }
    
    return output;
  }

  // Check if value is object
  isObject(item) {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  // Debounce function
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Throttle function
  throttle(func, delay) {
    let lastCall = 0;
    return function (...args) {
      const now = new Date().getTime();
      if (now - lastCall < delay) {
        return;
      }
      lastCall = now;
      return func.apply(this, args);
    };
  }

  // Retry async function with exponential backoff
  async retry(fn, maxAttempts = 3, baseDelay = 1000) {
    let attempt = 1;
    
    while (attempt <= maxAttempts) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`⏳ Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, { 
          error: error.message 
        });
        
        await this.sleep(delay);
        attempt++;
      }
    }
  }

  // Sleep/delay utility
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Get random element from array
  getRandomElement(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Shuffle array
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Chunk array into smaller arrays
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Remove duplicates from array
  removeDuplicates(array) {
    return [...new Set(array)];
  }

  // Get environment variable with default
  getEnvVar(name, defaultValue = null) {
    return process.env[name] || defaultValue;
  }

  // Check if running in production
  isProduction() {
    return process.env.NODE_ENV === 'production';
  }

  // Check if running in development
  isDevelopment() {
    return process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
  }

  // Ensure directory exists
  async ensureDir(dirPath) {
    try {
      await fs.ensureDir(dirPath);
      return true;
    } catch (error) {
      logger.error('💥 Failed to ensure directory', { 
        error: error.message, 
        dirPath 
      });
      return false;
    }
  }

  // Read JSON file safely
  async readJsonFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      logger.error('💥 Failed to read JSON file', { 
        error: error.message, 
        filePath 
      });
      return null;
    }
  }

  // Write JSON file safely
  async writeJsonFile(filePath, data) {
    try {
      await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
      return true;
    } catch (error) {
      logger.error('💥 Failed to write JSON file', { 
        error: error.message, 
        filePath 
      });
      return false;
    }
  }

  // Calculate percentage
  calculatePercentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  }

  // Format number with thousand separators
  formatNumber(number, locale = 'id-ID') {
    return new Intl.NumberFormat(locale).format(number);
  }

  // Capitalize first letter
  capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  // Convert camelCase to kebab-case
  camelToKebab(string) {
    return string.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
  }

  // Convert kebab-case to camelCase
  kebabToCamel(string) {
    return string.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase());
  }

  // Truncate string with ellipsis
  truncate(string, maxLength, suffix = '...') {
    if (string.length <= maxLength) return string;
    return string.substring(0, maxLength - suffix.length) + suffix;
  }

  // Get file extension from filename
  getFileExtension(filename) {
    return path.extname(filename).toLowerCase().slice(1);
  }

  // Get MIME type from file extension
  getMimeType(extension) {
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'mp4': 'video/mp4',
      'avi': 'video/avi',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'txt': 'text/plain',
      'json': 'application/json'
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }
}

module.exports = new Helpers();
