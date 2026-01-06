/**
 * QR Scanner Component
 * 
 * Uses qr-scanner library to scan QR codes from the device camera.
 * Based on: https://dev.to/yusufginanjar/how-to-implement-qr-scanner-in-reactjs-ao7
 * 
 * Displays a modal with camera feed and handles scanned results.
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import QrScanner from 'qr-scanner';
import { X, Camera, AlertCircle } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import LoadingSpinner from './LoadingSpinner';

interface QRScannerProps {
  /**
   * Whether the scanner is open
   */
  isOpen: boolean;

  /**
   * Callback when scanner is closed
   */
  onClose: () => void;

  /**
   * Callback when a QR code is successfully scanned
   */
  onScan: (result: string) => void;

  /**
   * Optional title for the scanner modal
   */
  title?: string;

  /**
   * Optional description for the scanner modal
   */
  description?: string;
}

/**
 * QR Scanner Component
 * 
 * Opens device camera and scans QR codes. When a QR code is detected,
 * calls onScan with the decoded text and closes the scanner.
 * 
 * @example
 * ```tsx
 * <QRScanner
 *   isOpen={showScanner}
 *   onClose={() => setShowScanner(false)}
 *   onScan={(result) => {
 *     setRecipientAddress(result);
 *     setShowScanner(false);
 *   }}
 * />
 * ```
 */
export default function QRScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scan QR Code',
  description = 'Point your camera at a QR code to scan a wallet address',
}: QRScannerProps) {
  const scannerRef = useRef<QrScanner | null>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const qrBoxElRef = useRef<HTMLDivElement>(null);
  const [qrOn, setQrOn] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Get device-specific scanner configuration
  const getScannerConfig = () => {
    if (typeof window === 'undefined') {
      return { preferredCamera: 'environment' as const };
    }

    const width = window.innerWidth;
    const isMobile = width < 640;
    const isTablet = width >= 640 && width < 1024;

    return {
      preferredCamera: 'environment' as const, // Back camera on mobile
      highlightScanRegion: true,
      highlightCodeOutline: true,
      overlay: qrBoxElRef.current || undefined,
    };
  };

  useEffect(() => {
    if (!isOpen) {
      // Cleanup when scanner is closed
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
      setQrOn(false);
      setError(null);
      setIsInitializing(false);
      return;
    }

    // Initialize scanner when opened
    if (videoElRef?.current && !scannerRef.current) {
      setIsInitializing(true);
      setError(null);

      try {
        // Instantiate the QR Scanner
        const config = getScannerConfig();
        scannerRef.current = new QrScanner(
          videoElRef.current,
          (result: QrScanner.ScanResult) => {
            // Successfully scanned
            onScan(result.data);
            // Stop and close
            if (scannerRef.current) {
              scannerRef.current.stop();
              scannerRef.current.destroy();
              scannerRef.current = null;
            }
            setQrOn(false);
            onClose();
          },
          {
            ...config,
            onDecodeError: (err: string | Error) => {
              // Ignore scanning errors (they're frequent while looking for QR codes)
              // Only log if it's not a "No QR code found" error
              if (typeof err === 'string' && !err.includes('No QR code')) {
                console.log('[QRScanner] Decode error:', err);
              }
            },
          }
        );

        // Start QR Scanner
        scannerRef.current
          .start()
          .then(() => {
            setQrOn(true);
            setIsInitializing(false);
          })
          .catch((err) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            
            if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
              setError('Camera permission denied. Please allow camera access and try again.');
            } else if (errorMessage.includes('NotFoundError') || errorMessage.includes('DevicesNotFoundError')) {
              setError('No camera found. Please connect a camera device.');
            } else {
              setError(`Failed to start camera: ${errorMessage}`);
            }
            
            setQrOn(false);
            setIsInitializing(false);
            if (scannerRef.current) {
              scannerRef.current.destroy();
              scannerRef.current = null;
            }
          });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(`Failed to initialize scanner: ${errorMessage}`);
        setIsInitializing(false);
        setQrOn(false);
      }
    }

    // Cleanup on unmount
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop();
        scannerRef.current.destroy();
        scannerRef.current = null;
      }
    };
  }, [isOpen, onScan, onClose]);

  // Show alert if camera is blocked
  useEffect(() => {
    if (!qrOn && isOpen && !isInitializing && !error) {
      // Camera failed to start but no specific error - might be permission issue
      console.log('[QRScanner] Camera not accessible');
    }
  }, [qrOn, isOpen, isInitializing, error]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Camera className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.stop();
                  scannerRef.current.destroy();
                  scannerRef.current = null;
                }
                setQrOn(false);
                onClose();
              }}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-destructive">{error}</p>
                  {error.includes('permission') && (
                    <p className="text-xs text-muted-foreground mt-2">
                      To enable camera access:
                      <br />
                      • Click the camera icon in your browser's address bar
                      <br />
                      • Select "Allow" for camera permissions
                      <br />
                      • Refresh the page and try again
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="relative w-full rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '1 / 1' }}>
            <video
              ref={videoElRef}
              className="w-full h-full object-cover"
              style={{
                minHeight: typeof window !== 'undefined' && window.innerWidth < 640 ? '280px' : '350px',
              }}
            />
            {/* Darkened overlay with transparent scanning area */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top overlay */}
              <div className="absolute top-0 left-0 right-0 h-[20%] bg-black/60" />
              {/* Bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-black/60" />
              {/* Left overlay */}
              <div className="absolute top-[20%] bottom-[20%] left-0 w-[20%] bg-black/60" />
              {/* Right overlay */}
              <div className="absolute top-[20%] bottom-[20%] right-0 w-[20%] bg-black/60" />
            </div>
            {/* QR Code scanning frame with corner indicators */}
            <div
              ref={qrBoxElRef}
              className="absolute pointer-events-none"
              style={{
                top: '20%',
                left: '20%',
                width: '60%',
                height: '60%',
              }}
            >
              {/* Border frame */}
              <div
                className="absolute inset-0 rounded-xl"
                style={{
                  border: '2.5px solid rgba(168, 85, 247, 0.9)',
                  boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)',
                }}
              />
              {/* Corner indicators - Top Left */}
              <div className="absolute -top-0.5 -left-0.5 w-8 h-8">
                <div className="absolute top-0 left-0 w-6 h-1.5 bg-purple-500 rounded-r" />
                <div className="absolute top-0 left-0 w-1.5 h-6 bg-purple-500 rounded-b" />
              </div>
              {/* Top Right */}
              <div className="absolute -top-0.5 -right-0.5 w-8 h-8">
                <div className="absolute top-0 right-0 w-6 h-1.5 bg-purple-500 rounded-l" />
                <div className="absolute top-0 right-0 w-1.5 h-6 bg-purple-500 rounded-b" />
              </div>
              {/* Bottom Left */}
              <div className="absolute -bottom-0.5 -left-0.5 w-8 h-8">
                <div className="absolute bottom-0 left-0 w-6 h-1.5 bg-purple-500 rounded-r" />
                <div className="absolute bottom-0 left-0 w-1.5 h-6 bg-purple-500 rounded-t" />
              </div>
              {/* Bottom Right */}
              <div className="absolute -bottom-0.5 -right-0.5 w-8 h-8">
                <div className="absolute bottom-0 right-0 w-6 h-1.5 bg-purple-500 rounded-l" />
                <div className="absolute bottom-0 right-0 w-1.5 h-6 bg-purple-500 rounded-t" />
              </div>
            </div>
            
            {!qrOn && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 rounded-lg">
                <div className="text-center">
                  <LoadingSpinner size="lg" color="primary" />
                  <p className="text-xs text-muted-foreground mt-2">Starting camera...</p>
                </div>
              </div>
            )}
          </div>

          {qrOn && (
            <p className="text-xs text-center text-muted-foreground">
              Position the QR code within the frame
            </p>
          )}
          {!qrOn && !error && (
            <p className="text-xs text-center text-muted-foreground">
              Initializing camera...
            </p>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                if (scannerRef.current) {
                  scannerRef.current.stop();
                  scannerRef.current.destroy();
                  scannerRef.current = null;
                }
                setQrOn(false);
                onClose();
              }}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

