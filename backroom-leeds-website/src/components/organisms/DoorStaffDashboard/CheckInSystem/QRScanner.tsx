'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Card } from '@/components/molecules';
import { Button, Heading, Text } from '@/components/atoms';

interface QRScannerProps {
  onCheckInSuccess: (result: any) => void;
}

interface VerifiedBooking {
  id: string;
  bookingRef: string;
  customerName: string;
  customerPhone: string;
  partySize: number;
  arrivalTime: string;
  tableIds: number[];
  tables: Array<{
    table_number: number;
    floor: string;
  }>;
  hasSpecialRequests: boolean;
  specialRequests: any;
}

export const QRScanner = ({ onCheckInSuccess }: QRScannerProps) => {
  const [isScanning, setIsScanning] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [verifiedBooking, setVerifiedBooking] = useState<VerifiedBooking | null>(null);
  const [processing, setProcessing] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  const [showManualEntry, setShowManualEntry] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera
  const startCamera = async () => {
    try {
      setError(null);
      
      const constraints = {
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      setIsScanning(true);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Camera access denied. Please allow camera permissions and try again.');
    }
  };

  // Stop camera
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    setIsScanning(false);
  }, [stream]);

  // Simulate QR code detection (in production, use a QR code library like jsQR)
  const scanForQRCode = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current || processing) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.videoWidth === 0 || video.videoHeight === 0) return;

    // Set canvas dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // In production, this is where you would use jsQR or similar library
    // For demo purposes, we'll simulate QR detection with a placeholder
    
    // Simulate finding QR code data (replace with actual QR detection)
    // const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    // const qrCode = jsQR(imageData.data, imageData.width, imageData.height);
    
    // For now, we'll just proceed to manual entry for testing
  }, [processing]);

  // Start scanning interval
  useEffect(() => {
    if (isScanning && !scanIntervalRef.current) {
      scanIntervalRef.current = setInterval(scanForQRCode, 100); // Scan every 100ms
    }

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
        scanIntervalRef.current = null;
      }
    };
  }, [isScanning, scanForQRCode]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Verify QR code data
  const verifyQRCode = async (qrData: string) => {
    if (processing) return;
    
    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/door-staff/qr-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ qrData })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'QR code verification failed');
      }

      if (result.success && result.booking) {
        setVerifiedBooking(result.booking);
        stopCamera(); // Stop scanning when QR is verified
      } else {
        throw new Error('Invalid QR code data');
      }

    } catch (err) {
      console.error('QR verification error:', err);
      setError(err instanceof Error ? err.message : 'Failed to verify QR code');
    } finally {
      setProcessing(false);
    }
  };

  // Handle manual QR data entry
  const handleManualVerify = async () => {
    if (!manualEntry.trim()) {
      setError('Please enter QR code data');
      return;
    }

    await verifyQRCode(manualEntry.trim());
  };

  // Complete check-in
  const handleCheckIn = async () => {
    if (!verifiedBooking) return;

    setProcessing(true);
    setError(null);

    try {
      const response = await fetch('/api/door-staff/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bookingId: verifiedBooking.id,
          method: 'qr'
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Check-in failed');
      }

      onCheckInSuccess({
        success: true,
        booking: {
          id: verifiedBooking.id,
          bookingRef: verifiedBooking.bookingRef,
          customerName: verifiedBooking.customerName,
          partySize: verifiedBooking.partySize,
          tableIds: verifiedBooking.tableIds,
          tables: verifiedBooking.tables
        },
        checkedInAt: result.checkedInAt,
        method: 'qr'
      });

      // Reset state
      setVerifiedBooking(null);
      setManualEntry('');
      setShowManualEntry(false);

    } catch (err) {
      console.error('Check-in error:', err);
      setError(err instanceof Error ? err.message : 'Failed to complete check-in');
    } finally {
      setProcessing(false);
    }
  };

  // Handle cancel verification
  const handleCancelVerification = () => {
    setVerifiedBooking(null);
    setError(null);
    if (!isScanning) {
      startCamera();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Camera Scanner */}
      <Card className="p-6">
        <Heading level={3} variant="bebas" className="text-speakeasy-gold mb-4">
          📱 QR Code Scanner
        </Heading>

        {!isScanning && !verifiedBooking ? (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">📷</div>
            <Text className="text-speakeasy-champagne">
              Click start to begin scanning QR codes
            </Text>
            <Button
              onClick={startCamera}
              disabled={processing}
              className="bg-speakeasy-gold text-speakeasy-noir hover:bg-speakeasy-champagne"
            >
              {processing ? 'Starting Camera...' : 'Start Camera'}
            </Button>
          </div>
        ) : isScanning ? (
          <div className="space-y-4">
            <div className="relative">
              <video
                ref={videoRef}
                className="w-full rounded-sm bg-black"
                playsInline
                muted
                autoPlay
              />
              <canvas
                ref={canvasRef}
                className="hidden"
              />
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-4 border-speakeasy-gold rounded-sm relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-speakeasy-gold"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-speakeasy-gold"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-speakeasy-gold"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-speakeasy-gold"></div>
                </div>
              </div>
              
              {processing && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-speakeasy-gold">
                    <div className="w-8 h-8 border-4 border-speakeasy-gold border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <Text>Processing QR Code...</Text>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={stopCamera}
                variant="ghost"
                size="sm"
                disabled={processing}
                className="flex-1"
              >
                Stop Scanner
              </Button>
              <Button
                onClick={() => setShowManualEntry(!showManualEntry)}
                variant="ghost"
                size="sm"
                className="flex-1"
              >
                Manual Entry
              </Button>
            </div>
          </div>
        ) : null}

        {/* Manual Entry */}
        {showManualEntry && (
          <div className="mt-4 p-4 bg-speakeasy-noir/30 rounded-sm border border-speakeasy-gold/20">
            <Text className="text-speakeasy-champagne mb-2 text-sm">
              Manually enter QR code data:
            </Text>
            <div className="flex gap-2">
              <input
                type="text"
                value={manualEntry}
                onChange={(e) => setManualEntry(e.target.value)}
                placeholder="Paste QR code data here..."
                className="flex-1 px-3 py-2 bg-speakeasy-noir/50 border border-speakeasy-gold/30 text-speakeasy-champagne placeholder-speakeasy-copper rounded-sm focus:border-speakeasy-gold focus:outline-none"
              />
              <Button
                onClick={handleManualVerify}
                disabled={processing || !manualEntry.trim()}
                size="sm"
                className="bg-speakeasy-gold text-speakeasy-noir"
              >
                Verify
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-900/20 border border-red-400/30 rounded-sm">
            <Text className="text-red-400 text-sm">
              ⚠️ {error}
            </Text>
          </div>
        )}
      </Card>

      {/* Booking Verification */}
      {verifiedBooking ? (
        <Card className="p-6">
          <div className="text-center mb-4">
            <div className="text-4xl mb-2">✅</div>
            <Heading level={3} variant="bebas" className="text-green-400">
              QR Code Verified
            </Heading>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex justify-between">
              <Text className="text-speakeasy-copper">Booking Ref:</Text>
              <Text className="text-speakeasy-champagne font-mono">
                {verifiedBooking.bookingRef}
              </Text>
            </div>
            
            <div className="flex justify-between">
              <Text className="text-speakeasy-copper">Customer:</Text>
              <Text className="text-speakeasy-champagne font-medium">
                {verifiedBooking.customerName}
              </Text>
            </div>
            
            <div className="flex justify-between">
              <Text className="text-speakeasy-copper">Party Size:</Text>
              <Text className="text-speakeasy-champagne">
                {verifiedBooking.partySize} guests
              </Text>
            </div>
            
            <div className="flex justify-between">
              <Text className="text-speakeasy-copper">Arrival Time:</Text>
              <Text className="text-speakeasy-champagne">
                {verifiedBooking.arrivalTime}
              </Text>
            </div>
            
            <div className="flex justify-between">
              <Text className="text-speakeasy-copper">Table(s):</Text>
              <Text className="text-speakeasy-champagne">
                {verifiedBooking.tables.map(t => `${t.table_number} (${t.floor})`).join(', ')}
              </Text>
            </div>

            {verifiedBooking.hasSpecialRequests && (
              <div className="pt-2 border-t border-speakeasy-gold/20">
                <div className="flex items-center gap-2">
                  <span className="text-speakeasy-gold">⭐</span>
                  <Text className="text-speakeasy-gold">Special requests noted</Text>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              onClick={handleCheckIn}
              disabled={processing}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white"
            >
              {processing ? 'Checking In...' : '✅ Complete Check-In'}
            </Button>
            <Button
              onClick={handleCancelVerification}
              variant="ghost"
              disabled={processing}
              className="text-speakeasy-copper hover:text-speakeasy-gold"
            >
              Cancel
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="text-center py-8">
            <div className="text-6xl mb-4">📋</div>
            <Heading level={3} variant="bebas" className="text-speakeasy-champagne mb-2">
              Ready to Scan
            </Heading>
            <Text className="text-speakeasy-copper">
              Point the camera at a booking QR code or use manual entry
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
};