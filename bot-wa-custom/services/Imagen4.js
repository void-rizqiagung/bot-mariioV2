const { GoogleGenAI } = require('@google/genai');
const logger = require('./logger'); // Menggunakan logger yang sama dengan service lain

/**
 * Fungsi untuk membuat gambar menggunakan model Imagen 4.
 * @param {string} rawPrompt - String prompt lengkap dari pengguna, contoh: "kucing astronot --ar 16:9".
 * @returns {Promise<{buffer: Buffer, prompt: string}>} - Mengembalikan buffer gambar dan prompt yang sudah dibersihkan.
 * @throws {Error} - Melemparkan error jika gagal.
 */
async function generateImage(rawPrompt) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    throw new Error('Kunci API Gemini tidak di-set di environment.');
  }

  let cleanPrompt = rawPrompt;
  let aspectRatio = '1:1'; // Default
  const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
  const arRegex = /--ar\s+([1-9][0-6]?\:[1-9][0-6]?)/;
  const match = rawPrompt.match(arRegex);

  if (match && match[1] && validAspectRatios.includes(match[1])) {
    aspectRatio = match[1];
    cleanPrompt = rawPrompt.replace(arRegex, '').trim();
  }

  if (!cleanPrompt) {
    throw new Error('Prompt tidak boleh kosong.');
  }

  try {
    const ai = new GoogleGenAI(apiKey);
    const modelName = 'models/imagen-4.0-generate-preview-06-06';
    const config = {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      personGeneration: 'ALLOW_ALL',
      aspectRatio: aspectRatio,
    };

    logger.info(`🎨 [Imagen4] Requesting image with prompt: "${cleanPrompt}"`);
    const response = await ai.models.generateImages({ model: modelName, prompt: cleanPrompt, config });

    const imageData = response?.generatedImages?.[0];
    if (!imageData?.image?.imageBytes) {
      throw new Error('Respons dari API tidak valid atau tidak mengandung data gambar.');
    }
    
    return {
        buffer: Buffer.from(imageData.image.imageBytes, 'base64'),
        prompt: cleanPrompt
    };

  } catch (error) {
    logger.error('💥 [Imagen4] Gagal membuat gambar:', error);
    throw error;
  }
}

module.exports = { generateImage };