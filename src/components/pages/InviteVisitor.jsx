import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { UserPlus, Building, Calendar, Clock, User, Mail, Phone, FileText, ArrowLeft } from 'lucide-react';
import { useVisitors } from '../../hooks/useVisitors';

const InviteVisitor = ({ onBack }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    companyName: '',
    hostMemberId: '',
    purpose: '',
    numberOfGuests: 1,
    expectedVisitDate: new Date().toISOString().split('T')[0], // Today's date
    expectedArrivalTime: '',
    expectedDepartureTime: '',
    building: '',
    notes: ''
  });

  const [members, setMembers] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  const { createVisitor } = useVisitors();

  // Fetch members and buildings on component mount
  useEffect(() => {
    fetchMembers();
    fetchBuildings();
  }, []);

  const fetchMembers = async () => {
    try {
      const token = localStorage.getItem('ofis_admin_token');
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${base}/members?limit=200&status=active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    }
  };

  const fetchBuildings = async () => {
    try {
      const token = localStorage.getItem('ofis_admin_token');
      const base = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';
      const response = await fetch(`${base}/buildings?limit=200`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBuildings(data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch buildings:', err);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) setError(''); // Clear error when user makes changes
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(null);

    try {
      // Validate required fields
      if (!formData.name.trim()) {
        throw new Error('Visitor name is required');
      }
      if (!formData.hostMemberId) {
        throw new Error('Host member is required');
      }
      if (!formData.expectedVisitDate) {
        throw new Error('Expected visit date is required');
      }

      // Prepare data for submission
      const submitData = {
        ...formData,
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        companyName: formData.companyName.trim() || undefined,
        purpose: formData.purpose.trim() || undefined,
        notes: formData.notes.trim() || undefined,
        numberOfGuests: parseInt(formData.numberOfGuests) || 1,
        expectedArrivalTime: formData.expectedArrivalTime ? 
          new Date(`${formData.expectedVisitDate}T${formData.expectedArrivalTime}`).toISOString() : undefined,
        expectedDepartureTime: formData.expectedDepartureTime ? 
          new Date(`${formData.expectedVisitDate}T${formData.expectedDepartureTime}`).toISOString() : undefined,
        building: formData.building || undefined
      };

      const result = await createVisitor(submitData);
      
      if (result.success) {
        setSuccess({
          visitor: result.data.visitor,
          qrToken: result.data.qrToken,
          qrUrl: result.data.qrUrl
        });

        // Generate QR image data URL for display
        try {
          const url = await QRCode.toDataURL(result.data.qrToken, { errorCorrectionLevel: 'M', margin: 2, width: 240 });
          setQrDataUrl(url);
        } catch (qrErr) {
          console.error('QR generation failed:', qrErr);
          setQrDataUrl('');
        }
        
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          companyName: '',
          hostMemberId: '',
          purpose: '',
          numberOfGuests: 1,
          expectedVisitDate: new Date().toISOString().split('T')[0],
          expectedArrivalTime: '',
          expectedDepartureTime: '',
          building: '',
          notes: ''
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create visitor invitation');
    } finally {
      setSubmitting(false);
    }
  };

  // Real QR is generated above upon success using qrcode package

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Visitor Invited Successfully!</h2>
            <p className="text-gray-600 mb-6">
              {success.visitor.name} has been invited for {new Date(success.visitor.expectedVisitDate).toLocaleDateString()}
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="font-medium text-gray-900 mb-4">QR Code for Check-in</h3>
              <div className="flex justify-center mb-4 min-h-56 items-center">
                {qrDataUrl ? (
                  <img 
                    src={qrDataUrl} 
                    alt="QR Code" 
                    className="border border-gray-200 rounded"
                  />
                ) : (
                  <div className="text-sm text-gray-500">Generating QR...</div>
                )}
              </div>
              <p className="text-sm text-gray-600 mb-2">
                Share this QR code with the visitor for quick check-in
              </p>
              <div className="bg-white p-3 rounded border text-xs font-mono break-all">
                {success.qrToken}
              </div>
            </div>

            <div className="flex space-x-3 justify-center">
              <button
                onClick={() => setSuccess(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Invite Another Visitor
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Dashboard
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            {onBack && (
              <button
                onClick={onBack}
                className="mr-4 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invite Visitor</h1>
              <p className="text-gray-600 mt-1">Create a new visitor invitation</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Visitor Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <User className="w-5 h-5 mr-2" />
                Visitor Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="Enter visitor's full name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="visitor@example.com"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="Company name"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Visit Details */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Visit Details
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Host Member *
                  </label>
                  <select
                    value={formData.hostMemberId}
                    onChange={(e) => handleChange('hostMemberId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select host member</option>
                    {members.map(member => (
                      <option key={member._id} value={member._id}>
                        {member.firstName} {member.lastName} {member.email && `(${member.email})`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Purpose
                  </label>
                  <input
                    type="text"
                    value={formData.purpose}
                    onChange={(e) => handleChange('purpose', e.target.value)}
                    placeholder="Meeting, Interview, Delivery..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Visit Date *
                  </label>
                  <input
                    type="date"
                    value={formData.expectedVisitDate}
                    onChange={(e) => handleChange('expectedVisitDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.numberOfGuests}
                    onChange={(e) => handleChange('numberOfGuests', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Arrival Time
                  </label>
                  <input
                    type="time"
                    value={formData.expectedArrivalTime}
                    onChange={(e) => handleChange('expectedArrivalTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Departure Time
                  </label>
                  <input
                    type="time"
                    value={formData.expectedDepartureTime}
                    onChange={(e) => handleChange('expectedDepartureTime', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Building
                  </label>
                  <select
                    value={formData.building}
                    onChange={(e) => handleChange('building', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select building (optional)</option>
                    {buildings.map(building => (
                      <option key={building._id} value={building._id}>
                        {building.name} {building.address && `- ${building.address}`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Additional Information
              </h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  placeholder="Any additional notes or special instructions..."
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-600 mr-2">⚠️</div>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Creating Invitation...' : 'Send Invitation'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteVisitor;
