import React, { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Badge } from '../ui/Badge';
import { QrCode, Camera, CameraOff, CheckCircle, XCircle, User, Building, Clock } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

export function QRScannerPage() {
  const { client } = useApi();
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [passInfo, setPassInfo] = useState(null);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [scanMode, setScanMode] = useState('manual'); // 'manual' or 'camera'
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } // Use back camera if available
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanMode('camera');
    } catch (error) {
      setMessage({ type: "error", text: "Camera access denied or not available" });
      setScanMode('manual');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanMode('manual');
  };

  const scanQRCode = async (code = qrCode) => {
    if (!code.trim()) {
      setMessage({ type: "error", text: "Please enter or scan a QR code" });
      return;
    }

    setLoading(true);
    try {
      const response = await client.post('/api/day-passes/scan', { qrCode: code.trim() });
      setPassInfo(response.data.dayPass);
      setMessage({ type: "success", text: "QR code scanned successfully!" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || 'Failed to scan QR code' });
      setPassInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!passInfo?._id) return;

    setLoading(true);
    try {
      const response = await client.post(`/api/day-passes/${passInfo._id}/checkin`);
      setPassInfo(response.data.dayPass);
      setMessage({ type: "success", text: "Check-in successful!" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || 'Check-in failed' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!passInfo?._id) return;

    setLoading(true);
    try {
      const response = await client.post(`/api/day-passes/${passInfo._id}/checkout`);
      setPassInfo(response.data.dayPass);
      setMessage({ type: "success", text: "Check-out successful!" });
    } catch (error) {
      setMessage({ type: "error", text: error.response?.data?.error || 'Check-out failed' });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending', icon: Clock },
      invited: { color: 'bg-blue-100 text-blue-800', label: 'Invited', icon: User },
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: CheckCircle },
      checked_in: { color: 'bg-purple-100 text-purple-800', label: 'Checked In', icon: CheckCircle },
      checked_out: { color: 'bg-gray-100 text-gray-800', label: 'Checked Out', icon: XCircle },
      expired: { color: 'bg-red-100 text-red-800', label: 'Expired', icon: XCircle },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelled', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not set';
    return new Date(dateTime).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const canCheckIn = passInfo && ['invited', 'active'].includes(passInfo.status);
  const canCheckOut = passInfo && passInfo.status === 'checked_in';

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">QR Scanner</h1>
        <p className="text-gray-600 mt-2">Scan day pass QR codes for check-in/check-out</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code Scanner
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Scan Mode Toggle */}
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                onClick={() => {
                  stopCamera();
                  setScanMode('manual');
                }}
                className="flex-1"
              >
                Manual Entry
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                onClick={scanMode === 'camera' ? stopCamera : startCamera}
                className="flex-1"
              >
                {scanMode === 'camera' ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    Stop Camera
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    Use Camera
                  </>
                )}
              </Button>
            </div>

            {/* Camera View */}
            {scanMode === 'camera' && (
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-64 bg-black rounded-lg object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed w-48 h-48 rounded-lg"></div>
                </div>
                <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Position the QR code within the frame. Manual scanning with camera is not yet implemented - please use manual entry.
                  </p>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {scanMode === 'manual' && (
              <div className="space-y-4">
                <Input
                  label="QR Code"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  placeholder="Enter QR code manually"
                  className="font-mono"
                />
                <Button 
                  onClick={() => scanQRCode()}
                  disabled={loading || !qrCode.trim()}
                  loading={loading}
                  className="w-full"
                >
                  {loading ? 'Scanning...' : 'Scan QR Code'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pass Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Pass Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            {passInfo ? (
              <div className="space-y-4">
                {/* Status */}
                <div className="flex justify-between items-center">
                  <span className="font-medium">Status:</span>
                  {getStatusBadge(passInfo.status)}
                </div>

                {/* Visitor Info */}
                {passInfo.visitorName && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Visitor Details</h3>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {passInfo.visitorName}</div>
                      {passInfo.visitorPhone && (
                        <div><strong>Phone:</strong> {passInfo.visitorPhone}</div>
                      )}
                      {passInfo.visitorEmail && (
                        <div><strong>Email:</strong> {passInfo.visitorEmail}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Building Info */}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{passInfo.building?.name}</span>
                </div>

                {/* Date */}
                <div>
                  <strong>Visit Date:</strong> {formatDateTime(passInfo.date)}
                </div>

                {/* Check-in/out Times */}
                {passInfo.checkInTime && (
                  <div className="text-sm text-green-600">
                    <strong>Checked In:</strong> {formatDateTime(passInfo.checkInTime)}
                  </div>
                )}

                {passInfo.checkOutTime && (
                  <div className="text-sm text-gray-600">
                    <strong>Checked Out:</strong> {formatDateTime(passInfo.checkOutTime)}
                  </div>
                )}

                {/* Duration */}
                {passInfo.checkInTime && passInfo.checkOutTime && (
                  <div className="text-sm text-blue-600">
                    <strong>Duration:</strong> {Math.round((new Date(passInfo.checkOutTime) - new Date(passInfo.checkInTime)) / (1000 * 60))} minutes
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-4">
                  {canCheckIn && (
                    <Button 
                      onClick={handleCheckIn}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Check In
                    </Button>
                  )}
                  
                  {canCheckOut && (
                    <Button 
                      onClick={handleCheckOut}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Check Out
                    </Button>
                  )}
                </div>

                {!canCheckIn && !canCheckOut && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                      {passInfo.status === 'pending' && 'This pass is pending visitor invitation.'}
                      {passInfo.status === 'checked_out' && 'This pass has already been checked out.'}
                      {passInfo.status === 'expired' && 'This pass has expired.'}
                      {passInfo.status === 'cancelled' && 'This pass has been cancelled.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <QrCode className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Scan a QR code to view pass information</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2">For Check-in:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Visitor must have an invited or active day pass</li>
                <li>• Scan the QR code provided to the visitor</li>
                <li>• Click "Check In" to mark arrival</li>
                <li>• Pass status will change to "Checked In"</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">For Check-out:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Visitor must be currently checked in</li>
                <li>• Scan the same QR code used for check-in</li>
                <li>• Click "Check Out" to mark departure</li>
                <li>• Duration will be automatically calculated</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Message Display */}
      {message.text && (
        <div className={`mt-4 p-4 rounded-lg ${
          message.type === 'error' 
            ? 'bg-red-50 border border-red-200 text-red-800' 
            : 'bg-green-50 border border-green-200 text-green-800'
        }`}>
          {message.text}
        </div>
      )}
    </div>
  );
}
