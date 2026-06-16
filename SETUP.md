# Setup Guide - Sistem Absensi Karyawan

Panduan lengkap untuk setup dan konfigurasi sistem absensi karyawan.

## Checklist Setup

- [ ] Install Node.js dan npm
- [ ] Clone repository
- [ ] Install dependencies
- [ ] Buat project Supabase
- [ ] Setup database schema
- [ ] Setup storage bucket
- [ ] Download face recognition models
- [ ] Konfigurasi environment variables
- [ ] Buat admin user pertama
- [ ] Test aplikasi lokal
- [ ] Setup geofencing
- [ ] Tambah karyawan dan daftarkan wajah
- [ ] Deploy ke production (opsional)

## Detail Setup per Langkah

### 1. Install Node.js dan npm

Download dan install Node.js dari [nodejs.org](https://nodejs.org/). Versi minimal: 18.x

Verifikasi instalasi:
```bash
node --version
npm --version
```

### 2. Clone Repository

```bash
git clone <repository-url>
cd "Web Absensi Keren"
```

### 3. Install Dependencies

```bash
npm install
```

Tunggu hingga semua dependencies terinstall. Proses ini mungkin memakan waktu beberapa menit.

### 4. Buat Project Supabase

1. Buka [supabase.com](https://supabase.com)
2. Sign up atau login
3. Klik "New Project"
4. Isi:
   - Project name: `absensi-karyawan` (atau nama lain)
   - Database password: Simpan password ini dengan aman!
   - Region: Pilih yang terdekat dengan lokasi Anda
5. Klik "Create new project"
6. Tunggu hingga project selesai dibuat (~2 menit)

### 5. Setup Database Schema

1. Di Supabase Dashboard, klik "SQL Editor" di sidebar
2. Klik "New query"
3. Copy seluruh isi file `supabase-schema.sql`
4. Paste di SQL Editor
5. Klik "Run" atau tekan Ctrl+Enter
6. Pastikan tidak ada error. Jika sukses, Anda akan melihat "Success. No rows returned"

### 6. Setup Storage Bucket

#### A. Buat Bucket
1. Di Supabase Dashboard, klik "Storage" di sidebar
2. Klik "Create a new bucket"
3. Isi:
   - Name: `face-descriptors`
   - Public bucket: **OFF** (jangan dicentang)
4. Klik "Create bucket"

#### B. Setup Storage Policies
1. Kembali ke SQL Editor
2. Jalankan SQL berikut:

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

### 7. Download Face Recognition Models

Buat folder `public/models` jika belum ada:

```bash
mkdir -p public/models
```

Download file-file berikut dari [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js/tree/master/weights) dan simpan ke `public/models/`:

- `tiny_face_detector_model-weights_manifest.json`
- `tiny_face_detector_model-shard1`
- `face_landmark_68_model-weights_manifest.json`
- `face_landmark_68_model-shard1`
- `face_recognition_model-weights_manifest.json`
- `face_recognition_model-shard1`

**Alternatif**: Gunakan script download otomatis (lihat README.md)

### 8. Konfigurasi Environment Variables

1. Copy file template:
```bash
copy .env.local.example .env.local
```

2. Dapatkan kredensial Supabase:
   - Di Supabase Dashboard, klik "Settings" (ikon gear)
   - Klik "API"
   - Copy:
     - Project URL
     - `anon` `public` key
     - `service_role` `secret` key

3. Edit `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD=0.6
NEXT_PUBLIC_GEOFENCE_RADIUS=100
```

**PENTING**: 
- Jangan commit file `.env.local` ke git
- Jangan share `service_role` key ke siapapun

### 9. Buat Admin User Pertama

1. Di Supabase Dashboard, buka SQL Editor
2. Jalankan SQL berikut (ganti email dan password):

```sql
-- Buat user admin
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
    updated_at,
    confirmation_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@example.com',  -- GANTI INI
    crypt('AdminPassword123!', gen_salt('bf')),  -- GANTI INI
    NOW(),
    '{"role": "admin", "full_name": "Administrator"}',
    NOW(),
    NOW(),
    ''
);

-- Buat employee record untuk admin
INSERT INTO employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'Administrator', 'admin@example.com', 'Admin', 'Management', true
FROM auth.users WHERE email = 'admin@example.com';  -- GANTI INI
```

**PENTING**: Ganti `admin@example.com` dan `AdminPassword123!` dengan kredensial yang aman!

### 10. Test Aplikasi Lokal

1. Jalankan development server:
```bash
npm run dev
```

2. Buka browser ke [http://localhost:3000](http://localhost:3000)

3. Login menggunakan kredensial admin yang dibuat di langkah 9

4. Jika berhasil login, Anda akan diarahkan ke dashboard admin

### 11. Setup Geofencing (Wajib!)

Ini adalah langkah pertama yang harus dilakukan setelah login sebagai admin:

1. Login sebagai admin
2. Klik menu "Pengaturan"
3. Masukkan koordinat kantor Anda:
   - **Cara 1**: Buka Google Maps, klik kanan pada lokasi, copy koordinat
   - **Cara 2**: Klik tombol "Gunakan Lokasi Saat Ini" (pastikan Anda di kantor)
4. Masukkan radius dalam meter (contoh: 100 untuk radius 100m)
5. Klik "Simpan Konfigurasi"

**Catatan**: Tanpa konfigurasi geofencing, karyawan tidak bisa melakukan absensi!

### 12. Tambah Karyawan dan Daftarkan Wajah

#### Tambah Karyawan Baru
1. Klik menu "Karyawan"
2. Klik tombol "Tambah Karyawan"
3. Isi form:
   - Nama Lengkap
   - Email (harus unik)
   - Jabatan
   - Departemen
4. Klik "Simpan"
5. Sistem akan membuat akun dengan password default: `password123`
6. Beritahu karyawan untuk mengganti password setelah login pertama kali

#### Daftarkan Wajah Karyawan
1. Di daftar karyawan, klik tombol "Daftar Wajah" pada karyawan
2. Izinkan akses kamera
3. Minta karyawan untuk menghadap kamera dengan pencahayaan yang cukup
4. Klik "Tangkap Wajah"
5. Jika berhasil, status akan berubah menjadi "Terdaftar"

**Tips untuk Hasil Terbaik**:
- Pencahayaan cukup dan merata
- Wajah menghadap langsung ke kamera
- Lepas kacamata hitam atau masker
- Jarak sekitar 50cm dari kamera
- Background yang tidak terlalu ramai

### 13. Test Clock In/Out

1. Logout dari admin
2. Login sebagai karyawan menggunakan email yang sudah didaftarkan
3. Password default: `password123`
4. Klik menu "Absensi"
5. Pastikan Anda di dalam area geofencing
6. Klik "Clock In"
7. Izinkan akses kamera dan lokasi
8. Verifikasi wajah
9. Jika berhasil, status akan berubah

### 14. Deploy ke Production (Opsional)

Jika ingin deploy ke production, lihat panduan deployment di README.md

## Troubleshooting Setup

### Error: "relation does not exist"
**Penyebab**: Database schema belum dijalankan
**Solusi**: Jalankan ulang `supabase-schema.sql` di SQL Editor

### Error: "Failed to fetch"
**Penyebab**: Environment variables salah atau tidak lengkap
**Solusi**: 
- Cek `.env.local` sudah diisi dengan benar
- Restart development server setelah mengubah env variables

### Kamera tidak bisa diakses
**Penyebab**: Browser tidak memiliki izin atau tidak support
**Solusi**:
- Pastikan menggunakan browser modern (Chrome, Edge, Firefox)
- Izinkan akses kamera di browser settings
- Untuk production, wajib menggunakan HTTPS

### Face recognition model tidak load
**Penyebab**: Model files tidak ada atau path salah
**Solusi**:
- Pastikan file models ada di `public/models/`
- Cek console browser untuk error detail

### "Konfigurasi geofence belum diatur"
**Penyebab**: Admin belum setup geofencing
**Solusi**: Login sebagai admin dan setup di menu Pengaturan

## Setelah Setup

Setelah semua setup selesai, aplikasi siap digunakan! Berikut workflow normal:

1. Admin setup geofencing (sekali saja)
2. Admin tambah karyawan
3. Admin daftarkan wajah karyawan
4. Karyawan login dan lakukan absensi
5. Admin monitor dan export laporan

## Support

Jika mengalami masalah yang tidak tercantum di sini, silakan:
1. Cek log console browser (F12 → Console)
2. Cek log Supabase (Dashboard → Logs)
3. Buat issue di repository
