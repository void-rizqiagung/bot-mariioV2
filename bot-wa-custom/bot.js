const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const fs = require('fs-extra');
const readline = require('readline'); // Diperlukan untuk input pengguna di terminal

const logger = require('./services/logger');
const settings = require('./config/settings');
const whatsappService = require('./services/whatsapp');
const messageHandler = require('./handlers/messages');

// Wrapper untuk readline agar bisa digunakan dengan async/await
// Ini akan dibuat hanya saat dibutuhkan untuk menghindari proses yang menggantung
const rlInterface = {
  instance: null,
  question(text) {
    return new Promise((resolve) => {
      if (!this.instance) {
        this.instance = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });
      }
      this.instance.question(text, resolve);
    });
  },
  close() {
    if (this.instance) {
      this.instance.close();
      this.instance = null;
    }
  },
};

class WhatsAppBot {
  constructor() {
    this.sock = null;
    this.isAuthenticated = false;
    this.sessionPath = path.join(__dirname, 'session');
  }

  async initialize() {
    try {
      logger.info('🤖 Menginisialisasi bot WhatsApp...');
      const botConfig = settings.getBotConfig();
      const { state, saveCreds } = await useMultiFileAuthState(this.sessionPath);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info(`📱 Menggunakan WhatsApp versi ${version.join('.')}, Terbaru: ${isLatest}`);

      this.sock = makeWASocket({
        version,
        logger: pino({ level: 'warn' }),
        printQRInTerminal: false, // Wajib false untuk pairing code
        auth: state,
        browser: Browsers.macOS('MacOS'), // Browser agent yang stabil
        generateHighQualityLinkPreview: true,
      });

      // --- LOGIKA PAIRING CODE YANG DISEMPURNAKAN ---
      // Jika bot tidak memiliki kredensial (belum login), jalankan proses pairing
      if (!this.sock.authState.creds.registered) {
        logger.info('Sesi tidak ditemukan. Memulai proses pairing dengan nomor telepon...');
        
        // Meminta nomor telepon dari pengguna. Pastikan menghapus karakter non-numerik.
        const phoneNumber = (await rlInterface.question('Silakan masukkan nomor WhatsApp Anda dengan kode negara (contoh: 6281234567890): ')).replace(/\D/g, '');
        
        if (!phoneNumber) {
            logger.error('Nomor telepon tidak valid. Proses dihentikan.');
            rlInterface.close();
            return;
        }

        logger.info(`Meminta kode pairing untuk nomor: ${phoneNumber}...`);
        const code = await this.sock.requestPairingCode(phoneNumber);
        logger.success(`✅ Kode Pairing Anda adalah: ${code.match(/.{1,4}/g).join('-')}`);
        logger.info('Buka WhatsApp di ponsel Anda > Pengaturan > Perangkat Tertaut > Tautkan perangkat > Tautkan dengan nomor telepon > Masukkan kode di atas.');
      }

      whatsappService.setSock(this.sock);
      this.setupEventHandlers(saveCreds);
      logger.info('✅ Inisialisasi bot WhatsApp selesai.');
    } catch (error) {
      logger.error('💥 Gagal menginisialisasi bot WhatsApp', { error: error.message, stack: error.stack });
      rlInterface.close(); // Pastikan readline ditutup jika terjadi error
      throw error;
    }
  }

  setupEventHandlers(saveCreds) {
    this.sock.ev.on('creds.update', saveCreds);
    this.sock.ev.on('connection.update', (update) => this.handleConnectionUpdate(update));
    this.sock.ev.on('messages.upsert', (m) => this.handleIncomingMessages(m));
  }

  async handleConnectionUpdate(update) {
    const { connection, lastDisconnect } = update;

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      logger.warn(`🔌 Koneksi ditutup. Alasan: ${statusCode} - ${lastDisconnect?.error?.message}`);

      if (shouldReconnect) {
        logger.info('Mencoba menyambung kembali...');
        this.initialize();
      } else {
        logger.error('💥 Sesi keluar (Logged Out). Menghapus sesi lama dan memulai ulang...');
        try {
          // Hapus folder sesi yang korup atau sudah tidak valid
          fs.rmSync(this.sessionPath, { recursive: true, force: true });
        } catch (e) {
          logger.error('💥 Gagal menghapus folder sesi', { error: e.message });
        }
        // Tutup readline dan mulai ulang proses dari awal
        rlInterface.close();
        this.initialize();
      }
    } else if (connection === 'open') {
      logger.success('✅ WhatsApp terhubung dan aktif!');
      this.isAuthenticated = true;
      global.botStatus.connected = true;
      this.emitStatusUpdate();
      this.sock.sendPresenceUpdate('available');
      logger.info('✨ Status bot diatur ke "available" (offline).');
      
      // Tutup interface readline karena sudah tidak diperlukan lagi setelah koneksi berhasil
      rlInterface.close();
    }
  }

  async handleIncomingMessages(m) {
    const message = m.messages[0];
    if (!message || !message.message) return;

    if (message.key.fromMe && process.env.ALLOW_SELF_TESTING !== 'true') {
        return;
    }

    try {
      await messageHandler.processMessage(this.sock, message);
    } catch (error) {
      logger.error('💥 Error saat memproses pesan', { error: error.message });
    }
  }

  emitStatusUpdate() {
    if (global.io) {
      global.io.emit('botStatus', global.botStatus);
    }
  }
}

module.exports = new WhatsAppBot();
