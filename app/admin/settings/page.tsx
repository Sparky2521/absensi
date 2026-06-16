'use client';

import React, { useState, useEffect } from 'react';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navbar } from '@/components/Navbar';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { createClient } from '@/lib/supabase/client';
import { GeofenceConfig } from '@/types';

export default function SettingsPage() {
  const [config, setConfig] = useState<GeofenceConfig | null>(null);
  const [centerLat, setCenterLat] = useState('');
  const [centerLng, setCenterLng] = useState('');
  const [radius, setRadius] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('geofence_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setConfig(data);
        setCenterLat(data.center_lat.toString());
        setCenterLng(data.center_lng.toString());
        setRadius(data.radius_meters.toString());
      }
    } catch (err) {
      console.error('Error fetching config:', err);
      setError('Gagal memuat konfigurasi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const lat = parseFloat(centerLat);
    const lng = parseFloat(centerLng);
    const rad = parseInt(radius);

    if (isNaN(lat) || isNaN(lng) || isNaN(rad)) {
      setError('Mohon isi semua field dengan nilai yang valid');
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude harus antara -90 dan 90');
      return;
    }

    if (lng < -180 || lng > 180) {
      setError('Longitude harus antara -180 dan 180');
      return;
    }

    if (rad < 1) {
      setError('Radius harus lebih dari 0 meter');
      return;
    }

    try {
      setSaving(true);

      if (config) {
        // Update existing config
        const { error: updateError } = await supabase
          .from('geofence_config')
          .update({
            center_lat: lat,
            center_lng: lng,
            radius_meters: rad,
          })
          .eq('id', config.id);

        if (updateError) throw updateError;
      } else {
        // Deactivate all existing configs first
        await supabase
          .from('geofence_config')
          .update({ is_active: false })
          .eq('is_active', true);

        // Create new config
        const { error: insertError } = await supabase
          .from('geofence_config')
          .insert({
            center_lat: lat,
            center_lng: lng,
            radius_meters: rad,
            is_active: true,
          });

        if (insertError) throw insertError;
      }

      setSuccess('Konfigurasi geofencing berhasil disimpan');
      await fetchConfig();
    } catch (err) {
      console.error('Error saving config:', err);
      setError('Gagal menyimpan konfigurasi');
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation tidak didukung oleh browser Anda');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenterLat(position.coords.latitude.toString());
        setCenterLng(position.coords.longitude.toString());
        setSuccess('Lokasi saat ini berhasil diambil');
      },
      (error) => {
        setError('Gagal mengambil lokasi. Pastikan izin lokasi sudah diberikan.');
      }
    );
  };

  if (loading) {
    return (
      <ProtectedRoute requireAdmin>
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
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50">
        <Navbar />

        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              Pengaturan Geofencing
            </h1>
            <p className="text-gray-600 mt-2">
              Atur lokasi dan radius area kerja untuk validasi absensi
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
                Konfigurasi Lokasi
              </h2>
            </CardHeader>
            <CardBody>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg mb-6">
                  <p className="text-sm text-blue-800">
                    <strong>Cara mendapatkan koordinat:</strong>
                  </p>
                  <ol className="list-decimal list-inside text-sm text-blue-800 mt-2 space-y-1">
                    <li>Buka Google Maps di browser</li>
                    <li>Klik kanan pada lokasi kantor Anda</li>
                    <li>Klik pada koordinat yang muncul (akan otomatis tercopy)</li>
                    <li>Paste di field Latitude dan Longitude</li>
                  </ol>
                  <p className="text-sm text-blue-800 mt-2">
                    Atau klik tombol "Gunakan Lokasi Saat Ini" untuk menggunakan lokasi Anda sekarang.
                  </p>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  onClick={getCurrentLocation}
                  className="w-full"
                >
                  📍 Gunakan Lokasi Saat Ini
                </Button>

                <Input
                  label="Latitude (Garis Lintang)"
                  type="number"
                  step="any"
                  value={centerLat}
                  onChange={(e) => setCenterLat(e.target.value)}
                  placeholder="-6.200000"
                  required
                />

                <Input
                  label="Longitude (Garis Bujur)"
                  type="number"
                  step="any"
                  value={centerLng}
                  onChange={(e) => setCenterLng(e.target.value)}
                  placeholder="106.816666"
                  required
                />

                <Input
                  label="Radius (dalam meter)"
                  type="number"
                  value={radius}
                  onChange={(e) => setRadius(e.target.value)}
                  placeholder="100"
                  required
                />

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Catatan:</strong> Setelah menyimpan konfigurasi, semua karyawan hanya dapat melakukan absensi ketika berada dalam radius yang ditentukan dari titik koordinat ini.
                  </p>
                </div>

                <Button
                  type="submit"
                  isLoading={saving}
                  disabled={saving}
                  className="w-full"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
                </Button>
              </form>

              {config && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Konfigurasi Aktif Saat Ini
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Latitude:</span>
                      <span className="font-medium">{config.center_lat}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Longitude:</span>
                      <span className="font-medium">{config.center_lng}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Radius:</span>
                      <span className="font-medium">{config.radius_meters} meter</span>
                    </div>
                    <div className="mt-4">
                      <a
                        href={`https://www.google.com/maps?q=${config.center_lat},${config.center_lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 hover:text-primary-700 text-sm"
                      >
                        🗺️ Lihat di Google Maps
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>
        </main>
      </div>
    </ProtectedRoute>
  );
}
