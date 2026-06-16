-- ============================================
-- SISTEM ABSENSI KARYAWAN - DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: employees
-- ============================================
CREATE TABLE employees (
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

-- ============================================
-- TABLE: attendance_records
-- ============================================
CREATE TABLE attendance_records (
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

-- ============================================
-- TABLE: geofence_config
-- ============================================
CREATE TABLE geofence_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    center_lat DECIMAL(10, 8) NOT NULL,
    center_lng DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- ============================================
-- TABLE: audit_logs
-- ============================================
CREATE TABLE audit_logs (
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
-- INDEXES
-- ============================================
CREATE INDEX idx_employees_user_id ON employees(user_id);
CREATE INDEX idx_employees_email ON employees(email);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_is_active ON employees(is_active);

CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date ON attendance_records(date);
CREATE INDEX idx_attendance_employee_date ON attendance_records(employee_id, date);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE geofence_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES: employees
-- ============================================

-- Admin can do everything
CREATE POLICY "Admin full access to employees"
ON employees
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Employee can read their own data
CREATE POLICY "Employee can read own data"
ON employees
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- ============================================
-- RLS POLICIES: attendance_records
-- ============================================

-- Admin can do everything
CREATE POLICY "Admin full access to attendance"
ON attendance_records
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Employee can read their own records
CREATE POLICY "Employee can read own attendance"
ON attendance_records
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
    )
);

-- Employee can insert their own attendance
CREATE POLICY "Employee can insert own attendance"
ON attendance_records
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM employees
        WHERE employees.id = attendance_records.employee_id
        AND employees.user_id = auth.uid()
        AND employees.is_active = TRUE
    )
);

-- Employee can update their own incomplete attendance
CREATE POLICY "Employee can update own attendance"
ON attendance_records
FOR UPDATE
TO authenticated
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

-- ============================================
-- RLS POLICIES: geofence_config
-- ============================================

-- Everyone can read active geofence config
CREATE POLICY "Anyone can read active geofence"
ON geofence_config
FOR SELECT
TO authenticated
USING (is_active = TRUE);

-- Only admin can modify geofence config
CREATE POLICY "Admin can modify geofence"
ON geofence_config
FOR ALL
TO authenticated
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

-- ============================================
-- RLS POLICIES: audit_logs
-- ============================================

-- Only admin can read audit logs
CREATE POLICY "Admin can read audit logs"
ON audit_logs
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM auth.users
        WHERE auth.users.id = auth.uid()
        AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
);

-- Anyone can insert audit logs (for system tracking)
CREATE POLICY "Anyone can insert audit logs"
ON audit_logs
FOR INSERT
TO authenticated
WITH CHECK (TRUE);

-- ============================================
-- FUNCTIONS & TRIGGERS
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
CREATE TRIGGER update_employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_geofence_updated_at
    BEFORE UPDATE ON geofence_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- STORAGE BUCKET SETUP
-- ============================================

-- Create storage bucket for face descriptors
-- Run this in the Supabase Dashboard SQL Editor:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('face-descriptors', 'face-descriptors', false);

-- Storage policies for face-descriptors bucket
-- CREATE POLICY "Admin can upload face descriptors"
-- ON storage.objects FOR INSERT TO authenticated
-- WITH CHECK (
--     bucket_id = 'face-descriptors' AND
--     EXISTS (
--         SELECT 1 FROM auth.users
--         WHERE auth.users.id = auth.uid()
--         AND auth.users.raw_user_meta_data->>'role' = 'admin'
--     )
-- );

-- CREATE POLICY "Authenticated users can read face descriptors"
-- ON storage.objects FOR SELECT TO authenticated
-- USING (bucket_id = 'face-descriptors');

-- CREATE POLICY "Admin can delete face descriptors"
-- ON storage.objects FOR DELETE TO authenticated
-- USING (
--     bucket_id = 'face-descriptors' AND
--     EXISTS (
--         SELECT 1 FROM auth.users
--         WHERE auth.users.id = auth.uid()
--         AND auth.users.raw_user_meta_data->>'role' = 'admin'
--     )
-- );
