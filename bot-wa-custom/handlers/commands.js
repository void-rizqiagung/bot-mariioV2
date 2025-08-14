const fs = require('fs-extra');
const path = require('path');
const whatsappService = require('../services/whatsapp');
const geminiService = require('../services/gemini');
const { generateImage } = require('../services/Imagen4');
const mediaService = require('../services/media');
const logger = require('../services/logger');
const settings = require('../config/settings');
const helpers = require('../utils/helpers');
const { getDatabase } = require('../config/database');
const { users, commands, mediaDownloads, aiInteractions } = require('../db/schema');
const scheduleService = require('../services/schedule');

class CommandHandler {
  constructor() {
    this.validPrefixes = ['/', '.'];
    this.commands = {
      // Perintah Bantuan & Info
      '/help': this.handleHelp.bind(this),
      '/start': this.handleStart.bind(this),
      '/menu': this.handleMenu.bind(this),
      '/ping': this.handlePing.bind(this),
      '/status': this.handleStatus.bind(this),
      '/info': this.handleInfo.bind(this),
      
      // Perintah AI
      '/ai': this.handleAI.bind(this),
      '/search': this.handleSearch.bind(this),
      '/image': this.handleImage.bind(this),
      '/analyze': this.handleAnalyze.bind(this),

      // Perintah Media & Tools
      '/yt': this.handleYouTube.bind(this),
      '/ytmp3': this.handleYouTubeAudio.bind(this),
      '/tiktok': this.handleTikTok.bind(this),
      '/sticker': this.handleSticker.bind(this),
      '/hd': this.handleHD.bind(this),
      '/schedule': this.handleSchedule.bind(this),
    };
  }
    
  async processCommand(sock, message, command, args, user) {
    const handler = this.commands[command.toLowerCase()];
    if (handler) {
      try {
        await handler(sock, message, args, user);
      } catch (error) {
        logger.error('💥 Command execution failed', { command: command, error: error.message });
        if (whatsappService && message.key.remoteJid) {
          await whatsappService.sendTextMessage(message.key.remoteJid, '❌ Terjadi kesalahan internal pada sistem.');
        }
      }
    } else {
      await this.handleUnknownCommand(sock, message, command);
    }
  }

  // --- FUNGSI-FUNGSI PERINTAH ---

  async handleAI(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    const prompt = args.join(' ');

    // Validasi input yang lebih comprehensive
    if (!prompt || prompt.trim().length === 0) {
      return await whatsappService.sendTextMessage(chatId, 
        '❓ *Perintah Tidak Lengkap*\n\n' +
        '📝 *Contoh penggunaan:*\n' +
        '• `/ai jelaskan tentang kecerdasan buatan`\n' +
        '• `/ai bagaimana cara kerja blockchain?`\n' +
        '• `/ai analisis tren teknologi 2024`\n\n' +
        '💡 *Tip:* Semakin spesifik pertanyaan, semakin akurat jawaban yang diberikan.'
      );
    }

    // Deteksi jenis permintaan untuk optimasi response
    const isQuestionPrompt = /^(apa|bagaimana|mengapa|kapan|dimana|siapa|berapa)/i.test(prompt);
    const hasUrl = /(https?:\/\/[^\s]+)/g.test(prompt);
    
    // Indikator typing yang lebih natural
    await whatsappService.sendPresenceUpdate('composing', chatId);
    
    // Loading message yang dinamis berdasarkan jenis permintaan
    let loadingMessage;
    if (hasUrl) {
      loadingMessage = 'AI sedang menganalisis konten dari URL';
    } else if (isQuestionPrompt) {
      loadingMessage = 'AI sedang mencari jawaban terbaik';
    } else {
      loadingMessage = 'AI Concierge sedang memproses permintaan';
    }
    
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, loadingMessage);
    
    try {
      // Enhanced options berdasarkan konteks
      const aiOptions = {
        userName: user.name || 'User',
        useGrounding: hasUrl || isQuestionPrompt, // Gunakan grounding untuk URL atau pertanyaan
        maxRetries: 2
      };

      // Generate response dengan error handling
      const responseText = await geminiService.generateContextualResponse(prompt, aiOptions);
      
      // Stop loading animation dan kirim response
      loadingAnimation.stop();
      await whatsappService.sendPresenceUpdate('available', chatId);
      
      // Kirim response dengan edit message untuk performa yang lebih baik
      await whatsappService.sendMessage(chatId, { 
        edit: loadingAnimation.message.key, 
        text: responseText 
      });

      // Log interaksi untuk analytics
      logger.info('🤖 AI Interaction completed', {
        userId: user.id || 'unknown',
        userName: user.name || 'unknown',
        promptLength: prompt.length,
        hasUrl: hasUrl,
        isQuestion: isQuestionPrompt
      });

    } catch (error) {
      // Error handling yang lebih informatif
      loadingAnimation.stop();
      await whatsappService.sendPresenceUpdate('available', chatId);
      
      logger.error('💥 AI command failed', { 
        error: error.message, 
        userId: user.id,
        prompt: prompt.substring(0, 100) + '...'
      });
      
      let errorMessage = '❌ *Gagal Memproses Permintaan*\n\n';
      
      if (error.message.includes('rate limit')) {
        errorMessage += '_Sistem sedang sibuk. Mohon tunggu beberapa saat sebelum mencoba lagi._\n\n⏰ *Estimasi waktu tunggu:* 1-2 menit';
      } else if (error.message.includes('network')) {
        errorMessage += '_Terjadi masalah koneksi. Mohon periksa koneksi internet Anda._\n\n🔄 *Solusi:* Coba lagi dalam beberapa saat';
      } else {
        errorMessage += '_Terjadi kesalahan sistem. Tim teknis telah diberitahu._\n\n💡 *Alternatif:* Coba dengan kata kunci yang lebih sederhana';
      }
      
      await whatsappService.sendMessage(chatId, { 
        edit: loadingAnimation.message.key, 
        text: errorMessage 
      });
    }
  }
  
  async handleSearch(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    const query = args.join(' ');
    
    if (!query) {
      return await whatsappService.sendTextMessage(chatId, '❓ *Perintah Tidak Lengkap*\n*Contoh:* `/search penemu bola lampu`');
    }

    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, 'Melakukan riset web');
    const responseText = await geminiService.generateContextualResponse(query, { useGrounding: true });
    await whatsappService.sendMessage(chatId, { text: responseText, edit: loadingAnimation.message.key });
  }

  async handleImage(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    if (!args || args.length === 0) {
      await whatsappService.sendTextMessage(chatId, '❓ *Perintah tidak lengkap.*\n*Contoh:* `/image kucing astronot`');
      return;
    }
    const fullPrompt = args.join(' ');
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, 'AI sedang menggambar');
    try {
      const result = await generateImage(fullPrompt);
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `✅ *Gambar Dibuat!*\n\n_"${result.prompt}"_`, edit: loadingAnimation.message.key });
      await whatsappService.sendImageMessage(chatId, result.buffer, `_Dibuat oleh Imagen_`);
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `❌ *Gagal Membuat Gambar*\n\n*Alasan:* ${error.message}`, edit: loadingAnimation.message.key });
    }
  }

  async handleYouTube(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    if (!args || args.length === 0 || !mediaService.isValidYouTubeUrl(args[0])) {
      await whatsappService.sendTextMessage(chatId, '❓ *URL tidak valid.*\n*Contoh:* `/yt https://youtube.com/watch?v=...`');
      return;
    }
    const url = args[0];
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, 'Mengunduh video');
    try {
      const result = await mediaService.downloadYouTubeVideo(url, 'video');
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `✅ *Berhasil!* Mengirim video:\n\n*${result.title}*`, edit: loadingAnimation.message.key });
      await whatsappService.sendVideoMessage(chatId, result.buffer, `Ukuran: ${result.sizeFormatted}`);
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `❌ *Gagal Mengunduh*\n\n*Alasan:* ${error.message}`, edit: loadingAnimation.message.key });
    }
  }

  async handleYouTubeAudio(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    if (!args || args.length === 0 || !mediaService.isValidYouTubeUrl(args[0])) {
        await whatsappService.sendTextMessage(chatId, '❓ *URL tidak valid.*\n*Contoh:* `/ytmp3 https://youtube.com/watch?v=...`');
        return;
    }
    const url = args[0];
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, 'Mengunduh audio');
    try {
        const result = await mediaService.downloadYouTubeVideo(url, 'audio');
        loadingAnimation.stop();
        await whatsappService.sendMessage(chatId, { text: `✅ *Berhasil!* Mengirim audio:\n\n*${result.title}*`, edit: loadingAnimation.message.key });
        await whatsappService.sendAudioMessage(chatId, result.buffer);
    } catch (error) {
        loadingAnimation.stop();
        await whatsappService.sendMessage(chatId, { text: `❌ *Gagal Mengunduh*\n\n*Alasan:* ${error.message}`, edit: loadingAnimation.message.key });
    }
  }
  
  async handleTikTok(sock, message, args, user) {
    const chatId = message.key.remoteJid;
    if (!args || args.length === 0 || !mediaService.isValidTikTokUrl(args[0])) {
      await whatsappService.sendTextMessage(chatId, '❓ *URL tidak valid.*\n*Contoh:* `/tiktok https://www.tiktok.com/@user/video/...`');
      return;
    }
    const url = args[0];
    const loadingAnimation = await whatsappService.sendAnimatedLoadingMessage(chatId, 'Mengunduh TikTok');
    try {
      const result = await mediaService.downloadTikTokVideo(url);
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: '✅ *Berhasil!* Mengirim video TikTok...', edit: loadingAnimation.message.key });
      await whatsappService.sendVideoMessage(chatId, result.buffer, `_Video tanpa watermark._`);
    } catch (error) {
      loadingAnimation.stop();
      await whatsappService.sendMessage(chatId, { text: `❌ *Gagal Mengunduh*\n\n*Alasan:* ${error.message}`, edit: loadingAnimation.message.key });
    }
  }

  async handleSticker(sock, message) {
    await whatsappService.sendTextMessage(message.key.remoteJid, '🎨 Untuk membuat stiker, kirim atau balas gambar dengan caption `/sticker`.');
  }

  async handleAnalyze(sock, message) {
    await whatsappService.sendTextMessage(message.key.remoteJid, '🖼️ Untuk menganalisis gambar, kirim atau balas gambar dengan caption `/analyze`.');
  }
  
  async handleHD(sock, message) {
    await whatsappService.sendTextMessage(message.key.remoteJid, '✨ Untuk meningkatkan kualitas gambar, kirim atau balas gambar dengan caption `/hd`.');
  }
  
  async handleSchedule(sock, message) {
      const chatId = message.key.remoteJid;
      const today = scheduleService.getCurrentDayWIB(); 
      const scheduleMessage = scheduleService.getScheduleMessageFor(today);
      await whatsappService.sendTextMessage(chatId, scheduleMessage);
  }

  async handleHelp(sock, message) {
    const helpText = `*AI Concierge*\n\n/ai [pertanyaan]\n/search [topik]\n/image [deskripsi]\n/yt [url]\n/ytmp3 [url]\n/tiktok [url]\n/sticker\n/hd\n/status\n/ping\n/info`;
    await whatsappService.sendTextMessage(message.key.remoteJid, helpText);
  }
  
  async handleStart(sock, message, args, user) {
    const welcomeText = `👋 Halo *${user.name || 'User'}*, selamat datang di *AI Concierge*. Ketik \`/help\` untuk memulai.`;
    await whatsappService.sendTextMessage(message.key.remoteJid, welcomeText);
  }
  
  async handleMenu(sock, message) {
    const menuText = `Silakan ketik \`/help\` untuk melihat semua perintah yang tersedia.`;
    await whatsappService.sendTextMessage(message.key.remoteJid, menuText);
  }

  async handlePing(sock, message) {
    const startTime = Date.now();
    const pongMessage = await whatsappService.sendTextMessage(message.key.remoteJid, 'Menghitung...');
    const latency = Date.now() - startTime;
    await whatsappService.sendMessage(message.key.remoteJid, { text: `*Pong!* ⚡\nKecepatan: *${latency} ms*`, edit: pongMessage.key });
  }

  async handleStatus(sock, message) {
    const uptime = process.uptime();
    const formatUptime = (s) => `${Math.floor(s/3600)} jam, ${Math.floor(s%3600/60)} menit`;
    await whatsappService.sendTextMessage(message.key.remoteJid, `*Status*: Online\n*Waktu Aktif*: ${formatUptime(uptime)}`);
  }
  
  async handleInfo(sock, message) {
    await whatsappService.sendTextMessage(message.key.remoteJid, `*AI Concierge*\nVersi: Final\nModel: ${geminiService.getModel()}`);
  }
  
  async handleUnknownCommand(sock, message, command) {
    await whatsappService.sendTextMessage(message.key.remoteJid, `❓ Perintah \`${command}\` tidak ditemukan.`);
  }

  // Implementasi logging bisa ditambahkan di sini jika diperlukan
}

module.exports = new CommandHandler();