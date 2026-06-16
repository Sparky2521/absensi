'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { FaceRecognitionCapture } from '@/components/FaceRecognitionCapture';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGeofence } from '@/hooks/useGeofence';
import {
  base64ToDescriptor,
  isFaceMatch,
  descriptorToBase64,
} from '@/lib/face-recognition';
import { getTodayDate, calculateDuration } from '@/lib/utils';

export default function AttendancePage() {
  const { user } = useAuth();
  const { config, validateLocation } = useGeofence();
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState<'clock-in' | 'clock-out'>('clock-in');
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (employeeError) throw employeeError;
      setEmployee(employeeData);

      // Get today's attendance
      const today = getTodayDate();
      const { data: recordData, error: recordError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('date', today)
        .single();

      if (recordError && recordError.code !== 'PGRST116') {
        throw recordError;
      }

      setTodayRecord(recordData);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleClockInClick = () => {
    setError(null);
    setSuccess(null);

    if (!employee?.face_descriptor_url) {
      setError('Wajah Anda belum didaftarkan. Silakan hubungi admin.');
      return;
    }

    if (todayRecord && todayRecord.clock_in_time) {
      setError('Anda sudah melakukan clock in hari ini.');
      return;
    }

    if (!config) {
      setError('Konfigurasi lokasi belum tersedia. Hubungi admin.');
      return;
    }

    setActionType('clock-in');
    setShowModal(true);
  };

  const handleClockOutClick = () => {
    setError(null);
    setSuccess(null);

    if (!todayRecord || !todayRecord.clock_in_time) {
      setError('Anda belum melakukan clock in hari ini.');
      return;
    }

    if (todayRecord.clock_out_time) {
      setError('Anda sudah melakukan clock out hari ini.');
      return;
    }

    setActionType('clock-out');
    setShowModal(true);
  };

  const handleFaceCapture = async (descriptor: Float32Array) => {
    try {
      setProcessing(true);
      setError(null);

      // Validate location
      const locationResult = await validateLocation();
      if (!locationResult.isValid) {
        setError(locationResult.message);
        return;
      }

      // Download and verify face descriptor
      const { data: fileData, error: fileError } = await supabase.storage
        .from('face-descriptors')
        .download(employee.face_descriptor_url);

      if (fileError) throw fileError;

      const text = await fileData.text();
      const storedDescriptor = base64ToDescriptor(text);

      // Compare face descriptors
      const threshold = parseFloat(
        process.env.NEXT_PUBLIC_FACE_RECOGNITION_THRESHOLD || '0.6'
      );
      const isMatch = isFaceMatch(descriptor, storedDescriptor, threshold);

      if (!isMatch) {
        setError('Verifikasi wajah gagal. Wajah tidak cocok dengan data yang tersimpan.');
        return;
      }

      // Perform clock in/out
      if (actionType === 'clock-in') {
        await performClockIn(locationResult.latitude!, locationResult.longitude!);
      } else {
        await performClockOut(locationResult.latitude!, locationResult.longitude!);
      }

      setShowModal(false);
      await fetchData();
    } catch (err) {
      console.error('Error processing attendance:', err);
      setError(
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses absensi'
      );
    } finally {
      setProcessing(false);
    }
  };

  const performClockIn = async (latitude: number, longitude: number) => {
    const today = getTodayDate();
    const now = new Date().toISOString();

    const { error } = await supabase.from('attendance_records').insert({
      employee_id: employee.id,
      date: today,
      clock_in_time: now,
      clock_in_lat: latitude,
      clock_in_lng: longitude,
      status: 'incomplete',
    });

    if (error) throw error;

    setSuccess('Clock in berhasil! Selamat bekerja.');
  };

  const performClockOut = async (latitude: number, longitude: number) => {
    const now = new Date().toISOString();
    const duration = calculateDuration(todayRecord.clock_in_time, now);

    const { error } = await supabase
      .from('attendance_records')
      .update({
        clock_out_time: now,
        clock_out_lat: latitude,
        clock_out_lng: longitude,
        duration_minutes: duration,
        status: 'present',
      })
      .eq('id', todayRecord.id);

    if (error) throw error;

    setSuccess('Clock out berhasil! Terima kasih atas kerja keras Anda hari ini.');
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
            <p className="text-gray-600">Memuat...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Absensi</h1>
            <p className="text-gray-600 mt-2">
              Lakukan clock in atau clock out dengan verifikasi wajah dan lokasi
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {success && (
            <Alert type="success" className="mb-6">
              {success}
            </Alert>
          )}

          <Card>
            <CardHeader>
              <h2 className="text-xl font-semibold text-gray-900">
                Status Absensi Hari Ini
              </h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Clock In
                      </h3>
                      {todayRecord?.clock_in_time && (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {todayRecord?.clock_in_time
                        ? new Date(todayRecord.clock_in_time).toLocaleTimeString(
                            'id-ID',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : '-'}
                    </p>
                    <Button
                      onClick={handleClockInClick}
                      disabled={todayRecord?.clock_in_time}
                      className="w-full"
                    >
                      {todayRecord?.clock_in_time ? 'Sudah Clock In' : 'Clock In'}
                    </Button>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium text-gray-900">
                        Clock Out
                      </h3>
                      {todayRecord?.clock_out_time && (
                        <svg
                          className="w-6 h-6 text-green-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-4">
                      {todayRecord?.clock_out_time
                        ? new Date(todayRecord.clock_out_time).toLocaleTimeString(
                            'id-ID',
                            {
                              hour: '2-digit',
                              minute: '2-digit',
                            }
                          )
                        : '-'}
                    </p>
                    <Button
                      onClick={handleClockOutClick}
                      disabled={
                        !todayRecord?.clock_in_time || todayRecord?.clock_out_time
                      }
                      className="w-full"
                    >
                      {todayRecord?.clock_out_time
                        ? 'Sudah Clock Out'
                        : 'Clock Out'}
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Catatan:</strong> Pastikan Anda berada di area kerja dan
                    izinkan akses kamera serta lokasi untuk melakukan absensi.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>
        </main>

        <Modal
          isOpen={showModal}
          onClose={() => !processing && setShowModal(false)}
          title={actionType === 'clock-in' ? 'Clock In' : 'Clock Out'}
          size="lg"
        >
          <FaceRecognitionCapture
            onCapture={handleFaceCapture}
            onCancel={() => setShowModal(false)}
            isProcessing={processing}
          />
        </Modal>
      </div>
    </ProtectedRoute>
  );
}
