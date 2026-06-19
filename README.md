# Sistem Absensi Karyawan

Aplikasi web absensi karyawan dengan face recognition dan geofencing menggunakan Next.js dan Supabase.

## ⚠️ PENTING: Baca Ini Dulu!

**Jika Anda melihat error "Missing Supabase environment variables"** - Ini NORMAL!

✅ **Semua code sudah diperbaiki dan siap digunakan**

❗ **Yang perlu dilakukan**: Setup Supabase (hanya 5 menit!)

👉 **MULAI DI SINI**: Baca file `START_HERE.md` atau `QUICKSTART.md`

---

## 🚀 Fitur Utama

### Untuk Karyawan
- ✅ Login dengan email dan password
- 📸 Clock In/Out dengan verifikasi wajah (Face Recognition)
- 📍 Validasi lokasi dengan Geofencing
- 📊 Dashboard dengan status absensi hari ini
- 📜 Riwayat absensi dengan filter tanggal

### Untuk Admin/HRD
- 👥 Manajemen karyawan (CRUD)
- 🔐 Pendaftaran wajah karyawan
- 🗺️ Konfigurasi geofencing global
- 📈 Dashboard statistik kehadiran
- 📋 Laporan absensi dengan export CSV
- ✏️ Koreksi manual data absensi
- 🔍 Filter absensi berdasarkan karyawan, departemen, dan tanggal

## 🛠️ Teknologi yang Digunakan

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Authentication, Storage)
- **Face Recognition**: face-api.js
- **Geolocation**: Browser Geolocation API

## 📋 Prerequisites

Sebelum memulai, pastikan Anda memiliki:

- Node.js 18+ dan npm/yarn
- Akun Supabase ([daftar gratis](https://supabase.com))
- Browser modern dengan support untuk:
  - WebRTC (untuk kamera)
  - Geolocation API (untuk GPS)

## 🔧 Instalasi

### 1. Clone Repository

```bash
git clone <repository-url>
cd "Web Absensi Keren"
```

### 2. Install Dependencies

```bash
npm install
# atau
yarn install
```

### 3. Setup Supabase

#### A. Buat Project Baru di Supabase

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Klik "New Project"
3. Isi detail project Anda

#### B. Jalankan Database Schema

1. Buka SQL Editor di Supabase Dashboard
2. Copy isi file `supabase-schema.sql`
3. Paste dan jalankan SQL tersebut

#### C. Setup Storage Bucket

1. Buka Storage di Supabase Dashboard
2. Klik "Create a new bucket"
3. Nama: `face-descriptors`
4. Public: **OFF** (private)
5. Klik "Create bucket"

#### D. Setup Storage Policies

Jalankan SQL berikut di SQL Editor:

```sql
-- Admin dapat upload face descriptors
CREATE POLICY "Admin can upload face descriptors"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
    bucket_id = 'face-descriptors' AND
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- User authenticated dapat membaca face descriptors
CREATE POLICY "Authenticated users can read face descriptors"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'face-descriptors');

-- Admin dapat menghapus face descriptors
CREATE POLICY "Admin can delete face descriptors"
ON storage.objects FOR DELETE TO authenticated
USING (
    bucket_id = 'face-descriptors' AND
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);
```

### 4. Download Face Recognition Models

Download model files dari [face-api.js models](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) dan simpan di folder `public/models/`:

```
public/
  └── models/
      ├── tiny_face_detector_model-weights_manifest.json
      ├── tiny_face_detector_model-shard1
      ├── face_landmark_68_model-weights_manifest.json
      ├── face_landmark_68_model-shard1
      ├── face_recognition_model-weights_manifest.json
      └── face_recognition_model-shard1
```

Atau gunakan script download otomatis (buat file `download-models.js`):

```javascript
// Script untuk download models - jalankan dengan: node download-models.js
const https = require('https');
const fs = require('fs');
const path = require('path');

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights/';
const MODELS_DIR = path.join(__dirname, 'public', 'models');

const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
];

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

files.forEach((file) => {
  const url = MODEL_URL + file;
  const dest = path.join(MODELS_DIR, file);
  
  https.get(url, (response) => {
    const fileStream = fs.createWriteStream(dest);
    response.pipe(fileStream);
    fileStream.on('finish', () => {
      fileStream.close();
      console.log(`Downloaded: ${file}`);
    });
  });
});
```

### 5. Environment Variables

Copy file `.env.local.example` menjadi `.env.local`:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` dan isi dengan kredensial Supabase Anda:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD=0.6
NEXT_PUBLIC_GEOFENCE_RADIUS=100
```

### 6. Buat Admin User

Jalankan SQL berikut di Supabase SQL Editor untuk membuat user admin pertama:

```sql
-- Buat user admin (ganti dengan email dan password Anda)
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',
    crypt('password123', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "Administrator"}',
    NOW(),
    NOW()
);

-- Buat employee record untuk admin
INSERT INTO employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'Administrator', 'admin@example.com', 'Admin', 'Management', true
FROM auth.users WHERE email = 'admin@example.com';
```

**PENTING**: Ganti `admin@example.com` dan `password123` dengan email dan password yang Anda inginkan.

### 7. Jalankan Development Server

```bash
npm run dev
# atau
yarn dev
```

Aplikasi akan berjalan di [http://localhost:3000](http://localhost:3000)

## 📖 Panduan Penggunaan

### Sebagai Admin

#### 1. Login
- Buka aplikasi
- Login menggunakan kredensial admin

#### 2. Setup Geofencing (Wajib Dilakukan Pertama Kali)
- Klik menu "Pengaturan"
- Masukkan koordinat latitude dan longitude kantor Anda
- Masukkan radius dalam meter (misal: 100 untuk radius 100 meter)
- Klik "Simpan"

Tips mendapatkan koordinat:
- Buka Google Maps
- Klik kanan pada lokasi kantor
- Pilih koordinat yang muncul (akan otomatis tercopy)

#### 3. Tambah Karyawan
- Klik menu "Karyawan"
- Klik "Tambah Karyawan"
- Isi form: nama lengkap, email, jabatan, departemen
- Klik "Simpan"
- Sistem akan membuat akun Supabase untuk karyawan dengan password default

#### 4. Daftarkan Wajah Karyawan
- Di halaman daftar karyawan, klik tombol "Daftar Wajah"
- Kamera akan aktif
- Minta karyawan untuk menghadap kamera
- Klik "Tangkap Wajah"
- Jika berhasil, data wajah akan tersimpan

#### 5. Lihat Laporan Absensi
- Klik menu "Absensi"
- Gunakan filter untuk melihat data spesifik
- Klik "Export CSV" untuk download laporan

### Sebagai Karyawan

#### 1. Login
- Login menggunakan email dan password yang diberikan admin

#### 2. Clock In
- Pastikan Anda berada di area kantor (dalam radius geofencing)
- Pastikan browser sudah memberikan izin akses kamera dan lokasi
- Klik menu "Absensi"
- Klik tombol "Clock In"
- Ikuti instruksi di layar untuk verifikasi wajah
- Tunggu hingga proses selesai

#### 3. Clock Out
- Klik menu "Absensi"
- Klik tombol "Clock Out"
- Verifikasi wajah seperti saat clock in

#### 4. Lihat Riwayat
- Klik menu "Riwayat"
- Gunakan filter tanggal untuk melihat periode tertentu

## 🔒 Keamanan

- Semua data dilindungi dengan Row Level Security (RLS) di Supabase
- Face descriptor disimpan dalam bentuk array numerik, bukan gambar
- Proses face recognition dilakukan di client-side (browser)
- Password di-hash dengan bcrypt
- HTTPS wajib untuk production

## 🚨 Troubleshooting

### Kamera tidak dapat diakses
- Pastikan browser memiliki izin akses kamera
- Gunakan HTTPS (required untuk production)
- Coba browser lain jika masalah berlanjut

### Lokasi tidak terdeteksi
- Pastikan browser memiliki izin akses lokasi
- Aktifkan GPS di device
- Gunakan HTTPS untuk production

### Face recognition gagal
- Pastikan pencahayaan cukup
- Pastikan wajah terlihat jelas di kamera
- Hindari kacamata hitam atau masker
- Coba adjust threshold di `.env.local`

### Error "Konfigurasi geofence belum diatur"
- Admin harus setup geofencing terlebih dahulu di menu Pengaturan

## 📦 Deployment

### Deploy ke Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Atau gunakan [Vercel Dashboard](https://vercel.com):
1. Import repository
2. Set environment variables
3. Deploy

**PENTING**: 
- Set semua environment variables di Vercel Dashboard
- Pastikan domain menggunakan HTTPS
- Update CORS settings di Supabase jika perlu

## 📝 License

MIT License - silakan gunakan untuk keperluan pribadi atau komersial.

## 🤝 Contributing

Kontribusi sangat diterima! Silakan buat issue atau pull request.

## 📧 Support

Jika ada pertanyaan atau masalah, silakan buat issue di repository ini.

---

Dibuat dengan ❤️ menggunakan Next.js dan Supabase
#   a b s e n s i 
 
 #   a b s e n s i 
 
 #   a b s e n s i 
 
 