'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { formatDate, formatTime, formatDuration, getTodayDate } from '@/lib/utils';
import { AttendanceRecord } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const today = getTodayDate();

      // Get employee data
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (employeeError) throw employeeError;

      // Get today's attendance
      const { data: todayData, error: todayError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('date', today)
        .single();

      if (todayError && todayError.code !== 'PGRST116') {
        throw todayError;
      }

      setTodayRecord(todayData);

      // Get recent attendance records
      const { data: recentData, error: recentError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('employee_id', employeeData.id)
        .order('date', { ascending: false })
        .limit(5);

      if (recentError) throw recentError;

      setRecentRecords(recentData || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Selamat datang, {user?.user_metadata?.full_name || user?.email}
            </p>
          </div>

          {error && (
            <Alert type="error" className="mb-6">
              {error}
            </Alert>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
              <p className="text-gray-600">Memuat data...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Today's Status */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Status Hari Ini
                  </h2>
                  <p className="text-gray-600 text-sm">
                    {formatDate(new Date())}
                  </p>
                </CardHeader>
                <CardBody>
                  {todayRecord ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">
                            Clock In
                          </p>
                          <p className="text-2xl font-bold text-green-900">
                            {todayRecord.clock_in_time
                              ? formatTime(todayRecord.clock_in_time)
                              : '-'}
                          </p>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">
                            Clock Out
                          </p>
                          <p className="text-2xl font-bold text-blue-900">
                            {todayRecord.clock_out_time
                              ? formatTime(todayRecord.clock_out_time)
                              : 'Belum Clock Out'}
                          </p>
                        </div>

                        <div className="bg-purple-50 p-4 rounded-lg">
                          <p className="text-sm text-purple-600 font-medium">
                            Durasi
                          </p>
                          <p className="text-2xl font-bold text-purple-900">
                            {todayRecord.duration_minutes
                              ? formatDuration(todayRecord.duration_minutes)
                              : '-'}
                          </p>
                        </div>
                      </div>

                      {!todayRecord.clock_out_time && (
                        <Link href="/attendance">
                          <button className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                            Clock Out Sekarang
                          </button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-600 mb-4">
                        Anda belum melakukan absensi hari ini
                      </p>
                      <Link href="/attendance">
                        <button className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium">
                          Clock In Sekarang
                        </button>
                      </Link>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Recent Attendance */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Riwayat Absensi Terakhir
                    </h2>
                    <Link
                      href="/history"
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      Lihat Semua
                    </Link>
                  </div>
                </CardHeader>
                <CardBody>
                  {recentRecords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tanggal
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clock In
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Clock Out
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Durasi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {recentRecords.map((record) => (
                            <tr key={record.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {formatDate(record.date)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.clock_in_time
                                  ? formatTime(record.clock_in_time)
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.clock_out_time
                                  ? formatTime(record.clock_out_time)
                                  : 'Belum Clock Out'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {record.duration_minutes
                                  ? formatDuration(record.duration_minutes)
                                  : '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    record.status === 'present'
                                      ? 'bg-green-100 text-green-800'
                                      : record.status === 'incomplete'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}
                                >
                                  {record.status === 'present'
                                    ? 'Hadir'
                                    : record.status === 'incomplete'
                                    ? 'Tidak Lengkap'
                                    : 'Tidak Hadir'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 py-8">
                      Belum ada riwayat absensi
                    </p>
                  )}
                </CardBody>
              </Card>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
