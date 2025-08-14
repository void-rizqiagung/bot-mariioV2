# Bot WhatsApp Node.js dengan PostgreSQL 17 - Enhanced Indonesian AI Bot

## Deskripsi Proyek
Bot WhatsApp Node.js dengan PostgreSQL 17, dirancang khusus untuk pengguna Indonesia dengan fitur AI canggih, professional formatting, dan HANYA aktif di private chat (tidak di grup).

## Status Proyek
- **Status**: Active and Running ✅
- **Versi**: 2.1.0
- **Database**: PostgreSQL 17 - Connected
- **Node.js**: v18+ 
- **WhatsApp**: Connected dan Authenticated
- **Target**: Pengguna Indonesia
- **Startup**: `node main.js` (24/7 mode)

## User Preferences
- **Bahasa**: Bahasa Indonesia sebagai default untuk semua respons AI
- **Format**: Professional text formatting dengan struktur yang jelas
- **Perilaku**: Always-read dan typing indicators aktif
- **View Once**: Auto-forward ke nomor private untuk backup keamanan
- **Status**: Auto-view semua WhatsApp status

## Fitur Utama Terbaru (v2.1.0)
- ✅ **AI Indonesia**: Gemini 2.5 Flash dengan system prompt Indonesia
- ✅ **Professional Format**: Struktur respons yang terorganisir dan profesional
- ✅ **Natural Reading**: Bot menandai pesan dibaca dengan delay natural (1 detik)
- ✅ **Smart Typing**: Indikator mengetik otomatis berhenti setelah 3 detik (tidak terus menerus)
- ✅ **Auto Status View**: Otomatis melihat semua WhatsApp status
- ✅ **View Once Backup**: Forward view once images/videos ke nomor private
- ✅ **Image Analysis**: AI dapat menganalisis gambar dengan detail dalam bahasa Indonesia
- ✅ **URL Detection**: Deteksi otomatis YouTube/TikTok URL dengan panduan command
- ✅ **Indonesian Context**: Respons AI disesuaikan dengan konteks budaya Indonesia
- ✅ **Private Chat Only**: Tetap hanya aktif di private chat (tidak grup)

## Teknologi Stack
- **Runtime**: Node.js 18+
- **Database**: PostgreSQL 17
- **ORM**: Drizzle ORM
- **WhatsApp**: @whiskeysockets/baileys v6.x
- **AI**: Google Gemini 2.5 Flash
- **Logging**: Winston dengan format profesional
- **Server**: Express.js
- **Image Processing**: @whiskeysockets/baileys native

## Enhanced AI Capabilities
```javascript
// System Instruction untuk respons profesional Indonesia
Anda adalah asisten AI WhatsApp yang profesional dan cerdas dengan karakteristik:

BAHASA & GAYA KOMUNIKASI:
- Gunakan bahasa Indonesia sebagai bahasa utama
- Gaya profesional namun ramah dan mudah dipahami
- Struktur jawaban terorganisir dengan format jelas
- Emoji minimal dan kontekstual

FORMAT RESPONS:
- Jawaban komprehensif dan informatif
- Bullet points (•) atau numbering (1.) untuk list
- Paragraf terpisah untuk informasi berbeda
- Kesimpulan atau ringkasan jika diperlukan

KEAHLIAN:
- Menjawab pertanyaan umum dengan akurat
- Penjelasan teknis yang mudah dipahami
- Membantu masalah sehari-hari
- Memberikan saran praktis dan solusi
```

## Enhanced Features
### View Once Message Handling
```javascript
// Konfigurasi view once di settings.js
viewOnce: {
  enabled: true,                // Enable view once forwarding
  forwardToOwner: true,        // Forward ke owner number
  backupEnabled: true,         // Create backup copies
  notifyOwner: true            // Notify owner when view once received
}
```

### Behavior Settings
```javascript
behavior: {
  autoReadMessages: true,      // Always mark as read
  showTypingIndicator: true,   // Always show typing
  autoViewStatus: true,        // Auto view WhatsApp status
  language: 'id',             // Default Indonesian
  professionalFormat: true    // Professional text formatting
}
```

## Project Architecture
### Core Services
- **GeminiService**: Enhanced dengan Indonesian system prompts dan professional formatting
- **WhatsAppService**: Improved dengan typing indicators, read receipts, dan status viewing
- **MessageHandler**: Comprehensive message processing dengan AI analysis dan view once handling
- **MediaService**: Enhanced untuk sticker creation dan media processing
- **Logger**: Professional logging dengan emoji indicators dan structured output

### Recent Changes (August 10, 2025)
- ✅ **Bot Status**: Successfully running and active - confirmed working
- ✅ **Simplified Startup**: Removed complex start.js, using main.js + server.js
- ✅ **Auto-Restart**: 10 restart attempts dengan 5 detik delay
- ✅ **WhatsApp Connected**: Bot authenticated dan terhubung tanpa QR
- ✅ **Upgraded Gemini**: Migrated to Gemini 2.5 Flash untuk performa terbaik
- ✅ **Indonesian AI**: System instruction dioptimalkan untuk bahasa Indonesia
- ✅ **Professional Format**: Auto-formatting untuk respons yang terstruktur
- ✅ **Enhanced WhatsApp**: Typing indicators, read receipts, status viewing
- ✅ **View Once Security**: Auto-backup view once media ke nomor private
- ✅ **Image Analysis**: Deep image analysis dengan konteks Indonesia
- ✅ **URL Intelligence**: Smart URL detection dengan command suggestions
- ✅ **YouTube Download Fix**: Fixed .yt command dengan improved error handling
- ✅ **Typing Behavior Fix**: Menghilangkan typing terus menerus, sekarang natural
- ✅ **Group Security**: Confirmed blocking group messages untuk privacy
- ✅ **Status Auto-View**: Auto viewing WhatsApp status berfungsi sempurna

## Command Structure (Updated)
```javascript
/help - Bantuan lengkap dan daftar perintah
/menu - Menu utama dengan kategori fitur
/ping - Tes koneksi dan status bot
/info - Informasi detail bot dan performa
/ai [pesan] - Chat langsung dengan AI (atau kirim pesan biasa)
/yt [url] - Download video YouTube dengan kualitas terbaik
/ytmp3 [url] - Download audio YouTube MP3
/tiktok [url] - Download video TikTok tanpa watermark
/sticker - Konversi gambar ke sticker (kirim gambar dengan caption)
/analyze - Analisis gambar dengan AI (atau kirim gambar dengan caption)
```

## Environment Variables (Updated)
```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# WhatsApp Configuration
PHONE_NUMBER=6281212236166
BOT_OWNER_JID=6281212236166@s.whatsapp.net
ADMIN_PHONE=6281212236166

# AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Enhanced Features
ENABLE_AI=true
PRIVATE_CHAT_ONLY=true
ENABLE_VIEW_ONCE_FORWARD=true
ENABLE_AUTO_VIEW_STATUS=true
ENABLE_TYPING_INDICATORS=true

# Indonesian Settings
DEFAULT_LANGUAGE=id
BOT_PERSONALITY=professional,intelligent,comprehensive
BOT_LANGUAGE_STYLE=professional

# Performance
AI_MAX_TOKENS=4096
AI_TEMPERATURE=0.4
REQUEST_TIMEOUT=30000

# Server
PORT=5000
```

## Security & Privacy Features
- ✅ **Private Chat Only**: Tidak akan merespons di grup WhatsApp
- ✅ **View Once Backup**: Backup aman view once media ke nomor private
- ✅ **Rate Limiting**: Pembatasan request per user untuk mencegah spam
- ✅ **Content Filtering**: Filter dasar untuk konten tidak pantas
- ✅ **Command Validation**: Validasi ketat untuk semua command input
- ✅ **Error Handling**: Penanganan error yang robust dan informatif
- ✅ **Session Security**: Manajemen session WhatsApp yang aman

## Performance Optimizations
- ✅ **Concurrent Processing**: Multiple tool calls simultaneous untuk efisiensi
- ✅ **Memory Management**: Optimized memory usage untuk media processing
- ✅ **Database Pooling**: Connection pooling untuk performa database
- ✅ **Async Operations**: Non-blocking operations untuk semua I/O
- ✅ **Error Recovery**: Auto-retry mechanism untuk operasi yang gagal

## Installation & Setup
```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan konfigurasi Anda

# Initialize database
npm run db:push

# Start bot (production)
npm start

# Development mode
npm run dev
```

## Monitoring & Analytics
- ✅ **Structured Logging**: Winston dengan format profesional dan emoji indicators
- ✅ **Performance Metrics**: Response time tracking untuk AI dan media operations
- ✅ **User Analytics**: Tracking penggunaan command dan interaksi AI
- ✅ **Error Tracking**: Comprehensive error logging dengan stack traces
- ✅ **Database Health**: Monitor koneksi dan query performance

## Future Enhancements
- 🔄 **Video Analysis**: Analisis video dengan AI (dalam pengembangan)
- 🔄 **Advanced Media**: Enhanced media processing dengan compression
- 🔄 **Web Dashboard**: Interface web untuk monitoring dan konfigurasi
- 🔄 **Multi-language**: Dukungan bahasa tambahan selain Indonesia
- 🔄 **Voice Processing**: Speech-to-text dan text-to-speech capabilities

## Development Notes
- Fokus pada user experience Indonesia dengan respons yang natural dan profesional
- Semua fitur dioptimalkan untuk private chat experience
- View once handling untuk keamanan dan backup
- AI responses selalu dalam bahasa Indonesia dengan format terstruktur
- Performance-first approach dengan concurrent operations