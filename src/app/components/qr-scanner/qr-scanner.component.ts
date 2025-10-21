import { Component, EventEmitter, Output, OnDestroy, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-scanner.component.html',
  styleUrls: ['./qr-scanner.component.css']
})
export class QrScannerComponent implements OnInit, OnDestroy {
  @Output() onScan = new EventEmitter<string>();
  @Output() onClose = new EventEmitter<void>();
  @ViewChild('video', { static: false }) videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvas', { static: false }) canvasElement!: ElementRef<HTMLCanvasElement>;
  
  isScanning: boolean = false;
  cameraActive: boolean = false;
  errorMessage: string = '';
  scanInstruction: string = 'Position QR code within the frame';
  stream: MediaStream | null = null;
  scanningInterval: any = null;

  ngOnInit(): void {
    // Auto-start camera when component loads
    setTimeout(() => {
      this.startCamera();
    }, 500);
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  async startCamera(): Promise<void> {
    try {
      this.errorMessage = '';
      this.scanInstruction = 'Requesting camera access...';

      // Request camera access
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      // Set video source
      if (this.videoElement) {
        this.videoElement.nativeElement.srcObject = this.stream;
        this.videoElement.nativeElement.play();
        this.cameraActive = true;
        this.scanInstruction = 'Position QR code within the frame';
        
        // Start scanning after video is ready
        this.videoElement.nativeElement.onloadedmetadata = () => {
          this.startScanning();
        };
      }
    } catch (error: any) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        this.errorMessage = 'Camera access denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        this.errorMessage = 'No camera found on this device.';
      } else {
        this.errorMessage = 'Error accessing camera: ' + error.message;
      }
      this.scanInstruction = 'Camera not available';
    }
  }

  stopCamera(): void {
    // Stop scanning interval
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
      this.scanningInterval = null;
    }

    // Stop video stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }

    this.cameraActive = false;
  }

  startScanning(): void {
    if (this.scanningInterval) {
      clearInterval(this.scanningInterval);
    }

    // Scan every 300ms
    this.scanningInterval = setInterval(() => {
      this.scanFrame();
    }, 300);
  }

  private scanFrame(): void {
    if (!this.videoElement || !this.canvasElement || !this.cameraActive) {
      return;
    }

    const video = this.videoElement.nativeElement;
    const canvas = this.canvasElement.nativeElement;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      return;
    }

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);

    // Scan for QR code using jsQR
    try {
      // @ts-ignore
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code) {
        // QR code found!
        this.scanInstruction = '✓ QR Code detected!';
        this.stopCamera();
        this.onScan.emit(code.data);
      }
    } catch (error) {
      console.error('QR decode error:', error);
    }
  }

  retryCamera(): void {
    this.stopCamera();
    this.errorMessage = '';
    this.startCamera();
  }

  closeScanner(): void {
    this.stopCamera();
    this.onClose.emit();
  }
}

