'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { getTodayDate } from '@/lib/utils';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeEmployees: 0,
    todayPresent: 0,
    todayAbsent: 0,
  });
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      const today = getTodayDate();

      // Get total and active employees
      const { data: allEmployees, error: employeesError } = await supabase
        .from('employees')
        .select('*');

      if (employeesError) throw employeesError;

      const activeEmployees = allEmployees?.filter((e) => e.is_active) || [];

      // Get today's attendance
      const { data: todayAttendance, error: attendanceError } = await supabase
        .from('attendance_records')
        .select('*, employee:employees(*)')
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      const presentCount = todayAttendance?.filter(
        (a) => a.clock_in_time
      ).length || 0;

      // Calculate department stats
      const deptMap = new Map();
      activeEmployees.forEach((emp) => {
        if (!deptMap.has(emp.department)) {
          deptMap.set(emp.department, {
            department: emp.department,
            total: 0,
            present: 0,
          });
        }
        const dept = deptMap.get(emp.department);
        dept.total += 1;

        const hasAttendance = todayAttendance?.some(
          (a) => a.employee_id === emp.id && a.clock_in_time
        );
        if (hasAttendance) {
          dept.present += 1;
        }
      });

      const deptStats = Array.from(deptMap.values()).map((dept) => ({
        ...dept,
        percentage: dept.total > 0 ? ((dept.present / dept.total) * 100).toFixed(1) : '0',
      }));

      setStats({
        totalEmployees: allEmployees?.length || 0,
        activeEmployees: activeEmployees.length,
        todayPresent: presentCount,
        todayAbsent: activeEmployees.length - presentCount,
      });

      setDepartmentStats(deptStats);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError('Gagal memuat statistik dashboard');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard Admin
            </h1>
            <p className="text-gray-600 mt-2">
              Ringkasan dan statistik kehadiran karyawan
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
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Total Karyawan
                        </p>
                        <p className="text-3xl font-bold text-gray-900 mt-2">
                          {stats.totalEmployees}
                        </p>
                      </div>
                      <div className="bg-primary-100 p-3 rounded-full">
                        <svg
                          className="w-8 h-8 text-primary-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Karyawan Aktif
                        </p>
                        <p className="text-3xl font-bold text-green-600 mt-2">
                          {stats.activeEmployees}
                        </p>
                      </div>
                      <div className="bg-green-100 p-3 rounded-full">
                        <svg
                          className="w-8 h-8 text-green-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Hadir Hari Ini
                        </p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">
                          {stats.todayPresent}
                        </p>
                      </div>
                      <div className="bg-blue-100 p-3 rounded-full">
                        <svg
                          className="w-8 h-8 text-blue-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Belum Hadir
                        </p>
                        <p className="text-3xl font-bold text-red-600 mt-2">
                          {stats.todayAbsent}
                        </p>
                      </div>
                      <div className="bg-red-100 p-3 rounded-full">
                        <svg
                          className="w-8 h-8 text-red-600"
                          fill="none"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              </div>

              {/* Department Stats */}
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Statistik Kehadiran per Departemen
                  </h2>
                </CardHeader>
                <CardBody>
                  {departmentStats.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Departemen
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Karyawan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Hadir Hari Ini
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Persentase
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {departmentStats.map((dept, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {dept.department}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {dept.total}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {dept.present}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <span className="text-sm font-medium text-gray-900 mr-2">
                                    {dept.percentage}%
                                  </span>
                                  <div className="w-32 bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 h-2 rounded-full"
                                      style={{ width: `${dept.percentage}%` }}
                                    />
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-center text-gray-600 py-8">
                      Belum ada data departemen
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
