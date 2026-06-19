-- ============================================
-- COMPLETE DATABASE SETUP + ADMIN USER
-- ============================================
-- Script lengkap untuk setup database + buat admin user
-- Jalankan SEMUA script ini di Supabase SQL Editor
-- ============================================

-- STEP 1: Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STEP 2: CREATE TABLES
-- ============================================

-- Table: employees
CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    position TEXT NOT NULL,
    department TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    face_descriptor_url TEXT
);

-- Table: attendance_records
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    clock_in_time TIMESTAMP WITH TIME ZONE,
    clock_out_time TIMESTAMP WITH TIME ZONE,
    clock_in_lat DECIMAL(10, 8),
    clock_in_lng DECIMAL(11, 8),
    clock_out_lat DECIMAL(10, 8),
    clock_out_lng DECIMAL(11, 8),
    duration_minutes INTEGER,
    status TEXT DEFAULT 'incomplete' CHECK (status IN ('present', 'absent', 'incomplete')),
    notes TEXT,
    corrected_by UUID REFERENCES auth.users(id),
    correction_reason TEXT,
    UNIQUE(employee_id, date)
);

-- Table: geofence_config
CREATE TABLE IF NOT EXISTS geofence_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Table: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    action TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id UUID,
    old_data JSONB,
    new_data JSONB,
    description TEXT
);

-- ============================================
-- STEP 3: CREATE INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON employees(is_active);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_records(date);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_records(employee_id, date);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- STEP 4: ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STEP 5: CREATE RLS POLICIES
-- ============================================

-- Policies for employees table
DROP POLICY IF EXISTS "Admin full access to employees" ON employees;
CREATE POLICY "Admin full access to employees"
ON employees FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

DROP POLICY IF EXISTS "Employee can read own data" ON employees;
CREATE POLICY "Employee can read own data"
ON employees FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Policies for attendance_records table
DROP POLICY IF EXISTS "Admin full access to attendance" ON attendance_records;
CREATE POLICY "Admin full access to attendance"
ON attendance_records FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

DROP POLICY IF EXISTS "Employee can read own attendance" ON attendance_records;
CREATE POLICY "Employee can read own attendance"
ON attendance_records FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Employee can insert own attendance" ON attendance_records;
CREATE POLICY "Employee can insert own attendance"
ON attendance_records FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
        AND employees.is_active = TRUE
    )
);

DROP POLICY IF EXISTS "Employee can update own attendance" ON attendance_records;
CREATE POLICY "Employee can update own attendance"
ON attendance_records FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
        AND employees.is_active = TRUE
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
        AND employees.is_active = TRUE
    )
);

-- Policies for geofence_config table
DROP POLICY IF EXISTS "Anyone can read active geofence" ON geofence_config;
CREATE POLICY "Anyone can read active geofence"
ON geofence_config FOR SELECT TO authenticated
USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admin can modify geofence" ON geofence_config;
CREATE POLICY "Admin can modify geofence"
ON geofence_config FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Policies for audit_logs table
DROP POLICY IF EXISTS "Admin can read audit logs" ON audit_logs;
CREATE POLICY "Admin can read audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;
CREATE POLICY "Anyone can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- ============================================
-- STEP 6: CREATE FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_employees_updated_at ON employees;
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_attendance_updated_at ON attendance_records;
CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_geofence_updated_at ON geofence_config;
CREATE TRIGGER update_geofence_updated_at
    BEFORE UPDATE ON geofence_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STEP 7: CREATE ADMIN USER
-- ============================================

-- Admin Credentials:
-- Email: admin@absensi.com
-- Password: Admin123!@#

-- Check if admin already exists and delete if necessary
DO $$ 
BEGIN
    -- Delete existing admin if exists
    DELETE FROM employees WHERE email = 'admin@absensi.com';
    DELETE FROM auth.users WHERE email = 'admin@absensi.com';
EXCEPTION
    WHEN OTHERS THEN
        -- Ignore errors if user doesn't exist
        NULL;
END $$;

-- Create admin user
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

-- Create employee record for admin
INSERT INTO employees (
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
-- STEP 8: VERIFICATION
-- ============================================

-- Verify tables created
SELECT 
    'Tables Created:' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'attendance_records', 'geofence_config', 'audit_logs');

-- Verify admin user created
SELECT 
    'Admin User:' as status,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    u.raw_user_meta_data->>'full_name' as full_name,
    e.position,
    e.department,
    e.is_active
FROM auth.users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'admin@absensi.com';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE 'Database setup complete!';
    RAISE NOTICE 'Admin login credentials:';
    RAISE NOTICE 'Email: admin@absensi.com';
    RAISE NOTICE 'Password: Admin123!@#';
    RAISE NOTICE '';
    RAISE NOTICE 'Next steps:';
    RAISE NOTICE '1. Run: npm run dev';
    RAISE NOTICE '2. Open: http://localhost:3000';
    RAISE NOTICE '3. Login with credentials above';
    RAISE NOTICE '4. Setup geofencing in Settings menu';
END $$;

-- ============================================
-- END OF SCRIPT
-- ============================================
