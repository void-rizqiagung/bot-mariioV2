const ytdl = require('ytdl-core');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');

const logger = require('./logger');

class MediaService {
  constructor() {
    this.tempDir = path.join(__dirname, '..', 'temp');
    this.maxFileSize = 50 * 1024 * 1024; // 50MB
    this.initializeTempDir();
  }

  async initializeTempDir() {
    try {
      await fs.ensureDir(this.tempDir);
      logger.debug('📁 Temp directory initialized', { path: this.tempDir });
    } catch (error) {
      logger.error('💥 Failed to initialize temp directory', { error: error.message });
    }
  }

  async downloadYouTubeVideo(url, type = 'video') {
    try {
      logger.download(`🎥 Starting YouTube ${type} download`, { url });

      // Simplified approach with basic headers
      const info = await ytdl.getInfo(url);

      if (!info || !info.formats || info.formats.length === 0) {
        throw new Error('Tidak ada format video yang tersedia');
      }

      let format;
      
      if (type === 'audio') {
        // Get best audio format
        format = ytdl.chooseFormat(info.formats, {
          quality: 'highestaudio',
          filter: 'audioonly'
        });
        
        // Fallback to any audio
        if (!format) {
          format = ytdl.chooseFormat(info.formats, {
            filter: (fmt) => fmt.hasAudio && !fmt.hasVideo
          });
        }
      } else {
        // Get best video+audio format (lower quality for WhatsApp size limits)
        format = ytdl.chooseFormat(info.formats, {
          quality: 'lowest',
          filter: (fmt) => fmt.hasVideo && fmt.hasAudio && fmt.container === 'mp4'
        });
        
        // Fallback to any video with audio
        if (!format) {
          format = ytdl.chooseFormat(info.formats, {
            quality: 'lowest',
            filter: (fmt) => fmt.hasVideo && fmt.hasAudio
          });
        }
      }

      if (!format) {
        throw new Error(`Format ${type} tidak ditemukan`);
      }

      logger.info('🎯 Selected format', { 
        itag: format.itag, 
        quality: format.qualityLabel || format.audioQuality,
        container: format.container,
        hasAudio: format.hasAudio,
        hasVideo: format.hasVideo
      });

      // Create download stream
      const stream = ytdl(url, { 
        format: format,
        requestOptions: {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; bot/1.0)'
          }
        }
      });
      
      const chunks = [];
      let totalSize = 0;

      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          stream.destroy();
          reject(new Error('Download timeout setelah 60 detik'));
        }, 60000);

        stream.on('data', (chunk) => {
          chunks.push(chunk);
          totalSize += chunk.length;
          
          // Check size limit (50MB)
          if (totalSize > this.maxFileSize) {
            stream.destroy();
            clearTimeout(timeout);
            reject(new Error('File terlalu besar (maksimal 50MB)'));
            return;
          }
        });
        
        stream.on('end', () => {
          clearTimeout(timeout);
          const buffer = Buffer.concat(chunks);
          
          if (buffer.length === 0) {
            reject(new Error('File kosong atau gagal diunduh'));
            return;
          }
          
          const sizeInMB = (buffer.length / 1024 / 1024).toFixed(2);
          
          logger.success(`✅ YouTube ${type} downloaded`, {
            title: info.videoDetails.title,
            size: `${sizeInMB}MB`,
            duration: info.videoDetails.lengthSeconds
          });
          
          resolve({
            buffer,
            title: this.sanitizeFilename(info.videoDetails.title),
            duration: info.videoDetails.lengthSeconds,
            size: buffer.length,
            sizeFormatted: `${sizeInMB}MB`
          });
        });
        
        stream.on('error', (error) => {
          clearTimeout(timeout);
          logger.error('Stream error:', error.message);
          reject(new Error(`Download gagal: ${error.message}`));
        });
      });

    } catch (error) {
      logger.error('💥 YouTube download failed', { error: error.message, url });
      
      // More user-friendly error messages
      if (error.message.includes('Video unavailable')) {
        throw new Error('❌ Video tidak tersedia atau telah dihapus');
      } else if (error.message.includes('private')) {
        throw new Error('❌ Video bersifat private');
      } else if (error.message.includes('age')) {
        throw new Error('❌ Video dibatasi usia');
      } else if (error.message.includes('region')) {
        throw new Error('❌ Video tidak tersedia di wilayah ini');
      } else if (error.message.includes('terlalu besar')) {
        throw new Error('❌ Video terlalu besar (maksimal 50MB)');
      } else {
        throw new Error(`❌ Download gagal: ${error.message.replace('Error: ', '')}`);
      }
    }
  }

  async downloadYouTubeAudio(url, title) {
    const filename = `${title}_audio.mp4`;
    const filepath = path.join(this.tempDir, filename);

    return new Promise((resolve, reject) => {
      const stream = ytdl(url, {
        quality: 'highestaudio',
        filter: 'audioonly'
      });

      stream.pipe(fs.createWriteStream(filepath));

      stream.on('end', async () => {
        try {
          const stats = await fs.stat(filepath);

          if (stats.size > this.maxFileSize) {
            await fs.remove(filepath);
            reject(new Error('File too large (max 50MB)'));
            return;
          }

          const buffer = await fs.readFile(filepath);
          await fs.remove(filepath);

          logger.success('✅ YouTube audio downloaded', {
            title,
            size: stats.size
          });

          resolve({
            buffer,
            filename,
            size: stats.size,
            title
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  async downloadYouTubeVideoFile(url, title) {
    const filename = `${title}_video.mp4`;
    const filepath = path.join(this.tempDir, filename);

    return new Promise((resolve, reject) => {
      const stream = ytdl(url, {
        quality: 'highest',
        filter: 'video'
      });

      stream.pipe(fs.createWriteStream(filepath));

      stream.on('end', async () => {
        try {
          const stats = await fs.stat(filepath);

          if (stats.size > this.maxFileSize) {
            await fs.remove(filepath);
            reject(new Error('File too large (max 50MB)'));
            return;
          }

          const buffer = await fs.readFile(filepath);
          await fs.remove(filepath);

          logger.success('✅ YouTube video downloaded', {
            title,
            size: stats.size
          });

          resolve({
            buffer,
            filename,
            size: stats.size,
            title
          });
        } catch (error) {
          reject(error);
        }
      });

      stream.on('error', reject);
    });
  }

  async downloadTikTokVideo(url) {
    try {
      logger.download('📱 Starting TikTok video download', { url });

      // Use TikTok scraper API alternative
      const axios = require('axios');

      const response = await axios.post('https://www.tikwm.com/api/', {
        url: url,
        hd: 1
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      if (response.data.code !== 0) {
        throw new Error('Failed to fetch TikTok video data');
      }

      const videoData = response.data.data;
      const videoUrl = videoData.hdplay || videoData.play;

      if (!videoUrl) {
        throw new Error('No video URL found');
      }

      // Download the video
      const videoResponse = await axios.get(videoUrl, {
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 60000
      });

      const buffer = Buffer.from(videoResponse.data);

      logger.success('✅ TikTok video downloaded', {
        title: videoData.title || 'TikTok Video',
        size: (buffer.length / 1024 / 1024).toFixed(2) + 'MB'
      });

      return {
        buffer,
        title: videoData.title || 'TikTok Video',
        author: videoData.author?.nickname || 'Unknown',
        thumbnail: videoData.cover
      };

    } catch (error) {
      logger.error('💥 TikTok download failed', { error: error.message, url });
      throw new Error(`TikTok download gagal: ${error.message}`);
    }
  }

  async processImage(imageBuffer, options = {}) {
    try {
      logger.debug('🖼️ Processing image', { 
        options,
        originalSize: imageBuffer.length 
      });

      let processor = sharp(imageBuffer);

      // Handle resize with proper aspect ratio handling
      if (options.resize) {
        processor = processor.resize(options.resize.width, options.resize.height, {
          fit: 'cover',
          position: 'center'
        });
      }

      // Handle format conversion
      if (options.format) {
        if (options.format === 'webp') {
          processor = processor.webp({ 
            quality: options.quality || 85,
            effort: 6
          });
        } else if (options.format === 'jpeg') {
          processor = processor.jpeg({ 
            quality: options.quality || 80,
            progressive: true
          });
        } else if (options.format === 'png') {
          processor = processor.png({ 
            compressionLevel: 6,
            adaptiveFiltering: true
          });
        }
      } else if (options.compress) {
        // Default to JPEG compression if no format specified
        processor = processor.jpeg({ quality: options.quality || 80 });
      }

      const processedBuffer = await processor.toBuffer();

      const compressionRatio = ((imageBuffer.length - processedBuffer.length) / imageBuffer.length * 100).toFixed(1);

      logger.success('✅ Image processed successfully', {
        originalSize: `${(imageBuffer.length / 1024).toFixed(1)}KB`,
        processedSize: `${(processedBuffer.length / 1024).toFixed(1)}KB`,
        compressionRatio: `${compressionRatio}%`,
        format: options.format || 'original'
      });

      return processedBuffer;

    } catch (error) {
      logger.error('💥 Image processing failed', { 
        error: error.message,
        options,
        originalSize: imageBuffer.length
      });
      
      // More specific error messages
      if (error.message.includes('Input buffer contains unsupported image format')) {
        throw new Error('Format gambar tidak didukung. Gunakan JPG, PNG, atau WebP.');
      } else if (error.message.includes('Input image exceeds pixel limit')) {
        throw new Error('Gambar terlalu besar. Maksimal 25 megapixels.');
      } else {
        throw new Error(`Gagal memproses gambar: ${error.message}`);
      }
    }
  }

  async createThumbnail(imageBuffer, size = 200) {
    try {
      const thumbnail = await sharp(imageBuffer)
        .resize(size, size, { fit: 'cover' })
        .jpeg({ quality: 70 })
        .toBuffer();

      logger.debug('🖼️ Thumbnail created', { size });
      return thumbnail;

    } catch (error) {
      logger.error('💥 Thumbnail creation failed', { error: error.message });
      throw error;
    }
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[-\s]+/g, '-') // Replace spaces and hyphens
      .substring(0, 50) // Limit length
      .trim();
  }

  async cleanupTempFiles() {
    try {
      const files = await fs.readdir(this.tempDir);
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour

      for (const file of files) {
        const filepath = path.join(this.tempDir, file);
        const stats = await fs.stat(filepath);

        if (now - stats.mtime.getTime() > maxAge) {
          await fs.remove(filepath);
          logger.debug('🗑️ Cleaned up old temp file', { file });
        }
      }
    } catch (error) {
      logger.error('💥 Temp cleanup failed', { error: error.message });
    }
  }

  isValidYouTubeUrl(url) {
    try {
      // Use ytdl validation first
      if (ytdl.validateURL(url)) {
        return true;
      }
      
      // Manual validation for various YouTube URL formats
      const youtubeRegex = [
        /^https?:\/\/(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\/.+/i,
        /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/i,
        /^https?:\/\/youtu\.be\/[\w-]+/i,
        /^https?:\/\/m\.youtube\.com\/watch\?v=[\w-]+/i,
        /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/i,
        /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/i
      ];
      
      return youtubeRegex.some(regex => regex.test(url));
    } catch (error) {
      return false;
    }
  }

  isValidTikTokUrl(url) {
    const tiktokRegexes = [
      /^https?:\/\/(www\.|m\.)?tiktok\.com\/@[\w.-]+\/video\/\d+/i,
      /^https?:\/\/vm\.tiktok\.com\/[\w.-]+/i,
      /^https?:\/\/vt\.tiktok\.com\/[\w.-]+/i,
      /^https?:\/\/(www\.)?tiktok\.com\/t\/[\w.-]+/i,
      /^https?:\/\/m\.tiktok\.com\/v\/\d+/i,
      /^https?:\/\/tiktok\.com\/@[\w.-]+\/video\/\d+/i
    ];
    
    return tiktokRegexes.some(regex => regex.test(url));
  }

  extractYouTubeId(url) {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }
}

module.exports = new MediaService();