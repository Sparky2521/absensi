export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      employees: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          full_name: string
          email: string
          position: string
          department: string
          is_active: boolean
          face_descriptor_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          full_name: string
          email: string
          position: string
          department: string
          is_active?: boolean
          face_descriptor_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          full_name?: string
          email?: string
          position?: string
          department?: string
          is_active?: boolean
          face_descriptor_url?: string | null
        }
      }
      attendance_records: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          employee_id: string
          date: string
          clock_in_time: string | null
          clock_out_time: string | null
          clock_in_lat: number | null
          clock_in_lng: number | null
          clock_out_lat: number | null
          clock_out_lng: number | null
          duration_minutes: number | null
          status: string
          notes: string | null
          corrected_by: string | null
          correction_reason: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          employee_id: string
          date: string
          clock_in_time?: string | null
          clock_out_time?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          duration_minutes?: number | null
          status?: string
          notes?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          employee_id?: string
          date?: string
          clock_in_time?: string | null
          clock_out_time?: string | null
          clock_in_lat?: number | null
          clock_in_lng?: number | null
          clock_out_lat?: number | null
          clock_out_lng?: number | null
          duration_minutes?: number | null
          status?: string
          notes?: string | null
          corrected_by?: string | null
          correction_reason?: string | null
        }
      }
      geofence_config: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          center_lat: number
          center_lng: number
          radius_meters: number
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          center_lat: number
          center_lng: number
          radius_meters: number
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          center_lat?: number
          center_lng?: number
          radius_meters?: number
          is_active?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          created_at: string
          user_id: string
          action: string
          table_name: string
          record_id: string | null
          old_data: Json | null
          new_data: Json | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          action: string
          table_name: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          action?: string
          table_name?: string
          record_id?: string | null
          old_data?: Json | null
          new_data?: Json | null
          description?: string | null
        }
      }
    }
  }
}
