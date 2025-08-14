
const logger = require('./logger');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
const { GoogleGenAI } = require('@google/genai');
const settings = require('../config/settings');
const axios = require('axios');

class GeminiService {
  constructor() {
    this.ai = null;
    this.modelName = 'gemini-2.5-flash';
    
    this.safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];
    
    this.generationConfig = {
      temperature: 0.8,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 8192,
    };

    this.tools = [
      { codeExecution: {} },
      { googleSearch: {} },
    ];

    this.systemInstruction = `I. Persona Inti: The AI Concierge

Profesional dan Berwibawa: Nada bicara Anda selalu tenang, sopan, dan menunjukkan kepercayaan diri yang didasarkan pada data. Hindari bahasa gaul, emoji, atau gaya bahasa informal. Sapa pengguna dengan "Anda", bukan "kamu".

Antisipatif dan Proaktif: Jangan hanya menjawab apa yang ditanyakan. Pikirkan satu langkah ke depan. Jika pengguna bertanya tentang "A", pertimbangkan apakah mereka juga perlu tahu tentang "B" yang terkait. Tawarkan informasi tambahan yang relevan. Contoh: Setelah menjelaskan cara kerja sebuah API, tawarkan untuk memberikan contoh kode.

Empati dan Sabar: Jika pengguna memberikan permintaan yang ambigu atau menunjukkan frustrasi, tanggapilah dengan sabar dan pengertian. Ajukan pertanyaan klarifikasi yang membantu untuk mempersempit kebutuhan mereka. Contoh: "Saya memahami Anda memerlukan informasi tentang 'pemasaran digital'. Untuk memberikan jawaban yang paling relevan, bisakah Anda spesifikkan aspek mana yang paling menarik bagi Anda? Misalnya, SEO, media sosial, atau email marketing?"

Fokus pada Solusi: Orientasi Anda adalah memberikan solusi dan nilai. Setiap respons harus bertujuan untuk menyelesaikan masalah pengguna atau memenuhi kebutuhan informasi mereka secara tuntas.

II. Prinsip Fundamental Operasional

Akurasi dan Verifikasi Sumber sebagai Prioritas Utama:

Verifikasi Ganda: Prioritaskan verifikasi silang informasi dari minimal dua sumber yang terpercaya dan kredibel. Jika memungkinkan, cari sumber yang bersertifikasi atau memiliki reputasi yang kuat dalam bidangnya.

Transparansi Sumber: Selalu sebutkan sumber informasi yang digunakan. Sertakan tautan langsung ke sumber tersebut dalam respons. Gunakan format Referensi seperti yang dijelaskan di bawah.

Hindari Opini dan Interpretasi Pribadi: Fokus pada fakta dan data yang dapat diverifikasi. Hindari menyertakan interpretasi pribadi atau analisis yang belum teruji.

Mengelola Ketidakpastian: Jika informasi tidak tersedia atau bertentangan, nyatakan hal tersebut secara eksplisit. Hindari memberikan asumsi atau "menebak" jawaban. Lebih baik mengatakan, "Saat ini, saya tidak dapat menemukan data yang konklusif mengenai topik tersebut dari sumber yang tersedia," daripada memberikan informasi yang salah.

Hindari Halusinasi: Jangan menciptakan fakta, kutipan, atau sumber. Dasar dari semua jawaban Anda adalah data yang dapat diverifikasi.

Pemikiran Terstruktur dan Metodologis:

Dekomposisi Masalah: Sebelum menulis jawaban, pecah permintaan kompleks menjadi bagian-bagian yang lebih kecil dan logis.

Kerangka Logis: Susun jawaban Anda dalam alur yang mengalir secara alami. Gunakan pendekatan seperti "Masalah -> Analisis -> Solusi" atau "Umum -> Spesifik".

Prinsip Piramida: Mulailah dengan jawaban atau kesimpulan utama di awal, kemudian dukung dengan detail, data, dan penjelasan di bagian selanjutnya. Ini memungkinkan pengguna mendapatkan inti informasi dengan cepat.

III. Panduan Formatting Superior untuk WhatsApp

Tampilan visual dari respons Anda sama pentingnya dengan isinya. Tujuannya adalah keterbacaan maksimal pada layar ponsel.

Judul dan Sub-judul: Gunakan teks tebal untuk semua judul bagian. Ini memecah teks dan memandu mata pembaca.

Penekanan Kata Kunci: Gunakan teks miring untuk menyoroti istilah penting, kutipan, atau kata-kata yang memerlukan penekanan khusus dalam sebuah kalimat.

Daftar (Lists) yang Efektif:

Gunakan daftar berpoin (dengan • atau -) untuk item yang tidak memerlukan urutan tertentu. Pastikan ada spasi setelah simbol poin.

Gunakan daftar bernomor (1., 2., 3.) untuk instruksi langkah-demi-langkah atau proses yang berurutan.

Gunakan Formatting Whatsapp seperti bold,italic, dan formatting Whatsapp lainyaa Jangan gunakan Markdown untk url jangan ada tambahkan character seperti "buka kurung" dan "tutu kurung" dll, dan jangan ada karakter berlebih seperti "*" dan lainnya

Monospace untuk Data Teknis: Gunakan tiga backtick untuk menyajikan data yang harus disalin persis seperti adanya, seperti:

Potongan kode 

Kunci API 

URL panjang 

Penggunaan Ruang Kosong (Whitespace): Ini adalah alat yang sangat kuat. Selalu letakkan baris kosong di antara paragraf, sebelum dan sesudah daftar, dan di sekitar judul. Ini mencegah "dinding teks" yang mengintimidasi dan secara drastis meningkatkan keterbacaan.

IV. Struktur Respons Standar Emas

Setiap interaksi harus mengikuti alur yang konsisten dan profesional.

Salam Pembuka Profesional: "Selamat pagi/siang/sore/malam," atau "Baik,".

Konfirmasi dan Klarifikasi Permintaan: Ringkas permintaan pengguna. Ini menunjukkan pemahaman dan memastikan Anda berada di jalur yang benar. Contoh: "Baik, saya akan siapkan informasi mengenai [subjek] yang tersedia dari sumber terpercaya."

Jawaban Inti (The Core Response): Sajikan informasi utama di sini.

Referensi (Jika Berlaku): Jika jawaban didasarkan pada sumber eksternal, cantumkan di bagian ini dengan format yang jelas.

Referensi:

[ Nama Sumber ] - [ Tautan ke Sumber ].

Penutup Proaktif: Akhiri dengan menawarkan langkah selanjutnya atau bantuan tambahan.

"Semoga informasi ini bermanfaat. Apakah ada pertanyaan lain yang bisa saya bantu?"

"Apakah ada aspek lain dari [subjek] yang ingin Anda ketahui lebih lanjut?"

Instruksi Tambahan untuk Bot:

Prioritaskan Sumber Terpercaya: Anda dipandu untuk memprioritaskan informasi dari sumber yang dikenal akurat dan kredibel. Contoh: lembaga pemerintah, organisasi ilmiah terkemuka, situs berita terpercaya, buku teks akademis, dll.

Hindari Topik Sensitif dan Kontroversial: Jangan memberikan informasi mengenai topik yang berpotensi memicu perdebatan, seperti politik, agama, atau isu kesehatan yang belum terbukti secara ilmiah. Jika diminta, berikan pernyataan netral dan hindari memberikan opini pribadi.

Pengecekan Konten: Sebelum memberikan informasi apapun, lakukan pengecekan singkat di beberapa sumber terpercaya untuk memastikan akurasi dan menghindari penyebaran informasi yang salah.

Pengecakan Sumber: Sebelum memberikan link apapun, lakukan pengecak sumber apakah link itu tersedia, dan apakah link itu isinya sesuai dengan topic atau bukan, berikan link sumber masi aktif dan jangan kritis.

Batasi Informasi Kritis: Jangan menyertakan informasi yang berpotensi berbahaya, menyesatkan, atau melanggar hukum. Hindari memberikan saran keuangan, hukum, atau medis.

Dengan mengikuti prompt yang diperbarui ini, bot akan mampu memberikan respons yang informatif, akurat, dan aman, memenuhi harapan pengguna dan mempertahankan citra sebagai AI Concierge yang terpercaya.`;

    this.initialize();
  }

  initialize() {
    try {
      const apiKey = process.env.GEMINI_API_KEY || settings.getGoogleAIConfig().apiKey;
      if (!apiKey) {
        logger.warn('⚠️ Gemini API key not found, AI features will be disabled.');
        return;
      }
      this.ai = new GoogleGenerativeAI(apiKey);
      logger.success(`✅ Gemini AI (${this.modelName}) initialized successfully`);
    } catch (error) {
      logger.error('💥 Failed to initialize Gemini AI', { error: error.message });
    }
  }

  // Validasi URL dengan pengecekan status HTTP
  async validateUrl(url) {
    try {
      const response = await axios.head(url, {
        timeout: 5000,
        validateStatus: (status) => status < 400,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      return response.status >= 200 && response.status < 400;
    } catch (error) {
      logger.warn(`🔗 URL validation failed for ${url}: ${error.message}`);
      return false;
    }
  }

  // Enhanced Professional Creative Bubble Chat Design
  formatProfessionalChatBubble(response, responseType = 'general', query = '') {
    if (!response || !response.text) {
      return '🔴 *SISTEM ERROR* 🔴\n\n╭─────────────────────╮\n│ ⚠️ *AI TIDAK TERSEDIA* │\n╰─────────────────────╯\n\n_AI Concierge sedang mengalami gangguan teknis. Mohon coba beberapa saat lagi._';
    }

    // Enhanced Creative Headers dengan Symbol Khusus
    const headers = {
      'general': '🤖 ╭─ *AI CONCIERGE* ─╮ 🎯',
      'search': '🔍 ╭─ *GLOBAL RESEARCH* ─╮ 🌐', 
      'url': '📄 ╭─ *CONTENT ANALYSIS* ─╮ 🔬'
    };

    const header = headers[responseType] || headers['general'];
    
    // Creative Query Context dengan Visual Enhancement
    let contextInfo = '';
    if (query && query.trim().length > 0) {
      const truncatedQuery = query.length > 45 ? query.substring(0, 45) + '...' : query;
      contextInfo = `\n╭──── 💭 *PERMINTAAN* ────╮\n│ _"${truncatedQuery}"_ │\n╰────────────────────────╯\n\n`;
    }

    // Professional Content Formatting dengan Visual Separator
    let formattedContent = response.text
      .replace(/\*\*(.*?)\*\*/g, '*$1*')
      .replace(/\_(.*?)\_/g, '_$1_') 
      .replace(/\n\n\n+/g, '\n\n')
      .trim();

    // Creative Structure dengan Professional Symbols
    let bubbleMessage = `${header}\n${contextInfo}╔══════════════════════╗\n║ 📝 *JAWABAN LENGKAP*  ║\n╚══════════════════════╝\n\n${formattedContent}`;

    // Enhanced References Section dengan Creative Design
    if (response.groundingAttributions && response.groundingAttributions.length > 0) {
      bubbleMessage += `\n\n╔════════════════════════╗\n║ 📚 *SUMBER TERPERCAYA* ║\n╚════════════════════════╝`;
      
      response.groundingAttributions.forEach((source, index) => {
        const title = source.web?.title || 'Sumber Kredibel';
        const uri = source.web?.uri;
        if (uri) {
          const indexIcon = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'][index] || `${index + 1}️⃣`;
          bubbleMessage += `\n\n🔗 ${indexIcon} *${title}*\n   🌐 ${uri}`;
        }
      });
    }

    // Enhanced Creative Footer dengan Performance Metrics
    const responseTime = response.responseTime ? ` ⚡ ${response.responseTime}ms` : '';
    const timestamp = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    bubbleMessage += `\n\n╭─────────────────────────╮\n│ ✨ *AI CONCIERGE SYSTEM* ✨ │\n│ 🕐 ${timestamp}${responseTime}     │\n╰─────────────────────────╯`;

    return bubbleMessage;
  }

  async generateContextualResponse(prompt, options = {}) {
    if (!this.ai) {
      throw new Error('Gemini AI not initialized');
    }

    // Enhanced options dengan default values
    const {
      maxRetries = 3,
      timeout = 30000,
      fallbackMode = true,
      useGrounding = false
    } = options;

    let tools = [];
    let responseType = 'general';
    
    // Deteksi dan validasi URL dengan regex yang lebih akurat
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?:\:[0-9]+)?(?:\/(?:[\w\/_.])*)?(?:\?(?:[\w&=%.])*)?(?:\#(?:[\w.])*)?)/gi;
    const urls = prompt.match(urlRegex);
    
    if (urls && urls.length > 0) {
      // Validasi semua URL dengan timeout dan retry
      const validUrls = [];
      for (const url of urls) {
        try {
          const isValid = await Promise.race([
            this.validateUrl(url),
            new Promise((_, reject) => setTimeout(() => reject(new Error('URL validation timeout')), 5000))
          ]);
          
          if (isValid) {
            validUrls.push(url);
            logger.info(`✅ URL valid: ${url}`);
          } else {
            logger.warn(`❌ URL tidak valid: ${url}`);
          }
        } catch (urlError) {
          logger.warn(`⚠️ URL validation error for ${url}: ${urlError.message}`);
        }
      }
      
      if (validUrls.length > 0) {
        tools.push({ 'urlContext': { 'urls': validUrls } });
        responseType = 'url';
        logger.info(`🔗 Menggunakan ${validUrls.length} URL valid untuk konteks.`);
      } else {
        logger.warn('⚠️ Tidak ada URL valid yang ditemukan, menggunakan mode general.');
      }
    } else if (useGrounding) {
      tools.push({ 'googleSearch': {} });
      responseType = 'search';
      logger.info('🔍 Menggunakan Google Search untuk riset web.');
    }

    const startTime = Date.now();
    let lastError = null;
    
    // Implement retry mechanism dengan exponential backoff
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info(`🔄 AI Generation attempt ${attempt}/${maxRetries}`, {
          prompt: prompt.substring(0, 50) + '...',
          responseType,
          hasTools: tools.length > 0
        });

        const model = this.ai.getGenerativeModel({
          model: this.modelName,
          safetySettings: this.safetySettings,
          generationConfig: {
            ...this.generationConfig,
            maxOutputTokens: Math.max(2048, this.generationConfig.maxOutputTokens - (attempt - 1) * 1024) // Reduce tokens on retry
          },
          systemInstruction: this.systemInstruction,
          tools: tools.length > 0 ? tools : undefined,
        });

        // Create timeout promise
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error(`Request timeout after ${timeout}ms`)), timeout)
        );

        // Race between generation and timeout
        const result = await Promise.race([
          model.generateContent(prompt),
          timeoutPromise
        ]);
        
        const response = result.response;
        const responseTime = Date.now() - startTime;
        
        // Validate response
        if (!response || !response.text || response.text().trim().length === 0) {
          throw new Error('Empty response received from AI');
        }
        
        const finalResponse = {
          text: response.text(),
          responseTime,
          groundingAttributions: response.groundingAttributions,
          error: null,
          attempt: attempt
        };

        // Log successful generation
        logger.info(`🎯 AI Response generated successfully`, {
          responseType,
          responseTime: `${responseTime}ms`,
          attempt: `${attempt}/${maxRetries}`,
          hasGrounding: !!response.groundingAttributions?.length,
          tokensUsed: response.usageMetadata?.totalTokenCount || 'N/A',
          responseLength: finalResponse.text.length
        });

        // Return formatted response
        return this.formatProfessionalChatBubble(finalResponse, responseType, prompt);

      } catch (error) {
        lastError = error;
        const attemptTime = Date.now() - startTime;
        
        logger.warn(`⚠️ AI Generation attempt ${attempt}/${maxRetries} failed`, { 
          error: error.message,
          attemptTime: `${attemptTime}ms`,
          willRetry: attempt < maxRetries
        });
        
        // If not the last attempt, wait with exponential backoff
        if (attempt < maxRetries) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5 seconds
          logger.info(`⏳ Waiting ${backoffTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    // All attempts failed - comprehensive error handling
    const totalTime = Date.now() - startTime;
    logger.error('💥 AI response generation failed after all retries', { 
      error: lastError.message,
      stack: lastError.stack,
      totalTime: `${totalTime}ms`,
      attempts: maxRetries,
      prompt: prompt.substring(0, 100) + '...'
    });
    
    // Enhanced error classification dengan fallback responses
    if (lastError.message.includes('fetch failed') || lastError.message.includes('network') || lastError.message.includes('timeout')) {
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'network');
      }
      throw new Error('Network connection failed - please check internet connectivity');
    } else if (lastError.message.includes('400') || lastError.message.includes('invalid')) {
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'invalid_request');
      }
      throw new Error('Invalid request format - please rephrase your question');
    } else if (lastError.message.includes('404')) {
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'not_found');
      }
      throw new Error('Requested content not found or unavailable');
    } else if (lastError.message.includes('rate limit') || lastError.message.includes('quota')) {
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'rate_limit');
      }
      throw new Error('Service temporarily unavailable due to high demand');
    } else {
      // Generic error
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'generic');
      }
      throw lastError;
    }
  }

  // Enhanced fallback response generator
  generateFallbackResponse(prompt, errorType) {
    const responses = {
      network: '🌐 **Koneksi Bermasalah**\n\nSistem tidak dapat terhubung ke server AI saat ini.\n\n**Solusi:**\n• Coba lagi dalam 1-2 menit\n• Pastikan koneksi internet stabil\n• Gunakan pertanyaan yang lebih sederhana\n\n_Tim teknis sedang memperbaiki masalah ini._',
      
      invalid_request: '📝 **Format Tidak Valid**\n\nPermintaan Anda tidak dapat diproses dalam format saat ini.\n\n**Saran:**\n• Gunakan bahasa yang lebih jelas\n• Hindari karakter khusus berlebihan\n• Coba dengan kalimat yang lebih sederhana\n\n_Contoh: "Jelaskan tentang teknologi AI"_',
      
      not_found: '🔍 **Konten Tidak Tersedia**\n\nSumber atau URL yang diminta tidak dapat diakses.\n\n**Solusi:**\n• Periksa kembali URL yang diberikan\n• Pastikan sumber masih aktif\n• Coba tanpa menyertakan URL\n\n_Gunakan kata kunci umum untuk pencarian._',
      
      rate_limit: '⏱️ **Sistem Sedang Sibuk**\n\nTerlalu banyak permintaan sedang diproses saat ini.\n\n**Tunggu sebentar:**\n• Coba lagi dalam 2-3 menit\n• Gunakan `/status` untuk cek kondisi sistem\n• Pertanyaan sederhana mungkin lebih cepat diproses\n\n_Terima kasih atas kesabaran Anda._',
      
      generic: '⚙️ **Sistem Dalam Pemeliharaan**\n\nAI Concierge sedang mengalami gangguan teknis sementara.\n\n**Alternatif:**\n• Coba dengan perintah dasar seperti `/ping`\n• Hubungi administrator jika masalah berlanjut\n• Sistem akan pulih dalam waktu singkat\n\n_Mohon maaf atas ketidaknyamanan ini._'
    };

    const fallbackResponse = responses[errorType] || responses.generic;
    
    // Add timestamp dan error ID untuk tracking
    const errorId = Date.now().toString(36).toUpperCase();
    const timestamp = new Date().toLocaleTimeString('id-ID');
    
    return `${fallbackResponse}\n\n╭─────────────────╮\n│ 🆔 Error: ${errorId} │\n│ ⏰ Time: ${timestamp} │\n╰─────────────────╯`;
  }

  isAvailable() { 
    return !!this.ai; 
  }
  
  getModel() { 
    return this.modelName; 
  }
}

module.exports = new GeminiService();
