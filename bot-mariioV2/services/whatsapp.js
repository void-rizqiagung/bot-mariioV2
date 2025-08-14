const logger = require('./logger');

class WhatsAppService {
  constructor() {
    this.sock = null;
  }

  setSock(sock) {
    this.sock = sock;
  }

  isPrivateChat(chatId) {
    return chatId && !chatId.includes('@g.us') && chatId.includes('@s.whatsapp.net');
  }

  async sendTyping(chatId, isTyping = false) {
    try {
      if (!this.sock || !this.isPrivateChat(chatId)) return;
      const presence = isTyping ? 'composing' : 'available';
      await this.sock.sendPresenceUpdate(presence, chatId);
    } catch (error) {
      logger.error('💥 Gagal mengirim status mengetik', { error: error.message, chatId });
    }
  }

  async sendPresenceUpdate(presence, chatId) {
    try {
      if (!this.sock || !this.isPrivateChat(chatId)) return;
      await this.sock.sendPresenceUpdate(presence, chatId);
    } catch (error) {
      logger.error('💥 Gagal mengirim presence update', { error: error.message, chatId });
    }
  }

  // --- "GOD ANIMATION" LOADING MESSAGE ---
  async sendAnimatedLoadingMessage(chatId, baseText) {
    const frames = [
      "■□□□□□□□□□ ```10%```", "■■□□□□□□□□ ```20%```", "■■■□□□□□□□```30%```", "■■■■□□□□□□```40%```",
      "■■■■■□□□□□```50%```", "■■■■■■□□□□```60%```", "■■■■■■■□□□```70%```", "■■■■■■■■□□```80%```",
      "■■■■■■■■■□```99%```", "■■■■■■■■■■```100%```"
    ];
    let i = 0;
    
    const loadingMessage = await this.sendTextMessage(chatId, `*${baseText}*\n\n${frames[i]}`);
    
    const animate = async () => {
      i = (i + 1) % frames.length;
      try {
        await this.sendMessage(chatId, {
          text: `*${baseText}*\n\n${frames[i]}`,
          edit: loadingMessage.key
        });
      } catch (e) {
        clearInterval(intervalId);
      }
    };

    const intervalId = setInterval(animate, 450); // Kecepatan animasi 450ms

    return {
      message: loadingMessage,
      stop: () => clearInterval(intervalId)
    };
  }

  async viewStatus(statusMessage) {
    if (!this.sock || statusMessage.key.remoteJid !== 'status@broadcast') return;
    const participant = statusMessage.key.participant;
    if (!participant) return;
    try {
      logger.info(`👀 Melihat status dari ${participant.split('@')[0]}`);
      await this.sock.readMessages([{ remoteJid: 'status@broadcast', id: statusMessage.key.id, participant }]);
    } catch (error) {
      logger.error(`💥 Gagal melihat status dari ${participant}`, { error: error.message });
    }
  }

  async forwardViewOnceToPrivate(mediaBuffer, mediaType, caption = '') {
    try {
      const botNumber = this.sock?.user?.id;
      if (!botNumber) {
        logger.warn('⚠️ Tidak bisa forward "view once": Nomor JID bot tidak ditemukan.');
        return;
      }
      const messageType = mediaType === 'image' ? 'image' : 'video';
      const messageContent = { [messageType]: mediaBuffer, caption: `🔒 *Pesan "View Once" Diterima*\n\n${caption}\n\n_Pesan ini telah disimpan._` };
      await this.sock.sendMessage(botNumber, messageContent);
      logger.success(`✅ Pesan "view once" berhasil di-forward ke nomor bot sendiri.`);
    } catch (error) {
      logger.error('💥 Gagal forward "view once"', { error: error.message });
    }
  }
  
  async sendMessage(chatId, content) {
    try {
      if (!this.sock) throw new Error('WhatsApp socket not initialized');
      if (!this.isPrivateChat(chatId)) return null;
      return await this.sock.sendMessage(chatId, content);
    } catch (error) {
      logger.error('💥 Gagal mengirim pesan', { error: error.message, chatId });
      throw error;
    }
  }

  async sendTextMessage(chatId, text) { return await this.sendMessage(chatId, { text }); }
  async sendImageMessage(chatId, imageBuffer, caption = '') { return await this.sendMessage(chatId, { image: imageBuffer, caption }); }
  async sendVideoMessage(chatId, videoBuffer, caption = '') { return await this.sendMessage(chatId, { video: videoBuffer, caption }); }
  async sendAudioMessage(chatId, audioBuffer) { return await this.sendMessage(chatId, { audio: audioBuffer, mimetype: 'audio/mp4' }); }
  async sendDocumentMessage(chatId, documentBuffer, filename, mimetype) { return await this.sendMessage(chatId, { document: documentBuffer, fileName: filename, mimetype }); }
  async deleteMessage(chatId, messageId) {
    try {
      if (!this.sock || !this.isPrivateChat(chatId)) return;
      await this.sock.sendMessage(chatId, { delete: { remoteJid: chatId, id: messageId, fromMe: true } });
    } catch (error) {
      logger.error('💥 Gagal menghapus pesan', { error: error.message, chatId });
    }
  }
}

module.exports = new WhatsAppService();