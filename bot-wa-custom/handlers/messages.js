const { downloadMediaMessage, getContentType } = require('@whiskeysockets/baileys');
const imageService = require('../services/image');
const whatsappService = require('../services/whatsapp');
const geminiService = require('../services/gemini');
const mediaService = require('../services/media');
const commandHandler = require('./commands');
const logger = require('../services/logger');
const { getDatabase } = require('../config/database');
const { users, messages } = require('../db/schema');
const { eq } = require('drizzle-orm');

class MessageHandler {
  constructor() {
    this.commandPrefixes = ['/', '.'];
  }

  async processMessage(sock, message) {
    try {
      const chatId = message.key.remoteJid;
      if (chatId === 'status@broadcast') {
        await whatsappService.viewStatus(message);
        return;
      }
      const viewOnceMsg = message.message?.viewOnceMessageV2 || message.message?.viewOnceMessage;
      if (viewOnceMsg && whatsappService.isPrivateChat(chatId)) {
        await this.handleViewOnceMessage(sock, message);
      }
      if (!whatsappService.isPrivateChat(chatId)) return;

      const user = await this.getOrCreateUser(message);
      const messageContent = this.extractMessageContent(message);
      if (!messageContent) return;
      
      await this.logMessage(user.id, chatId, messageContent, message);
      
      const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      if (quotedMsg && messageContent.type === 'text') {
        const repliedMessage = { ...message, message: quotedMsg };
        if (getContentType(quotedMsg) === 'imageMessage') {
          const command = messageContent.content.toLowerCase();
          if (command.includes('/sticker')) return await this.handleStickerConversion(sock, repliedMessage, user);
          if (command.includes('/analyze')) return await this.handleImageAnalysis(sock, repliedMessage, user, command);
          if (command.includes('/hd')) return await this.handleImageUpscale(sock, repliedMessage, user);
        }
      }

      if (messageContent.type === 'text') {
        await this.handleTextMessage(sock, message, messageContent.content, user);
      } else if (getContentType(message.message) === 'imageMessage') {
        await this.handleImageMessage(sock, message, messageContent, user);
      }
    } catch (error) {
      logger.error('💥 Error processing message', { error: error.message, stack: error.stack });
    }
  }

  async handleTextMessage(sock, message, text, user) {
    const chatId = message.key.remoteJid;
    const isCommand = this.commandPrefixes.some(prefix => text.startsWith(prefix));

    if (isCommand) {
      // Bot online dan typing saat ada prefix
      await whatsappService.sendPresenceUpdate('composing', chatId);
      const [command, ...args] = text.split(' ');
      try {
        await commandHandler.processCommand(sock, message, command, args, user);
      } finally {
        // Bot kembali offline setelah selesai
        await whatsappService.sendPresenceUpdate('available', chatId);
      }
    } else if (mediaService.isValidYouTubeUrl(text) || mediaService.isValidTikTokUrl(text)) {
      await this.handleTextWithUrls(sock, message, text);
    }
    // TIDAK ADA RESPON untuk pesan tanpa prefix - bot tetap offline dan tidak typing
  }

  async handleViewOnceMessage(sock, message) {
    try {
      const viewOnceMsg = message.message?.viewOnceMessageV2 || message.message?.viewOnceMessage;
      if (!viewOnceMsg) return;
      const mediaMessage = viewOnceMsg.message;
      let mediaType, mediaData, caption;

      if (mediaMessage?.imageMessage) {
        mediaType = 'image';
        mediaData = mediaMessage.imageMessage;
        caption = mediaData.caption || '';
      } else if (mediaMessage?.videoMessage) {
        mediaType = 'video';
        mediaData = mediaMessage.videoMessage;
        caption = mediaData.caption || '';
      } else { return; }

      const tempMsg = { message: { [mediaType + 'Message']: mediaData } };
      const mediaBuffer = await downloadMediaMessage(tempMsg, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
      await whatsappService.forwardViewOnceToPrivate(mediaBuffer, mediaType, caption);
    } catch (error) {
      logger.error('💥 Gagal menangani "view once"', { error: error.message });
    }
  }
  
  async handleTextWithUrls(sock, message, text) {
    const chatId = message.key.remoteJid;
    let helpMessage = '🔗 *Link Terdeteksi*\n\n';
    if (mediaService.isValidYouTubeUrl(text)) {
      helpMessage += `Untuk mengunduh, gunakan:\n• \`/yt ${text}\`\n• \`/ytmp3 ${text}\``;
    } else if (mediaService.isValidTikTokUrl(text)) {
      helpMessage += `Untuk mengunduh, gunakan:\n• \`/tiktok ${text}\``;
    }
    await whatsappService.sendTextMessage(chatId, helpMessage);
  }

  async handleImageMessage(sock, message, messageContent, user) {
    const caption = (messageContent.caption || '').toLowerCase();
    if (caption.includes('/sticker')) await this.handleStickerConversion(sock, message, user);
    else if (caption.includes('/analyze')) await this.handleImageAnalysis(sock, message, user, caption);
    else if (caption.includes('/hd')) await this.handleImageUpscale(sock, message, user);
  }

  async handleImageAnalysis(sock, message, user, caption) {
    const chatId = message.key.remoteJid;
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, "Menganalisis gambar");
    try {
      const imageBuffer = await downloadMediaMessage(message, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
      const prompt = caption.replace(/\/analyze|\.analyze/gi, '').trim() || 'Jelaskan gambar ini.';
      const analysisResult = await geminiService.analyzeImage(imageBuffer, prompt);
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: analysisResult.text, edit: loadingAnimation.message.key });
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: '❌ Gagal menganalisis gambar.', edit: loadingAnimation.message.key });
    }
  }
  
  async handleImageUpscale(sock, message, user) {
    const chatId = message.key.remoteJid;
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, "Meningkatkan kualitas gambar");
    try {
      const imageBuffer = await downloadMediaMessage(message, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
      const upscaledBuffer = await imageService.upscaleImage(imageBuffer);
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: '✅ *Berhasil!* Berikut adalah gambar versi HD:', edit: loadingAnimation.message.key });
      await whatsappService.sendImageMessage(chatId, upscaledBuffer, '_Gambar ditingkatkan oleh AI._');
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `❌ Gagal.\n*Alasan:* ${error.message}`, edit: loadingAnimation.message.key });
    }
  }

  async handleStickerConversion(sock, message, user) {
    const chatId = message.key.remoteJid;
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, "Membuat stiker");
    try {
      const imageBuffer = await downloadMediaMessage(message, 'buffer', {}, { logger: undefined, reuploadRequest: sock.updateMediaMessage });
      const processedBuffer = await mediaService.processImage(imageBuffer, { resize: { width: 512, height: 512 }, format: 'webp' });
      loadingAnimation.stop();
      await whatsappService.deleteMessage(chatId, loadingAnimation.message.key.id);
      await whatsappService.sendMessage(chatId, { sticker: processedBuffer });
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: '❌ Gagal membuat stiker.', edit: loadingAnimation.message.key });
    }
  }
  
  extractMessageContent(message) {
    const msg = message.message;
    if (!msg) return null;
    if (msg.conversation) return { type: 'text', content: msg.conversation };
    if (msg.extendedTextMessage) return { type: 'text', content: msg.extendedTextMessage.text };
    if (msg.imageMessage) return { type: 'image', caption: msg.imageMessage.caption || '' };
    if (msg.videoMessage) return { type: 'video', caption: msg.videoMessage.caption || '' };
    return { type: 'other' };
  }

  async getOrCreateUser(message) {
    try {
      const whatsappId = message.key.remoteJid.replace('@s.whatsapp.net', '');
      const db = getDatabase();
      let user = await db.select().from(users).where(eq(users.whatsappId, whatsappId)).limit(1);
      if (user.length === 0) {
        const newUser = { whatsappId, name: message.pushName || 'User', lastSeen: new Date() };
        await db.insert(users).values(newUser);
        user = await db.select().from(users).where(eq(users.whatsappId, whatsappId)).limit(1);
      } else {
        await db.update(users).set({ lastSeen: new Date(), name: message.pushName || user[0].name }).where(eq(users.whatsappId, whatsappId));
      }
      return user[0];
    } catch (error) {
      return { id: -1, name: message.pushName || 'User' };
    }
  }

  async logMessage(userId, chatId, messageContent, message) {
    try {
      const db = getDatabase();
      await db.insert(messages).values({
        userId, chatId, messageId: message.key.id,
        content: messageContent.content || messageContent.caption || `[${messageContent.type}]`,
        messageType: messageContent.type, isFromBot: false,
        timestamp: new Date(message.messageTimestamp * 1000 || Date.now())
      });
    } catch (error) {
      logger.error('💥 Error logging message', { error: error.message });
    }
  }
}

module.exports = new MessageHandler();