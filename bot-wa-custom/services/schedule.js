const whatsappService = require('./whatsapp');
const logger = require('./logger');
const scheduleService = require('../services/schedule'); // Pastikan ini ada jika belum

// Data jadwal tidak perlu diubah
const scheduleData = {
    1: { // Senin
        day: "Senin",
        uniform: "Seragam Putih-Hijau",
        specialUniform: "Kaos Olahraga (saat jam Olahraga)",
        subjects: ["07.00 - 07.35: 🌅 Upacara", "07.35 - 08.10: 📋 Briefing", "08.10 - 09.20: 🏃 Olahraga", "09.40 - 10.50: 🇯🇵 Bahasa Jepang", "10.50 - 12.00: 🕌 PAI", "13.00 - 13.35: 🕋 Muhammadiyah", "13.35 - 14.45: 🇬🇧 Bahasa Inggris"]
    },
    2: { // Selasa
        day: "Selasa",
        uniform: "Seragam Putih-Abu",
        specialUniform: "Wearpack (Baju Bengkel)",
        subjects: ["07.00 - 10.15: 🛠️ Bengkel Rizki", "10.15 - 14.10: 🔩 Bengkel Yahya", "14.10 - 14.45: 📐 MTK"]
    },
    3: { // Rabu
        day: "Rabu",
        uniform: "Seragam HW (Muhammadiyah)",
        specialUniform: null,
        subjects: ["07.00 - 08.10: 📖 Kuliah Duha", "08.10 - 09.20: 🇦🇪 Bahasa Arab", "09.40 - 10.50: 📐 MTK", "10.50 - 12.00: 🕌 PAI", "13.00 - 13.35: 🕋 Muhammadiyah", "13.35 - 14.45: 💼 PKK"]
    },
    4: { // Kamis
        day: "Kamis",
        uniform: "Seragam Batik-Hijau",
        specialUniform: "Wearpack (Baju Bengkel)",
        subjects: ["07.00 - 10.15: 🔧 Bengkel Adi", "10.15 - 14.45: 🔩 Bengkel Yahya"]
    },
    5: { // Jumat
        day: "Jum'at",
        uniform: "Baju Muslim (Koko) & Celana Abu",
        specialUniform: null,
        subjects: ["07.00 - 08.10: 📜 Sejarah", "08.10 - 09.20: 🇮🇩 PKN", "09.40 - 11.25: 🇮🇩 Bahasa Indonesia"]
    }
};

class ScheduleService {

    // --- PERBAIKAN UTAMA: Logika Zona Waktu yang Andal ---
    getCurrentDayWIB() {
        // 1. Dapatkan waktu saat ini dalam UTC
        const now = new Date();
        // 2. Tambahkan 7 jam untuk mengonversi ke zona waktu WIB (UTC+7)
        const wibTime = new Date(now.getTime() + (7 * 60 * 60 * 1000));
        // 3. Dapatkan hari dari waktu yang sudah disesuaikan (menggunakan getUTCDay karena basis kita sekarang adalah UTC yang sudah di-offset)
        return wibTime.getUTCDay(); // 0 = Minggu, 1 = Senin, ..., 6 = Sabtu
    }

    getScheduleMessageFor(dayIndex) {
        const schedule = scheduleData[dayIndex];

        if (!schedule) {
            return "🗓️ *Jadwal Hari Ini*\n\nLibur! Saatnya istirahat dan bersantai. ✨";
        }

        let message = `*🗓️ JADWAL HARI INI - ${schedule.day.toUpperCase()}*\n\n`;
        message += `*Seragam*: ${schedule.uniform}\n`;
        if (schedule.specialUniform) {
            message += `*Tambahan*: Jangan lupa bawa *${schedule.specialUniform}*!\n`;
        }
        message += "\n*📚 Pelajaran & Buku:*\n";
        schedule.subjects.forEach(subject => {
            message += `• ${subject}\n`;
        });
        message += "\nSemangat untuk hari ini! 💪";
        return message;
    }

    async sendDailySchedule() {
        const today = this.getCurrentDayWIB(); // Gunakan fungsi yang sudah diperbaiki
        const recipient = (process.env.ADMIN_PHONE || process.env.PHONE_NUMBER) + '@s.whatsapp.net'; 

        if (!recipient.includes('@s.whatsapp.net')) {
            logger.warn('⚠️ Tidak bisa mengirim jadwal harian: ADMIN_PHONE tidak diatur di .env');
            return;
        }

        const message = this.getScheduleMessageFor(today);
        
        try {
            await whatsappService.sendTextMessage(recipient, message);
            logger.info(`✅ Jadwal harian untuk hari ${scheduleData[today]?.day || 'Libur'} berhasil dikirim.`);
        } catch (error) {
            logger.error('💥 Gagal mengirim jadwal harian', { error: error.message });
        }
    }
}

module.exports = new ScheduleService();