# Fix: "relation public.employees does not exist"

## 🔍 Error yang Terjadi

```
ERROR: 42P01: relation "public.employees" does not exist
LINE 55: INSERT INTO public.employees (
```

## ❓ Penyebab

Error ini terjadi karena **tabel database belum dibuat**. 

Anda mencoba membuat admin user, tapi tabelnya belum ada.

## ✅ Solusi

Ada 2 cara untuk memperbaiki:

### Solution 1: Setup Complete (RECOMMENDED) ⭐

Gunakan script yang sudah include SEMUA (create tables + admin user):

1. **Buka Supabase Dashboard → SQL Editor**

2. **Buka file**: `setup-database-complete.sql`

3. **Copy SEMUA isi file** (Ctrl+A, Ctrl+C)

4. **Paste di SQL Editor** (Ctrl+V)

5. **Klik "Run"** atau tekan Ctrl+Enter

6. **Tunggu hingga selesai** (~10 detik)

7. **Lihat hasil**:
   - Harus ada message: "Database setup complete!"
   - Verify admin user created
   - Email: admin@absensi.com

**✅ DONE! Database + Admin user sudah siap!**

---

### Solution 2: Step-by-Step (Manual)

Jika ingin setup bertahap:

#### Step 1: Create Tables First

1. Buka Supabase Dashboard → SQL Editor
2. Buka file: `supabase-schema.sql`
3. Copy SEMUA isi file
4. Paste di SQL Editor
5. Klik "Run"
6. Tunggu hingga selesai

#### Step 2: Create Admin User

1. Masih di SQL Editor
2. Buka file: `create-admin-user.sql`
3. Copy SEMUA isi file
4. Paste di SQL Editor (new query)
5. Klik "Run"

**✅ DONE!**

---

## 🎯 Recommended Order

Berikut urutan yang BENAR untuk setup:

```
1. ✅ Setup Supabase project
   └─> Buat project di supabase.com

2. ✅ Update .env.local
   └─> Isi dengan API credentials

3. ✅ Create database tables + admin user
   └─> Jalankan: setup-database-complete.sql
   └─> Atau: supabase-schema.sql → create-admin-user.sql

4. ✅ Create storage bucket
   └─> Buat bucket: face-descriptors

5. ✅ Install dependencies
   └─> npm install

6. ✅ Run application
   └─> npm run dev

7. ✅ Login & setup geofencing
   └─> Login → Settings → Configure geofence
```

---

## 📂 File Reference

| File | Purpose |
|------|---------|
| **setup-database-complete.sql** | ⭐ ALL-IN-ONE: Tables + Admin user |
| **supabase-schema.sql** | Tables only (step-by-step) |
| **create-admin-user.sql** | Admin user only (after tables) |
| **LOGIN_INFO.txt** | Kredensial admin |

---

## ✅ Verification

Setelah menjalankan script, verify dengan query ini:

```sql
-- Check tables
SELECT tablename 
FROM pg_tables 
WHERE schemaname = 'public';

-- Should show: employees, attendance_records, geofence_config, audit_logs

-- Check admin user
SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    e.full_name,
    e.position
FROM auth.users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'admin@absensi.com';

-- Should show: admin@absensi.com with role=admin
```

---

## 🐛 Troubleshooting

### Error: "duplicate key value violates unique constraint"

**Penyebab**: Admin user sudah ada

**Solusi**: Skip error ini, user sudah dibuat sebelumnya

---

### Error: "permission denied for schema public"

**Penyebab**: User tidak punya permission

**Solusi**: 
1. Pastikan menggunakan owner/admin account di Supabase
2. Bukan menggunakan anon key

---

### Error: "function gen_random_uuid() does not exist"

**Penyebab**: Extension uuid-ossp belum enabled

**Solusi**: Script sudah include ini, pastikan baris pertama dijalankan:
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

---

### Tables tidak muncul

**Cek dengan query**:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

Jika kosong, script belum berhasil. Coba run ulang.

---

## 💡 Pro Tips

1. **Always run setup-database-complete.sql** untuk fresh setup
   - Lebih simple, satu file langsung jadi

2. **Check success message** setelah run script
   - Harus ada NOTICE: "Database setup complete!"

3. **Verify before continuing** 
   - Jalankan verification queries
   - Pastikan tables dan admin user exist

4. **Save credentials**
   - Email: admin@absensi.com
   - Password: Admin123!@#

---

## 🎉 After Fix

Setelah database setup berhasil, lanjut ke:

1. ✅ Database: DONE
2. ⏭️ Login: Buka http://localhost:3000
3. ⏭️ Setup geofencing: Settings menu
4. ⏭️ Start using the app!

---

**File untuk digunakan**: `setup-database-complete.sql`

**Kredensial**: Lihat `LOGIN_INFO.txt`

**Next**: Login dan setup geofencing!

🚀 Good luck!
