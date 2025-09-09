import React, { useState } from 'react';
import { X, CheckCircle, AlertCircle } from 'lucide-react';

const CheckInModal = ({ visitor, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    badgeId: '',
    checkInTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onClose();
      } else {
        setError(result.message || 'Failed to check in visitor');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Check In Visitor</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Visitor Info */}
        <div className="p-6 bg-gray-50 border-b">
          <div className="space-y-2">
            <div>
              <span className="font-medium text-gray-900">{visitor.name}</span>
              {visitor.companyName && (
                <span className="text-gray-600 ml-2">({visitor.companyName})</span>
              )}
            </div>
            <div className="text-sm text-gray-600">
              <p>Host: {visitor.hostMember?.firstName} {visitor.hostMember?.lastName}</p>
              {visitor.purpose && <p>Purpose: {visitor.purpose}</p>}
              {visitor.expectedArrivalTime && (
                <p>Expected: {new Date(visitor.expectedArrivalTime).toLocaleTimeString()}</p>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Badge ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Badge ID (Optional)
            </label>
            <input
              type="text"
              value={formData.badgeId}
              onChange={(e) => handleChange('badgeId', e.target.value)}
              placeholder="Enter badge number..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Assign a physical badge number to the visitor
            </p>
          </div>

          {/* Check-in Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-in Time
            </label>
            <input
              type="datetime-local"
              value={formData.checkInTime}
              onChange={(e) => handleChange('checkInTime', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Any additional notes about the check-in..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Checking In...' : 'Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckInModal;
