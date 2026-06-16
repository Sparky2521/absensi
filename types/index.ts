export interface Employee {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
  is_active: boolean;
  face_descriptor_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  clock_in_time: string | null;
  clock_out_time: string | null;
  clock_in_lat: number | null;
  clock_in_lng: number | null;
  clock_out_lat: number | null;
  clock_out_lng: number | null;
  duration_minutes: number | null;
  status: 'present' | 'absent' | 'incomplete';
  notes: string | null;
  corrected_by: string | null;
  correction_reason: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface GeofenceConfig {
  id: string;
  center_lat: number;
  center_lng: number;
  radius_meters: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  role: 'admin' | 'employee';
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface FaceDescriptor {
  descriptor: Float32Array;
  label: string;
}
