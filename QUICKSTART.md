# Quick Start Guide

Panduan cepat untuk menjalankan aplikasi dalam 5 menit.

## ⚠️ PENTING: Error yang Anda Lihat

Jika Anda melihat error:
```
Error: either NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY env variables or supabaseUrl and supabaseKey are required!
```

Ini normal! Anda perlu setup Supabase terlebih dahulu.

## 🚀 Quick Setup (5 Menit)

### Langkah 1: Buat Project Supabase (2 menit)

1. Buka [supabase.com](https://supabase.com) dan sign up/login
2. Klik **"New Project"**
3. Isi:
   - Name: `absensi-karyawan`
   - Database Password: Buat password kuat (SIMPAN INI!)
   - Region: Pilih yang terdekat
4. Klik **"Create new project"**
5. Tunggu ~2 menit hingga project selesai

### Langkah 2: Get API Keys (30 detik)

1. Di Supabase Dashboard, klik **Settings** (ikon gear) di sidebar
2. Klik **API**
3. Copy 2 nilai ini:
   - **Project URL** (example: `https://abcdefgh.supabase.co`)
   - **anon public** key (panjang, dimulai dengan `eyJ...`)

### Langkah 3: Update Environment Variables (30 detik)

1. Buka file `.env.local` yang sudah dibuat
2. Ganti nilai berikut:

```env
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Langkah 4: Setup Database (1 menit)

1. Di Supabase Dashboard, klik **SQL Editor** di sidebar
2. Klik **"New query"**
3. Copy SELURUH isi file `supabase-schema.sql` di project ini
4. Paste di SQL Editor
5. Klik **"Run"** atau tekan `Ctrl+Enter`
6. Tunggu hingga selesai (akan muncul "Success")

### Langkah 5: Buat Storage Bucket (30 detik)

1. Di Supabase Dashboard, klik **Storage** di sidebar
2. Klik **"Create a new bucket"**
3. Name: `face-descriptors`
4. Public: **OFF** (jangan dicentang!)
5. Klik **"Create bucket"**

### Langkah 6: Setup Storage Policies (30 detik)

1. Kembali ke **SQL Editor**
2. Copy dan jalankan SQL ini:

```sql
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

CREATE POLICY "Authenticated users can read face descriptors"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'face-descriptors');

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

### Langkah 7: Buat Admin User (30 detik)

1. Di **SQL Editor**, jalankan SQL ini (GANTI email dan password!):

```sql
-- PENTING: Ganti 'admin@example.com' dan 'AdminPassword123!' dengan yang Anda inginkan!

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
    'admin@example.com',
    crypt('AdminPassword123!', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "Administrator"}',
    NOW(),
    NOW(),
    ''
);

INSERT INTO employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'Administrator', 'admin@example.com', 'Admin', 'Management', true
FROM auth.users WHERE email = 'admin@example.com';
```

### Langkah 8: Restart Dev Server

1. **Stop** server dengan `Ctrl+C` di terminal
2. **Restart** dengan:
```bash
npm run dev
```

### Langkah 9: Login! 🎉

1. Buka browser ke [http://localhost:3000](http://localhost:3000)
2. Login dengan email dan password yang Anda buat di Langkah 7
3. Anda akan diarahkan ke Admin Dashboard!

## ✅ Setup Geofencing (WAJIB!)

Setelah login sebagai admin:

1. Klik menu **"Pengaturan"**
2. Klik tombol **"Gunakan Lokasi Saat Ini"** atau masukkan koordinat manual
3. Masukkan radius (contoh: 100 untuk 100 meter)
4. Klik **"Simpan Konfigurasi"**

**Tanpa ini, karyawan tidak bisa absensi!**

## 📸 Download Face Recognition Models (Opsional, untuk fitur face recognition)

Jika ingin menggunakan fitur face recognition, download models:

1. Buat folder `public/models` jika belum ada
2. Download file-file ini dari [face-api.js GitHub](https://github.com/justadudewhohacks/face-api.js/tree/master/weights):
   - `tiny_face_detector_model-weights_manifest.json`
   - `tiny_face_detector_model-shard1`
   - `face_landmark_68_model-weights_manifest.json`
   - `face_landmark_68_model-shard1`
   - `face_recognition_model-weights_manifest.json`
   - `face_recognition_model-shard1`
3. Simpan semua file di `public/models/`

## 🎯 Fitur Yang Bisa Dicoba

### Sebagai Admin:

1. **Tambah Karyawan**
   - Menu "Karyawan" → "Tambah Karyawan"
   - Isi form dan simpan

2. **Lihat Dashboard**
   - Statistik kehadiran hari ini
   - Statistik per departemen

3. **Setup Geofencing**
   - Menu "Pengaturan"
   - Set lokasi kantor

### Sebagai Karyawan:

1. Buat akun karyawan baru via admin
2. Logout dan login sebagai karyawan
3. Clock in/out di menu "Absensi"

## 🐛 Troubleshooting

### Error: "Missing Supabase environment variables"
**Solusi**: Pastikan `.env.local` sudah diisi dengan benar dan restart dev server

### Error: "relation does not exist"
**Solusi**: Anda belum menjalankan `supabase-schema.sql`. Jalankan di SQL Editor.

### Error saat login: "Invalid login credentials"
**Solusi**: 
1. Pastikan email dan password yang Anda masukkan sama dengan yang di SQL
2. Cek typo di SQL query saat buat admin user

### Kamera tidak bisa diakses
**Solusi**: 
- Browser perlu izin akses kamera
- Untuk production, wajib pakai HTTPS

### Page tidak load setelah setup
**Solusi**: Restart dev server dengan `Ctrl+C` lalu `npm run dev`

## 📚 Dokumentasi Lengkap

Untuk panduan detail, lihat:
- **SETUP.md** - Setup lengkap dengan penjelasan
- **README.md** - Overview fitur
- **DEPLOYMENT.md** - Deploy ke production
- **API.md** - Dokumentasi database dan API

## 💡 Tips

1. **Simpan kredensial admin** di tempat aman
2. **Backup database** secara berkala (Supabase auto-backup)
3. **Test di localhost** dulu sebelum deploy
4. **Gunakan HTTPS** untuk production (kamera & GPS butuh HTTPS)

## ❓ Need Help?

1. Baca error message dengan teliti
2. Check console browser (F12 → Console)
3. Check Supabase logs (Dashboard → Logs)
4. Lihat file SETUP.md untuk troubleshooting detail

---

**Selamat! Aplikasi sudah siap digunakan!** 🚀
