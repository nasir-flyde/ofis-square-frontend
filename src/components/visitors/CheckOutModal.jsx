import React, { useState } from 'react';
import { X, XCircle, AlertCircle } from 'lucide-react';

const CheckOutModal = ({ visitor, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    checkOutTime: new Date().toISOString().slice(0, 16), // YYYY-MM-DDTHH:mm format
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
        setError(result.message || 'Failed to check out visitor');
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

  const getVisitDuration = () => {
    if (!visitor.checkInTime) return 'N/A';
    const checkInTime = new Date(visitor.checkInTime);
    const checkOutTime = new Date(formData.checkOutTime);
    const diffMs = checkOutTime - checkInTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins} minutes`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours} hour${hours > 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <XCircle className="h-6 w-6 text-red-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Check Out Visitor</h2>
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
            <div className="text-sm text-gray-600 space-y-1">
              <p>Host: {visitor.hostMember?.firstName} {visitor.hostMember?.lastName}</p>
              {visitor.purpose && <p>Purpose: {visitor.purpose}</p>}
              {visitor.checkInTime && (
                <p>Checked in: {new Date(visitor.checkInTime).toLocaleTimeString()}</p>
              )}
              {visitor.badgeId && (
                <p>Badge: {visitor.badgeId}</p>
              )}
              <div className="pt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Visit Duration: {getVisitDuration()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Check-out Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Check-out Time
            </label>
            <input
              type="datetime-local"
              value={formData.checkOutTime}
              onChange={(e) => handleChange('checkOutTime', e.target.value)}
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
              placeholder="Any additional notes about the check-out..."
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Note any issues, feedback, or observations during the visit
            </p>
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Checking Out...' : 'Check Out'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckOutModal;
