-- ============================================
-- SAFE DATABASE SETUP + ADMIN USER
-- ============================================
-- Versi dengan error handling yang lebih baik
-- Aman untuk di-run multiple times
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CREATE TABLES (IF NOT EXISTS)
-- ============================================

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

CREATE TABLE IF NOT EXISTS geofence_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

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
-- CREATE INDEXES
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
-- ENABLE RLS
-- ============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- DROP EXISTING POLICIES (to avoid conflicts)
-- ============================================

DROP POLICY IF EXISTS "Admin full access to employees" ON employees;
DROP POLICY IF EXISTS "Employee can read own data" ON employees;
DROP POLICY IF EXISTS "Admin full access to attendance" ON attendance_records;
DROP POLICY IF EXISTS "Employee can read own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Employee can insert own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Employee can update own attendance" ON attendance_records;
DROP POLICY IF EXISTS "Anyone can read active geofence" ON geofence_config;
DROP POLICY IF EXISTS "Admin can modify geofence" ON geofence_config;
DROP POLICY IF EXISTS "Admin can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Anyone can insert audit logs" ON audit_logs;

-- ============================================
-- CREATE RLS POLICIES
-- ============================================

-- Employees policies
CREATE POLICY "Admin full access to employees"
ON employees FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Employee can read own data"
ON employees FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Attendance policies
CREATE POLICY "Admin full access to attendance"
ON attendance_records FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Employee can read own attendance"
ON attendance_records FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
    )
);

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

-- Geofence policies
CREATE POLICY "Anyone can read active geofence"
ON geofence_config FOR SELECT TO authenticated
USING (is_active = TRUE);

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

-- Audit logs policies
CREATE POLICY "Admin can read audit logs"
ON audit_logs FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

CREATE POLICY "Anyone can insert audit logs"
ON audit_logs FOR INSERT TO authenticated
WITH CHECK (TRUE);

-- ============================================
-- CREATE OR REPLACE FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DROP AND CREATE TRIGGERS
-- ============================================

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
-- CREATE ADMIN USER (SAFE)
-- ============================================

DO $$ 
DECLARE
    v_user_id UUID;
BEGIN
    -- Check if admin already exists
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'admin@absensi.com';

    IF v_user_id IS NULL THEN
        -- Admin doesn't exist, create new
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
            'admin@absensi.com',
            crypt('Admin123!@#', gen_salt('bf')),
            NOW(),
            '{"role": "admin", "full_name": "Administrator System"}'::jsonb,
            '{"provider": "email", "providers": ["email"]}'::jsonb,
            NOW(), NOW(), '', '', '', ''
        ) RETURNING id INTO v_user_id;

        -- Create employee record
        INSERT INTO employees (
            user_id, full_name, email, position, department, is_active
        ) VALUES (
            v_user_id,
            'Administrator System',
            'admin@absensi.com',
            'System Administrator',
            'Management',
            true
        );

        RAISE NOTICE 'Admin user created successfully!';
    ELSE
        -- Admin already exists, update metadata and password
        UPDATE auth.users 
        SET 
            encrypted_password = crypt('Admin123!@#', gen_salt('bf')),
            raw_user_meta_data = '{"role": "admin", "full_name": "Administrator System"}'::jsonb,
            updated_at = NOW()
        WHERE id = v_user_id;

        -- Update or create employee record
        INSERT INTO employees (
            user_id, full_name, email, position, department, is_active
        ) VALUES (
            v_user_id,
            'Administrator System',
            'admin@absensi.com',
            'System Administrator',
            'Management',
            true
        )
        ON CONFLICT (email) 
        DO UPDATE SET
            user_id = EXCLUDED.user_id,
            full_name = EXCLUDED.full_name,
            position = EXCLUDED.position,
            department = EXCLUDED.department,
            is_active = EXCLUDED.is_active;

        RAISE NOTICE 'Admin user already exists. Password updated.';
    END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

SELECT 
    'Tables Created' as status,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'attendance_records', 'geofence_config', 'audit_logs');

SELECT 
    'Admin User' as status,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    e.full_name,
    e.position,
    e.is_active
FROM auth.users u
LEFT JOIN employees e ON e.user_id = u.id
WHERE u.email = 'admin@absensi.com';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$ 
BEGIN 
    RAISE NOTICE '';
    RAISE NOTICE '╔════════════════════════════════════════════╗';
    RAISE NOTICE '║   DATABASE SETUP COMPLETE!                 ║';
    RAISE NOTICE '╚════════════════════════════════════════════╝';
    RAISE NOTICE '';
    RAISE NOTICE 'Admin Credentials:';
    RAISE NOTICE '  Email: admin@absensi.com';
    RAISE NOTICE '  Password: Admin123!@#';
    RAISE NOTICE '';
    RAISE NOTICE 'Next Steps:';
    RAISE NOTICE '  1. npm install';
    RAISE NOTICE '  2. npm run dev';
    RAISE NOTICE '  3. Open http://localhost:3000';
    RAISE NOTICE '  4. Login and setup geofencing';
    RAISE NOTICE '';
END $$;
