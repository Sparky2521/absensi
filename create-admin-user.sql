-- ============================================
-- CREATE ADMIN USER ONLY
-- ============================================
-- ⚠️ WARNING: This script is for ADDING admin user to EXISTING database
-- 
-- If you're doing FRESH setup, use: setup-database-complete.sql instead!
-- 
-- This script assumes:
-- 1. Database tables already exist (employees, etc)
-- 2. You just want to add/recreate admin user
-- ============================================

-- Admin Credentials:
-- Email: admin@absensi.com
-- Password: Admin123!@#
-- Full Name: Administrator System

-- ============================================
-- STEP 1: Create Admin User in auth.users
-- ============================================

INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    raw_app_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@absensi.com',
    crypt('Admin123!@#', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "Administrator System"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- ============================================
-- STEP 2: Create Employee Record for Admin
-- ============================================

INSERT INTO public.employees (
    user_id,
    full_name,
    email,
    position,
    department,
    is_active,
    face_descriptor_url
)
SELECT 
    id,
    'Administrator System',
    'admin@absensi.com',
    'System Administrator',
    'Management',
    true,
    NULL
FROM auth.users 
WHERE email = 'admin@absensi.com';

-- ============================================
-- VERIFICATION QUERY
-- ============================================
-- Jalankan query ini untuk memverifikasi admin user sudah dibuat

SELECT 
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'full_name' as full_name,
    e.position,
    e.department,
    e.is_active
FROM auth.users u
LEFT JOIN public.employees e ON e.user_id = u.id
WHERE u.email = 'admin@absensi.com';

-- Expected Output:
-- email: admin@absensi.com
-- role: admin
-- full_name: Administrator System
-- position: System Administrator
-- department: Management
-- is_active: true

-- ============================================
-- ADDITIONAL ADMIN USERS (OPTIONAL)
-- ============================================
-- Uncomment dan edit jika ingin menambah admin lain

/*
-- Admin 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'hrd@absensi.com',
    crypt('Hrd123!@#', gen_salt('bf')),
    NOW(),
    '{"role": "admin", "full_name": "HRD Manager"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(), NOW(), '', '', '', ''
);

INSERT INTO public.employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'HRD Manager', 'hrd@absensi.com', 'HRD Manager', 'Human Resources', true
FROM auth.users WHERE email = 'hrd@absensi.com';
*/

-- ============================================
-- TEST EMPLOYEE USERS (OPTIONAL)
-- ============================================
-- Uncomment untuk membuat test employee

/*
-- Employee 1
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'john@absensi.com',
    crypt('Employee123', gen_salt('bf')),
    NOW(),
    '{"role": "employee", "full_name": "John Doe"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(), NOW(), '', '', '', ''
);

INSERT INTO public.employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'John Doe', 'john@absensi.com', 'Software Developer', 'IT', true
FROM auth.users WHERE email = 'john@absensi.com';

-- Employee 2
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, raw_user_meta_data, raw_app_meta_data,
    created_at, updated_at, confirmation_token, email_change,
    email_change_token_new, recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'jane@absensi.com',
    crypt('Employee123', gen_salt('bf')),
    NOW(),
    '{"role": "employee", "full_name": "Jane Smith"}'::jsonb,
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    NOW(), NOW(), '', '', '', ''
);

INSERT INTO public.employees (user_id, full_name, email, position, department, is_active)
SELECT id, 'Jane Smith', 'jane@absensi.com', 'Marketing Specialist', 'Marketing', true
FROM auth.users WHERE email = 'jane@absensi.com';
*/

-- ============================================
-- NOTES
-- ============================================
-- 1. Password di-hash menggunakan bcrypt
-- 2. Pastikan database schema sudah dijalankan sebelum script ini
-- 3. Email harus unik, jika sudah ada akan error
-- 4. Untuk production, gunakan password yang lebih kuat
-- 5. Simpan kredensial dengan aman

-- ============================================
-- CARA MENGGUNAKAN SCRIPT INI
-- ============================================
-- 1. Buka Supabase Dashboard
-- 2. Klik SQL Editor di sidebar
-- 3. Klik "New query"
-- 4. Copy paste script ini
-- 5. Klik "Run" atau tekan Ctrl+Enter
-- 6. Check hasil di bagian Results
-- 7. Jalankan Verification Query untuk memastikan berhasil

-- ============================================
-- TROUBLESHOOTING
-- ============================================

-- Jika error "duplicate key value violates unique constraint"
-- Artinya email sudah terdaftar. Gunakan email lain atau hapus dulu:
-- DELETE FROM auth.users WHERE email = 'admin@absensi.com';

-- Jika error "relation does not exist"
-- Artinya database schema belum dijalankan. Jalankan supabase-schema.sql terlebih dahulu.

-- Jika ingin reset password admin:
/*
UPDATE auth.users 
SET encrypted_password = crypt('PasswordBaru123', gen_salt('bf'))
WHERE email = 'admin@absensi.com';
*/

-- Jika ingin menghapus admin user:
/*
DELETE FROM public.employees WHERE email = 'admin@absensi.com';
DELETE FROM auth.users WHERE email = 'admin@absensi.com';
*/

-- ============================================
-- END OF SCRIPT
-- ============================================
