<<<<<<< HEAD
# image-metadata-app
AI AGENT image-metadata-app
=======
Adobe Stock Metadata Generator
Aplikasi web untuk menganalisis gambar dan secara otomatis menghasilkan metadata (judul dan kata kunci) yang dioptimalkan untuk Adobe Stock menggunakan Gemini API.

Fitur
Unggah Gambar: Mendukung unggahan gambar dengan seret-dan-lepas (JPG, JPEG, PNG).

Pratinjau Gambar: Menampilkan pratinjau gambar yang diunggah.

Pembuatan Metadata AI: Menganalisis konten gambar dan menghasilkan judul yang relevan serta 5-20 kata kunci yang dioptimalkan SEO menggunakan Gemini API.

Salin Cepat: Tombol untuk menyalin judul dan kata kunci yang dihasilkan ke papan klip.

Ekspor CSV: Mengekspor semua hasil (nama file, judul, kata kunci) ke file CSV.

Persyaratan
Node.js (versi LTS direkomendasikan)

npm (datang dengan Node.js)

Kunci API Google Gemini dari Google AI Studio

Persiapan Lokal
Kloning repositori (atau buat folder dan file secara manual):

Jika Anda mengkloning, lewati langkah pembuatan folder dan file, lalu langsung ke cd image-metadata-app. Jika tidak, buat struktur folder seperti yang disebutkan di atas dan masukkan kode ke dalam file yang sesuai.

# Jika Anda menggunakan git
git clone <URL_REPOSitori_INI>
cd image-metadata-app

Instal dependensi:

Navigasikan ke direktori proyek (image-metadata-app) di terminal Anda dan jalankan:

npm install

Konfigurasi Kunci API Gemini:

Dapatkan Kunci API Google Gemini Anda dari Google AI Studio.

Buka src/App.js.

Temukan baris ini:

const apiKey = "YOUR_GEMINI_API_KEY";

Ganti "YOUR_GEMINI_API_KEY" dengan kunci API Gemini Anda yang sebenarnya.

Catatan: Untuk lingkungan produksi, Anda akan menggunakan file .env dan variabel lingkungan untuk kunci API, tetapi untuk pengembangan lokal, langsung memasukkannya ke App.js sudah cukup.

Menjalankan Aplikasi
Setelah Anda menginstal dependensi dan mengonfigurasi kunci API, jalankan aplikasi:

npm start

Ini akan memulai server pengembangan dan membuka aplikasi di browser default Anda (biasanya di http://localhost:3000).

Aplikasi akan secara otomatis mendeteksi perubahan yang Anda buat pada file sumber dan me-reload browser.
>>>>>>> d28196d0 (Initial upload)
