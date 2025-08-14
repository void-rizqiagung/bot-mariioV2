const axios = require('axios');
const FormData = require('form-data');
const logger = require('./logger');

class ImageService {
  constructor() {
    this.apiKey = process.env.STABILITY_API_KEY;
    if (!this.apiKey) {
      logger.error('❌ KRITIS: STABILITY_API_KEY tidak ditemukan di environment variables!');
    }
  }

  async upscaleImage(imageBuffer) {
    if (!this.apiKey) {
      throw new Error('API Key untuk Stability AI tidak ditemukan. Periksa file .env Anda.');
    }
    
    // API Stability AI memiliki batas ukuran file input 5MB
    const MAX_FILE_SIZE_MB = 5;
    if (imageBuffer.length > MAX_FILE_SIZE_MB * 1024 * 1024) {
        throw new Error(`Gambar terlalu besar (maksimal ${MAX_FILE_SIZE_MB}MB). Harap kirim gambar yang lebih kecil.`);
    }

    try {
      logger.info('🖼️ Mengirim gambar ke API Stability AI untuk upscaling...');
      
      const form = new FormData();
      // Nama field harus 'image' sesuai dokumentasi Stability AI
      form.append('image', imageBuffer, { filename: 'input.png', contentType: 'image/png' });

      const response = await axios.post(
        'https://api.stability.ai/v2beta/stable-image/upscale/fast',
        form,
        {
          headers: {
            // Header harus 'Authorization: Bearer KEY'
            'Authorization': `Bearer ${this.apiKey}`,
            'Accept': 'image/*', // Menerima respons gambar
            ...form.getHeaders()
          },
          // Respons dari Stability AI adalah file gambar langsung
          responseType: 'arraybuffer' 
        }
      );

      logger.info('✅ Gambar berhasil di-upscale oleh Stability AI.');
      
      return Buffer.from(response.data);

    } catch (error) {
      // Menangani error dari Stability AI
      const status = error.response?.status;
      let errorMessage = error.message;
      
      if (status === 401) {
          errorMessage = 'API Key Stability AI tidak valid atau salah. Silakan periksa kembali.';
      } else if (error.response?.data) {
          // Mencoba membaca error dari buffer jika ada
          try {
              const errorJson = JSON.parse(error.response.data.toString());
              errorMessage = errorJson.errors ? errorJson.errors.join(', ') : 'Terjadi kesalahan pada API.';
          } catch (e) {
              errorMessage = 'Gagal memproses permintaan. Coba lagi.';
          }
      }
      
      logger.error('💥 Gagal melakukan upscale gambar dengan Stability AI', { status, error: errorMessage });
      throw new Error(`Gagal memproses gambar: ${errorMessage}`);
    }
  }
}

module.exports = new ImageService();