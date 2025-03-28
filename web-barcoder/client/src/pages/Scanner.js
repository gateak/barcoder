import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { toast } from 'react-toastify';
import axios from 'axios';

const Scanner = () => {
  const [scanning, setScanning] = useState(false);
  const [currentBarcode, setCurrentBarcode] = useState(null);
  const [encodedBarcode, setEncodedBarcode] = useState(null);
  const scannerRef = useRef(null);
  const videoRef = useRef(null);
  const [status, setStatus] = useState('Waiting for barcode...');

  useEffect(() => {
    // Initialize scanner
    let html5QrcodeScanner = null;

    const startScanner = async () => {
      try {
        html5QrcodeScanner = new Html5Qrcode("reader");
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };

        setScanning(true);
        await html5QrcodeScanner.start(
          { facingMode: "environment" },
          config,
          onScanSuccess,
          onScanFailure
        );

        scannerRef.current = html5QrcodeScanner;
      } catch (err) {
        console.error("Error starting scanner:", err);
        toast.error("Could not start camera. Check permissions and try again.");
        setScanning(false);
      }
    };

    startScanner();

    // Cleanup function
    return () => {
      if (scannerRef.current && scanning) {
        scannerRef.current.stop().catch(err => {
          console.error("Error stopping scanner:", err);
        });
        setScanning(false);
      }
    };
  }, []);

  const onScanSuccess = (decodedText, decodedResult) => {
    // Update state with new barcode
    if (currentBarcode !== decodedText) {
      setCurrentBarcode(decodedText);

      // Base64 encode the barcode data
      const encoded = btoa(decodedText);
      setEncodedBarcode(encoded);

      setStatus('Barcode detected!');

      // Draw rectangle overlay (would need canvas implementation)
      // This is a simplified version compared to the desktop app
    }
  };

  const onScanFailure = (error) => {
    // Just ignore failures in production - they happen frequently when no code is in view
    // console.warn(`Code scan error = ${error}`);
  };

  const captureImage = async () => {
    if (!currentBarcode) {
      toast.warning("No barcode detected yet");
      return;
    }

    try {
      // Take a snapshot from the video stream
      if (scannerRef.current) {
        const frame = await scannerRef.current.getPhoto();

        // Create a safe filename
        const safeFilename = currentBarcode.replace(/[/\\:*?"<>|]/g, '_');

        // Create form data to send to server
        const formData = new FormData();
        formData.append('image', frame);
        formData.append('barcode', currentBarcode);
        formData.append('filename', `${safeFilename}.jpg`);

        setStatus('Capturing image...');

        // Send to server
        const response = await axios.post('/api/capture', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });

        if (response.data.success) {
          toast.success('Image captured successfully!');
          setStatus('Image saved. Waiting for next barcode...');
        } else {
          throw new Error(response.data.message || 'Error capturing image');
        }
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      toast.error(`Error capturing image: ${error.message}`);
      setStatus('Error capturing image. Try again.');
    }
  };

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === ' ' && currentBarcode) {
        captureImage();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentBarcode]);

  const syncToDrive = async () => {
    try {
      setStatus('Syncing to Google Drive...');
      const response = await axios.post('/api/sync');

      if (response.data.success) {
        toast.success('Synced to Google Drive successfully!');
        setStatus('Sync completed. Waiting for barcode...');
      } else {
        throw new Error(response.data.message || 'Error syncing to Google Drive');
      }
    } catch (error) {
      console.error('Error syncing to Google Drive:', error);
      toast.error(`Error syncing: ${error.message}`);
      setStatus('Error syncing to Google Drive. Try again.');
    }
  };

  return (
    <div className="scanner-page">
      <h2>Barcode Scanner</h2>

      <div className="scanner-container">
        <div id="reader" style={{ width: '100%', height: '100%' }}></div>
      </div>

      <div className="status-panel">
        <p className="status">Status: {status}</p>
        <p className="barcode">Barcode: {currentBarcode || 'None'}</p>
        {encodedBarcode && (
          <p className="encoded">Base64: {encodedBarcode}</p>
        )}
      </div>

      <div className="action-buttons">
        <button
          className="btn btn-primary"
          onClick={captureImage}
          disabled={!currentBarcode}
        >
          Capture Image
        </button>
        <button
          className="btn btn-success"
          onClick={syncToDrive}
        >
          Sync to Google Drive
        </button>
      </div>

      <p className="shortcut-info">Press SPACEBAR to capture image when barcode is detected</p>
    </div>
  );
};

export default Scanner;
