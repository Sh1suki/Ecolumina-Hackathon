import React, { useRef, useEffect, useState, useCallback } from "react";

interface CameraProps {
  onCapture: (base64: string) => void;
  /**
   * If true, skip the blur detection and always allow capture.
   * Useful for flows where even slightly blurry images are acceptable
   * (e.g. verification where network stability is a bigger concern).
   */
  skipBlurCheck?: boolean;
}

// Threshold for blur detection. Smaller = more lenient (fewer images marked as blurry).
const BLUR_THRESHOLD = 30;

const Camera: React.FC<CameraProps> = ({ onCapture, skipBlurCheck = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");
  const [captureError, setCaptureError] = useState<string>("");
  const [restartToken, setRestartToken] = useState(0);

  // Simple blur detection using variance of Laplacian on a downscaled copy
  const isImageBlurry = useCallback((sourceCanvas: HTMLCanvasElement): boolean => {
    try {
      const scale = 0.2; // work on 20% size for performance
      const width = Math.max(1, Math.floor(sourceCanvas.width * scale));
      const height = Math.max(1, Math.floor(sourceCanvas.height * scale));

      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext("2d");
      if (!tempCtx) return false;

      tempCtx.drawImage(sourceCanvas, 0, 0, width, height);
      const { data } = tempCtx.getImageData(0, 0, width, height);

      let sum = 0;
      let sumSq = 0;
      let count = 0;

      // Skip the outer 1px border to simplify neighbors
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const idx = (y * width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;

          const upIdx = ((y - 1) * width + x) * 4;
          const downIdx = ((y + 1) * width + x) * 4;
          const leftIdx = (y * width + (x - 1)) * 4;
          const rightIdx = (y * width + (x + 1)) * 4;

          const grayUp = 0.299 * data[upIdx] + 0.587 * data[upIdx + 1] + 0.114 * data[upIdx + 2];
          const grayDown = 0.299 * data[downIdx] + 0.587 * data[downIdx + 1] + 0.114 * data[downIdx + 2];
          const grayLeft = 0.299 * data[leftIdx] + 0.587 * data[leftIdx + 1] + 0.114 * data[leftIdx + 2];
          const grayRight = 0.299 * data[rightIdx] + 0.587 * data[rightIdx + 1] + 0.114 * data[rightIdx + 2];

          const laplacian = 4 * gray - (grayUp + grayDown + grayLeft + grayRight);
          sum += laplacian;
          sumSq += laplacian * laplacian;
          count++;
        }
      }

      if (count === 0) return false;
      const mean = sum / count;
      const variance = sumSq / count - mean * mean;

      return variance < BLUR_THRESHOLD;
    } catch {
      // If anything goes wrong, don't block the capture
      return false;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    let localStream: MediaStream | null = null;

    const stopMediaStream = (s: MediaStream | null) => {
      if (s) {
        s.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };

    const startCamera = async () => {
      setError("");
      setCaptureError("");

      // Constraints to try in sequence
      // using 'ideal' prevents errors on devices without specific cameras (like laptops)
      const strategies = [
        // 1. Ideal: Rear camera, HD resolution
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        },
        // 2. Fallback: Just rear camera preference
        {
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        },
        // 3. Last resort: Any video source
        { video: true, audio: false },
      ];

      for (const constraints of strategies) {
        if (!mounted) return;
        try {
          const s = await navigator.mediaDevices.getUserMedia(constraints);
          if (!mounted) {
            // Component unmounted while we were waiting for camera
            stopMediaStream(s);
            return;
          }
          localStream = s;
          break; // Success - found a working camera
        } catch (err) {
          console.warn("Camera strategy failed:", constraints, err);
          // Continue loop to next strategy
        }
      }

      if (!mounted) return;

      if (!localStream) {
        setError(
          "Could not start video source. Please ensure camera permissions are allowed and no other app is using the camera.",
        );
        return;
      }

      // Assign to video element
      if (videoRef.current) {
        videoRef.current.srcObject = localStream;
        // Attempt to play (needed for some mobile browsers to actually start the feed)
        try {
          await videoRef.current.play();
        } catch (e) {
          console.error("Video play failed", e);
        }
      }

      setStream(localStream);
    };

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      startCamera();
    } else {
      setError("Camera API not supported in this browser (requires HTTPS).");
    }

    return () => {
      mounted = false;
      stopMediaStream(localStream);
    };
  }, [restartToken]);

  const handleCapture = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context && video.videoWidth && video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Optionally check if the captured image is blurry before sending to Gemini
        if (!skipBlurCheck) {
          const blurry = isImageBlurry(canvas);
          if (blurry) {
            setCaptureError("The image looks blurry. Please hold your phone steady and try again.");
            return;
          }
        }

        setCaptureError("");
        // Convert to standard JPEG base64 with slightly lower quality for speed/size
        const image = canvas.toDataURL("image/jpeg", 0.6);
        onCapture(image);
      }
    }
  }, [isImageBlurry, onCapture, skipBlurCheck]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-black text-white p-6 text-center">
        <span className="material-icons-round text-6xl text-red-500 mb-4">videocam_off</span>
        <p className="text-lg font-bold mb-2">Camera Error</p>
        <p className="text-sm opacity-80 mb-6">{error}</p>
        <button
          onClick={() => setRestartToken((t) => t + 1)}
          className="px-6 py-2 bg-white text-black rounded-full text-sm font-bold hover:bg-gray-200 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black overflow-hidden flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />

      {/* Blur / capture error message */}
      {captureError && (
        <div className="absolute inset-x-0 bottom-36 px-4 z-20 flex justify-center">
          <div className="bg-black/70 text-red-200 text-xs px-3 py-2 rounded-full max-w-xs text-center">
            {captureError}
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div className="absolute inset-x-0 bottom-0 pb-safe pt-24 bg-gradient-to-t from-black/80 to-transparent flex justify-center items-center z-10 pointer-events-none">
        <div className="pb-12 pointer-events-auto">
          <button
            onClick={handleCapture}
            className="w-20 h-20 rounded-full border-4 border-white bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/40 active:scale-95 transition-all shadow-lg"
            aria-label="Take Photo"
          >
            <div className="w-16 h-16 bg-white rounded-full"></div>
          </button>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-10">
        <span className="px-3 py-1 bg-black/50 text-white text-xs rounded-full backdrop-blur-md flex items-center gap-1">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
          Live
        </span>
      </div>
    </div>
  );
};

export default Camera;
