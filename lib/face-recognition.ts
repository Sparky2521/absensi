import * as faceapi from 'face-api.js';

let modelsLoaded = false;

export const loadFaceRecognitionModels = async () => {
  if (modelsLoaded) return;

  const MODEL_URL = '/models';
  
  await Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
    faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
  ]);

  modelsLoaded = true;
};

export const captureFaceDescriptor = async (
  video: HTMLVideoElement
): Promise<Float32Array | null> => {
  const detection = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!detection) {
    return null;
  }

  return detection.descriptor;
};

export const compareFaceDescriptors = (
  descriptor1: Float32Array,
  descriptor2: Float32Array
): number => {
  return faceapi.euclideanDistance(descriptor1, descriptor2);
};

export const isFaceMatch = (
  descriptor1: Float32Array,
  descriptor2: Float32Array,
  threshold: number = 0.6
): boolean => {
  const distance = compareFaceDescriptors(descriptor1, descriptor2);
  return distance < threshold;
};

export const descriptorToBase64 = (descriptor: Float32Array): string => {
  const array = Array.from(descriptor);
  return btoa(JSON.stringify(array));
};

export const base64ToDescriptor = (base64: string): Float32Array => {
  const array = JSON.parse(atob(base64));
  return new Float32Array(array);
};

export const startVideoStream = async (
  videoElement: HTMLVideoElement
): Promise<MediaStream> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user',
      },
      audio: false,
    });

    videoElement.srcObject = stream;
    
    return new Promise((resolve) => {
      videoElement.onloadedmetadata = () => {
        videoElement.play();
        resolve(stream);
      };
    });
  } catch (error) {
    console.error('Error accessing camera:', error);
    throw new Error('Tidak dapat mengakses kamera. Pastikan izin kamera sudah diberikan.');
  }
};

export const stopVideoStream = (videoElement: HTMLVideoElement) => {
  const stream = videoElement.srcObject as MediaStream;
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    videoElement.srcObject = null;
  }
};
