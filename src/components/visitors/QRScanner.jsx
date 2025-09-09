import React, { useState, useRef } from 'react';
import { X, QrCode, Camera, AlertCircle, CheckCircle } from 'lucide-react';

const QRScanner = ({ onClose, onScan }) => {
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleManualScan = async () => {
    if (!manualToken.trim()) {
      setError('Please enter a QR token');
      return;
    }

    setScanning(true);
    setError('');
    setResult(null);

    try {
      const scanResult = await onScan(manualToken.trim());
      if (scanResult.success) {
        setResult({
          success: true,
          visitor: scanResult.visitor,
          message: 'Visitor checked in successfully!'
        });
        setManualToken('');
      } else {
        setError(scanResult.message || 'Failed to scan QR code');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while scanning');
    } finally {
      setScanning(false);
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // In a real implementation, you would use a QR code reader library
      // like jsQR or qr-scanner to decode the QR code from the image
      setError('QR code image scanning is not implemented yet. Please enter the token manually.');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleManualScan();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <QrCode className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">QR Code Scanner</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Manual Token Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter QR Token Manually
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Paste QR token here..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={scanning}
              />
              <button
                onClick={handleManualScan}
                disabled={scanning || !manualToken.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {scanning ? 'Scanning...' : 'Scan'}
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">or</span>
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload QR Code Image
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-2">
                Upload a QR code image to scan
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                Choose File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {result && result.success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <p className="text-sm font-medium text-green-800">{result.message}</p>
              </div>
              {result.visitor && (
                <div className="text-sm text-green-700">
                  <p><strong>Visitor:</strong> {result.visitor.name}</p>
                  <p><strong>Host:</strong> {result.visitor.hostMember?.firstName} {result.visitor.hostMember?.lastName}</p>
                  <p><strong>Check-in Time:</strong> {new Date(result.visitor.checkInTime).toLocaleTimeString()}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
