'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GeofenceConfig } from '@/types';
import { getCurrentLocation, isWithinGeofence } from '@/lib/geolocation';

export const useGeofence = () => {
  const [config, setConfig] = useState<GeofenceConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    fetchGeofenceConfig();
  }, []);

  const fetchGeofenceConfig = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('geofence_config')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          setConfig(null);
          setError('Konfigurasi geofence belum diatur oleh admin');
        } else {
          throw error;
        }
      } else {
        setConfig(data);
        setError(null);
      }
    } catch (err) {
      console.error('Error fetching geofence config:', err);
      setError('Gagal mengambil konfigurasi geofence');
    } finally {
      setLoading(false);
    }
  };

  const validateLocation = async (): Promise<{
    isValid: boolean;
    message: string;
    latitude?: number;
    longitude?: number;
  }> => {
    if (!config) {
      return {
        isValid: false,
        message: 'Konfigurasi lokasi belum tersedia. Hubungi admin.',
      };
    }

    try {
      const currentLocation = await getCurrentLocation();
      const withinFence = isWithinGeofence(currentLocation, config);

      if (withinFence) {
        return {
          isValid: true,
          message: 'Lokasi valid',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };
      } else {
        return {
          isValid: false,
          message: 'Anda berada di luar area kerja yang ditentukan',
          latitude: currentLocation.latitude,
          longitude: currentLocation.longitude,
        };
      }
    } catch (err) {
      return {
        isValid: false,
        message: err instanceof Error ? err.message : 'Gagal mengambil lokasi',
      };
    }
  };

  return {
    config,
    loading,
    error,
    validateLocation,
    refreshConfig: fetchGeofenceConfig,
  };
};
