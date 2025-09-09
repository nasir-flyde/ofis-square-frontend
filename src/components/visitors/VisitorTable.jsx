import React from 'react';
import { Clock, User, Building, Phone, Mail, CheckCircle, XCircle, Eye } from 'lucide-react';

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

const VisitorTable = ({ visitors, loading, error, onCheckIn, onCheckOut, onViewDetails }) => {
  if (loading) {
    return (
      <div className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading visitors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <XCircle className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-red-600 font-medium">Error loading visitors</p>
        <p className="text-gray-600 mt-2">{error}</p>
      </div>
    );
  }

  if (!visitors || visitors.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="text-gray-400 mb-4">
          <User className="w-12 h-12 mx-auto" />
        </div>
        <p className="text-gray-600 font-medium">No visitors found</p>
        <p className="text-gray-500 mt-2">No visitors match your current filters</p>
      </div>
    );
  }

  const formatTime = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getVisitDuration = (checkInTime, checkOutTime) => {
    if (!checkInTime) return '-';
    const endTime = checkOutTime ? new Date(checkOutTime) : new Date();
    const startTime = new Date(checkInTime);
    const diffMs = endTime - startTime;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 60) {
      return `${diffMins}m`;
    } else {
      const hours = Math.floor(diffMins / 60);
      const mins = diffMins % 60;
      return `${hours}h ${mins}m`;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visitor Details
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Host & Purpose
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Visit Schedule
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Check-in/out
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {visitors.map((visitor) => (
            <tr key={visitor._id} className="hover:bg-gray-50">
              {/* Visitor Details */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {visitor.name}
                      {visitor.numberOfGuests > 1 && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          +{visitor.numberOfGuests - 1} guest{visitor.numberOfGuests > 2 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 space-y-1">
                      {visitor.email && (
                        <div className="flex items-center">
                          <Mail className="h-3 w-3 mr-1" />
                          {visitor.email}
                        </div>
                      )}
                      {visitor.phone && (
                        <div className="flex items-center">
                          <Phone className="h-3 w-3 mr-1" />
                          {visitor.phone}
                        </div>
                      )}
                      {visitor.companyName && (
                        <div className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          {visitor.companyName}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </td>

              {/* Host & Purpose */}
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  <div className="font-medium">
                    {visitor.hostMember?.firstName} {visitor.hostMember?.lastName}
                  </div>
                  {visitor.hostMember?.email && (
                    <div className="text-gray-500">{visitor.hostMember.email}</div>
                  )}
                  {visitor.purpose && (
                    <div className="text-gray-600 mt-1">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {visitor.purpose}
                      </span>
                    </div>
                  )}
                </div>
              </td>

              {/* Visit Schedule */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatDate(visitor.expectedVisitDate)}
                  </div>
                  {visitor.expectedArrivalTime && (
                    <div className="text-xs">
                      Expected: {formatTime(visitor.expectedArrivalTime)}
                    </div>
                  )}
                  {visitor.building?.name && (
                    <div className="flex items-center text-xs">
                      <Building className="h-3 w-3 mr-1" />
                      {visitor.building.name}
                    </div>
                  )}
                </div>
              </td>

              {/* Check-in/out */}
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <div className="space-y-1">
                  {visitor.checkInTime && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      In: {formatTime(visitor.checkInTime)}
                    </div>
                  )}
                  {visitor.checkOutTime && (
                    <div className="flex items-center text-gray-600">
                      <XCircle className="h-3 w-3 mr-1" />
                      Out: {formatTime(visitor.checkOutTime)}
                    </div>
                  )}
                  {visitor.checkInTime && (
                    <div className="text-xs text-gray-400">
                      Duration: {getVisitDuration(visitor.checkInTime, visitor.checkOutTime)}
                    </div>
                  )}
                  {visitor.badgeId && (
                    <div className="text-xs">
                      Badge: {visitor.badgeId}
                    </div>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(visitor.status)}`}>
                  {visitor.status.replace('_', ' ').toUpperCase()}
                </span>
                {visitor.checkInMethod === 'qr' && (
                  <div className="mt-1">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                      QR Scan
                    </span>
                  </div>
                )}
              </td>

              {/* Actions */}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                {visitor.status === 'invited' && (
                  <button
                    onClick={() => onCheckIn(visitor)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Check In
                  </button>
                )}
                
                {visitor.status === 'checked_in' && (
                  <button
                    onClick={() => onCheckOut(visitor)}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Check Out
                  </button>
                )}

                <button
                  onClick={() => onViewDetails && onViewDetails(visitor)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VisitorTable;
