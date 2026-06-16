'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Alert } from './ui/Alert';
import { Button } from './ui/Button';
import {
  loadFaceRecognitionModels,
  startVideoStream,
  stopVideoStream,
  captureFaceDescriptor,
} from '@/lib/face-recognition';

interface FaceRecognitionCaptureProps {
  onCapture: (descriptor: Float32Array) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export const FaceRecognitionCapture: React.FC<FaceRecognitionCaptureProps> = ({
  onCapture,
  onCancel,
  isProcessing = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCaptureReady, setIsCaptureReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load face recognition models
        await loadFaceRecognitionModels();

        if (!mounted) return;

        // Start video stream
        if (videoRef.current) {
          await startVideoStream(videoRef.current);
          setIsCaptureReady(true);
        }
      } catch (err) {
        console.error('Initialization error:', err);
        if (mounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Gagal menginisialisasi face recognition'
          );
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initialize();

    return () => {
      mounted = false;
      if (videoRef.current) {
        stopVideoStream(videoRef.current);
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!videoRef.current) return;

    try {
      setError(null);
      const descriptor = await captureFaceDescriptor(videoRef.current);

      if (!descriptor) {
        setError('Wajah tidak terdeteksi. Pastikan wajah Anda terlihat jelas di kamera.');
        return;
      }

      onCapture(descriptor);
    } catch (err) {
      console.error('Capture error:', err);
      setError(
        err instanceof Error ? err.message : 'Gagal menangkap data wajah'
      );
    }
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>Menginisialisasi kamera...</p>
            </div>
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          onClick={handleCapture}
          disabled={!isCaptureReady || isProcessing || isLoading}
          isLoading={isProcessing}
          className="flex-1"
        >
          {isProcessing ? 'Memproses...' : 'Tangkap Wajah'}
        </Button>
        <Button
          onClick={onCancel}
          variant="ghost"
          disabled={isProcessing}
        >
          Batal
        </Button>
      </div>

      <div className="text-sm text-gray-600 space-y-1">
        <p>Tips untuk hasil terbaik:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>Pastikan wajah Anda terlihat jelas</li>
          <li>Hindari pencahayaan yang terlalu terang atau gelap</li>
          <li>Tatap langsung ke kamera</li>
          <li>Lepaskan kacamata hitam atau masker</li>
        </ul>
      </div>
    </div>
  );
};
