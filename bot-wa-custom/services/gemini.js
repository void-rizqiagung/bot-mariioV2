
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

  // Enhanced URL validation dengan improved reliability dan comprehensive error handling
  async validateUrl(url) {
    // Smart URL preprocessing yang lebih permissive
    const cleanUrl = this.preprocessUrl(url);
    if (!cleanUrl) return false;

    // Diverse user agents untuk menghindari blocking
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Android 13; Mobile; rv:109.0) Gecko/109.0 Firefox/109.0'
    ];

    // Enhanced retry strategy dengan progressive fallback
    const strategies = [
      { method: 'head', timeout: 15000, description: 'Quick HEAD check' },
      { method: 'get', timeout: 20000, description: 'Full GET request' },
      { method: 'get', timeout: 30000, description: 'Extended timeout GET' }
    ];

    for (let attempt = 1; attempt <= strategies.length; attempt++) {
      try {
        const strategy = strategies[attempt - 1];
        const userAgent = userAgents[(attempt - 1) % userAgents.length];
        
        logger.info(`🔍 URL validation attempt ${attempt}/${strategies.length} (${strategy.description}): ${cleanUrl}`);
        
        const config = {
          method: strategy.method,
          url: cleanUrl,
          timeout: strategy.timeout,
          maxRedirects: 10, // Increased redirects
          validateStatus: (status) => status < 500, // Accept all client errors as valid
          headers: {
            'User-Agent': userAgent,
            'Accept': strategy.method === 'head' 
              ? '*/*' 
              : 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
            'Accept-Encoding': 'gzip, deflate, br',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Upgrade-Insecure-Requests': '1',
            'Connection': 'keep-alive'
          }
        };

        // Untuk certain domains, skip SSL verification
        const relaxedDomains = ['blogspot.com', 'wordpress.com', 'medium.com', 'github.io'];
        if (relaxedDomains.some(domain => cleanUrl.includes(domain))) {
          config.httpsAgent = new (require('https').Agent)({ rejectUnauthorized: false });
        }

        const response = await axios(config);
        
        // Success criteria yang lebih comprehensive
        if (response.status >= 200 && response.status < 400) {
          logger.info(`✅ URL validation SUCCESS (${response.status}) - attempt ${attempt}: ${cleanUrl}`);
          return true;
        } else if (response.status >= 400 && response.status < 500) {
          // Client errors - check if it's a real 404 or access restriction
          if (response.status === 403 || response.status === 401) {
            logger.warn(`🔒 URL requires authentication (${response.status}) but exists: ${cleanUrl}`);
            return true; // URL exists but needs auth - still valid for AI processing
          } else if (response.status === 404) {
            logger.warn(`❌ URL not found (404): ${cleanUrl}`);
            return false; // True 404
          } else {
            logger.warn(`⚠️ URL client error (${response.status}): ${cleanUrl}`);
            // Continue to next attempt for other 4xx errors
          }
        }
        
      } catch (error) {
        const isLastAttempt = attempt === strategies.length;
        const errorCode = error.code || 'UNKNOWN';
        const errorMessage = error.message || 'Unknown error';
        
        logger.warn(`⚠️ URL validation attempt ${attempt}/${strategies.length} failed for ${cleanUrl}:`, {
          error: errorMessage,
          code: errorCode,
          willRetry: !isLastAttempt
        });
        
        // Specific error handling
        if (errorCode === 'ENOTFOUND') {
          logger.error(`❌ Domain not found: ${cleanUrl}`);
          return false; // Don't retry DNS failures
        } else if (errorCode === 'ECONNREFUSED') {
          logger.error(`❌ Connection refused: ${cleanUrl}`);
          return false; // Don't retry connection refused
        }
        
        if (isLastAttempt) {
          // Final attempt failed - comprehensive error classification
          logger.error(`❌ URL validation completely failed after all attempts: ${cleanUrl}`, {
            finalError: errorMessage,
            finalCode: errorCode
          });
          return false;
        }
        
        // Progressive backoff dengan jitter
        const backoffTime = Math.min(2000 * Math.pow(1.5, attempt - 1), 8000);
        const jitter = Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, backoffTime + jitter));
      }
    }
    
    return false;
  }

  // Enhanced URL preprocessing yang lebih smart dan permissive
  preprocessUrl(url) {
    try {
      // Enhanced cleaning - preserve more valid characters
      let cleaned = url.trim();
      
      // Remove invisible/control characters but preserve valid URL chars
      cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
      
      // Basic URL structure validation dengan improved regex
      const urlPattern = /^https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?::[0-9]+)?(?:\/[^\s]*)?$/i;
      if (!urlPattern.test(cleaned)) {
        // Try to fix common URL issues
        if (cleaned.startsWith('www.')) {
          cleaned = 'https://' + cleaned;
        } else if (cleaned.includes('.') && !cleaned.startsWith('http')) {
          cleaned = 'https://' + cleaned;
        }
        
        // Revalidate after fixing
        if (!urlPattern.test(cleaned)) {
          logger.warn(`⚠️ Invalid URL pattern after preprocessing: ${cleaned}`);
          return null;
        }
      }
      
      // Create URL object for advanced validation
      const urlObj = new URL(cleaned);
      
      // Relaxed domain blocking - only block obviously invalid ones
      const blockedDomains = [
        'localhost', '127.0.0.1', '0.0.0.0', '::1',
        'example.com', 'example.org', 'example.net',
        'test.com', 'test.org', 'test.net',
        'invalid.com', 'fake.com'
      ];
      
      if (blockedDomains.includes(urlObj.hostname.toLowerCase())) {
        logger.warn(`⚠️ Blocked domain detected: ${urlObj.hostname}`);
        return null;
      }
      
      // Additional domain validation
      if (urlObj.hostname.includes('..') || urlObj.hostname.startsWith('.') || urlObj.hostname.endsWith('.')) {
        logger.warn(`⚠️ Invalid domain format: ${urlObj.hostname}`);
        return null;
      }
      
      logger.info(`✅ URL preprocessing successful: ${urlObj.href}`);
      return urlObj.href;
      
    } catch (error) {
      logger.warn(`⚠️ URL preprocessing failed for: ${url}`, {
        error: error.message,
        errorType: error.constructor.name
      });
      return null;
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
    
    // Enhanced URL detection dengan improved regex pattern
    const urlRegex = /(https?:\/\/(?:[-\w.])+(?:\.[a-zA-Z]{2,})+(?::[0-9]+)?(?:\/[^\s]*)?)/gi;
    const urls = prompt.match(urlRegex);
    
    if (urls && urls.length > 0) {
      logger.info(`🔍 Detected ${urls.length} URL(s) for validation: ${urls.join(', ')}`);
      
      // Enhanced URL validation dengan comprehensive feedback
      const urlValidationResults = [];
      
      for (const url of urls) {
        try {
          logger.info(`⏳ Validating URL: ${url}`);
          
          const isValid = await Promise.race([
            this.validateUrl(url),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Validation timeout exceeded')), 25000)
            )
          ]);
          
          urlValidationResults.push({
            url,
            valid: isValid,
            status: isValid ? 'success' : 'failed',
            reason: isValid ? 'accessible' : 'not_accessible'
          });
          
          if (isValid) {
            logger.info(`✅ URL validation SUCCESS: ${url}`);
          } else {
            logger.warn(`❌ URL validation FAILED: ${url}`);
          }
          
        } catch (urlError) {
          logger.error(`💥 URL validation ERROR for ${url}: ${urlError.message}`);
          urlValidationResults.push({
            url,
            valid: false,
            status: 'error',
            reason: urlError.message.includes('timeout') ? 'timeout' : 'error'
          });
        }
      }
      
      // Process validation results
      const validUrls = urlValidationResults.filter(result => result.valid).map(result => result.url);
      const invalidUrls = urlValidationResults.filter(result => !result.valid);
      
      if (validUrls.length > 0) {
        // Use grounding dengan valid URLs
        tools = [{ googleSearch: {} }];
        responseType = 'url';
        
        // Enhanced context dengan URL validation feedback
        let urlContext = `Sumber URL yang berhasil diverifikasi:\n`;
        validUrls.forEach((url, index) => {
          urlContext += `${index + 1}. ${url}\n`;
        });
        
        if (invalidUrls.length > 0) {
          urlContext += `\nCatatan: ${invalidUrls.length} URL lainnya tidak dapat diakses saat ini.\n`;
        }
        
        prompt = `${prompt}\n\n${urlContext}\nBerikan jawaban berdasarkan informasi dari sumber URL yang valid di atas.`;
        
        logger.info(`🔗 Using ${validUrls.length}/${urls.length} valid URLs for AI processing`);
        
      } else {
        // Semua URL gagal validasi - berikan feedback detail
        logger.warn(`⚠️ All ${urls.length} URLs failed validation, switching to search mode`);
        
        // Categorize failures untuk feedback yang lebih baik
        const timeoutFailures = invalidUrls.filter(r => r.reason === 'timeout').length;
        const accessFailures = invalidUrls.filter(r => r.reason === 'not_accessible').length;
        const errorFailures = invalidUrls.filter(r => r.reason === 'error').length;
        
        // Enhanced prompt dengan explanation
        let failureExplanation = `\n\nCatatan: URL yang diberikan tidak dapat diakses`;
        if (timeoutFailures > 0) failureExplanation += ` (${timeoutFailures} timeout)`;
        if (accessFailures > 0) failureExplanation += ` (${accessFailures} tidak tersedia)`;
        if (errorFailures > 0) failureExplanation += ` (${errorFailures} error)`;
        failureExplanation += `. Saya akan menjawab berdasarkan pengetahuan umum dan pencarian web.`;
        
        prompt = prompt + failureExplanation;
        tools = [{ googleSearch: {} }];
        responseType = 'search';
      }
    } else if (useGrounding) {
      // Enhanced Google Search configuration
      tools = [{ googleSearch: {} }];
      responseType = 'search';
      logger.info('🔍 Menggunakan Google Search untuk riset web mendalam.');
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
    } else if (lastError.message.includes('400') || lastError.message.includes('invalid') || lastError.message.includes('Bad Request')) {
      logger.warn('🚫 Invalid request detected, attempting fallback without tools');
      
      // Try again without tools as fallback
      if (tools.length > 0) {
        try {
          const simpleModel = this.ai.getGenerativeModel({
            model: this.modelName,
            safetySettings: this.safetySettings,
            generationConfig: { ...this.generationConfig, maxOutputTokens: 2048 },
            systemInstruction: this.systemInstruction
            // No tools - simple generation
          });
          
          const simpleResult = await simpleModel.generateContent(prompt.replace(/\n\nGunakan informasi dari sumber berikut[\s\S]*/, ''));
          const simpleResponse = simpleResult.response;
          
          if (simpleResponse && simpleResponse.text && simpleResponse.text().trim()) {
            const fallbackResponse = {
              text: simpleResponse.text(),
              responseTime: Date.now() - startTime,
              groundingAttributions: null,
              error: 'fallback_mode',
              attempt: maxRetries + 1
            };
            
            logger.info('✅ Fallback generation successful without tools');
            return this.formatProfessionalChatBubble(fallbackResponse, 'general', prompt);
          }
        } catch (fallbackError) {
          logger.error('💥 Fallback generation also failed', { error: fallbackError.message });
        }
      }
      
      if (fallbackMode) {
        return this.generateFallbackResponse(prompt, 'invalid_request');
      }
      throw new Error('Invalid request format - please rephrase your question');
    } else if (lastError.message.includes('404') || lastError.message.includes('Not Found')) {
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
      
      not_found: '🔍 **URL Tidak Dapat Diakses**\n\nSumber atau URL yang diminta tidak dapat dijangkau oleh sistem.\n\n**Kemungkinan Penyebab:**\n• URL memerlukan login/authentication\n• Website memblokir akses bot\n• Server sementara tidak available\n• URL sudah tidak aktif (404)\n\n**Solusi:**\n• Pastikan URL dapat dibuka di browser\n• Coba dengan URL dari domain lain\n• Gunakan kata kunci untuk pencarian umum\n• Sertakan konten/teks URL secara manual\n\n_AI akan tetap berusaha menjawab berdasarkan pengetahuan yang tersedia._',
      
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
