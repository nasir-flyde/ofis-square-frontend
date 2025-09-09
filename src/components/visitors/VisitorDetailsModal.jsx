import React from 'react';
import { X, User, Building, Calendar, Clock, Phone, Mail, FileText, CheckCircle, XCircle } from 'lucide-react';

const VisitorDetailsModal = ({ visitor, isOpen, onClose }) => {
  if (!isOpen || !visitor) return null;

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'invited':
        return 'bg-blue-100 text-blue-800';
      case 'pending_checkin':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'checked_in':
        return 'bg-green-100 text-green-800';
      case 'checked_out':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'no_show':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">Visitor Details</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Visitor Info */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">{visitor.name}</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                {visitor.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-500">Email:</label>
                <p className="text-gray-900">{visitor.email || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Phone:</label>
                <p className="text-gray-900">{visitor.phone || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Company:</label>
                <p className="text-gray-900">{visitor.companyName || 'N/A'}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Number of Guests:</label>
                <p className="text-gray-900">{visitor.numberOfGuests || 1}</p>
              </div>
            </div>
          </div>

          {/* Visit Details */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Visit Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-500">Host:</label>
                <p className="text-gray-900">
                  {visitor.hostMember ? 
                    `${visitor.hostMember.firstName || ''} ${visitor.hostMember.lastName || ''}`.trim() : 
                    'N/A'
                  }
                </p>
                {visitor.hostMember?.email && (
                  <p className="text-xs text-gray-500">{visitor.hostMember.email}</p>
                )}
              </div>
              <div>
                <label className="font-medium text-gray-500">Building:</label>
                <p className="text-gray-900">{visitor.building?.name || 'N/A'}</p>
              </div>
              <div className="md:col-span-2">
                <label className="font-medium text-gray-500">Purpose:</label>
                <p className="text-gray-900">{visitor.purpose || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Schedule */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <label className="font-medium text-gray-500">Visit Date:</label>
                <p className="text-gray-900">{formatDate(visitor.expectedVisitDate)}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Expected Arrival:</label>
                <p className="text-gray-900">{formatDateTime(visitor.expectedArrivalTime)}</p>
              </div>
              <div>
                <label className="font-medium text-gray-500">Expected Departure:</label>
                <p className="text-gray-900">{formatDateTime(visitor.expectedDepartureTime)}</p>
              </div>
            </div>
          </div>

          {/* Check-in/out Info */}
          {(visitor.checkInTime || visitor.checkOutTime || visitor.badgeId) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Check-in/out Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {visitor.checkInTime && (
                  <div>
                    <label className="font-medium text-gray-500">Check-in Time:</label>
                    <p className="text-gray-900 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                      {formatDateTime(visitor.checkInTime)}
                    </p>
                    {visitor.checkInMethod && (
                      <p className="text-xs text-gray-500">Method: {visitor.checkInMethod.toUpperCase()}</p>
                    )}
                  </div>
                )}
                {visitor.checkOutTime && (
                  <div>
                    <label className="font-medium text-gray-500">Check-out Time:</label>
                    <p className="text-gray-900 flex items-center">
                      <XCircle className="w-4 h-4 mr-2 text-red-500" />
                      {formatDateTime(visitor.checkOutTime)}
                    </p>
                  </div>
                )}
                {visitor.badgeId && (
                  <div>
                    <label className="font-medium text-gray-500">Badge ID:</label>
                    <p className="text-gray-900">{visitor.badgeId}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Request Info */}
          {(visitor.checkinRequestedAt || visitor.approvedAt) && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {visitor.checkinRequestedAt && (
                  <div>
                    <label className="font-medium text-gray-500">Check-in Requested:</label>
                    <p className="text-gray-900">{formatDateTime(visitor.checkinRequestedAt)}</p>
                  </div>
                )}
                {visitor.approvedAt && (
                  <div>
                    <label className="font-medium text-gray-500">Approved At:</label>
                    <p className="text-gray-900">{formatDateTime(visitor.approvedAt)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {visitor.notes && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Notes</h3>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{visitor.notes}</p>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">System Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-500">
              <div>
                <span className="font-medium">Created:</span> {formatDateTime(visitor.createdAt)}
              </div>
              <div>
                <span className="font-medium">Updated:</span> {formatDateTime(visitor.updatedAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitorDetailsModal;
