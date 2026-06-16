'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Button } from './ui/Button';

export const Navbar: React.FC = () => {
  const { user, role, signOut } = useAuth();

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href={role === 'admin' ? '/admin' : '/dashboard'}>
              <h1 className="text-xl font-bold text-primary-600">
                Sistem Absensi Karyawan
              </h1>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              {role === 'admin' ? (
                <>
                  <Link
                    href="/admin"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/employees"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Karyawan
                  </Link>
                  <Link
                    href="/admin/attendance"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Absensi
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Pengaturan
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/attendance"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Absensi
                  </Link>
                  <Link
                    href="/history"
                    className="text-gray-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Riwayat
                  </Link>
                </>
              )}

              <div className="flex items-center space-x-3 border-l pl-4">
                <div className="text-sm">
                  <p className="text-gray-900 font-medium">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-gray-500 text-xs capitalize">{role}</p>
                </div>
                <Button onClick={signOut} variant="ghost" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};
