import React, { useState, useEffect } from 'react';
import { Search, QrCode, UserPlus, Filter, RefreshCw } from 'lucide-react';
import VisitorTable from '../visitors/VisitorTable';
import QRScanner from '../visitors/QRScanner';
import CheckInModal from '../visitors/CheckInModal';
import CheckOutModal from '../visitors/CheckOutModal';
import VisitorStats from '../visitors/VisitorStats';
import PendingRequestsTable from '../visitors/PendingRequestsTable';
import VisitorDetailsModal from '../visitors/VisitorDetailsModal';
import { useVisitors } from '../../hooks/useVisitors';
import InviteVisitor from './InviteVisitor';

const ReceptionDashboard = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [showCheckOutModal, setShowCheckOutModal] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewingVisitor, setViewingVisitor] = useState(null);

  const {
    visitors,
    todaysVisitors,
    stats,
    loading,
    error,
    fetchTodaysVisitors,
    fetchVisitors,
    fetchStats,
    checkInVisitor,
    checkOutVisitor,
    scanQRCode,
    fetchPendingRequests,
    approveCheckinRequest
  } = useVisitors();

  useEffect(() => {
    if (activeTab === 'today') {
      fetchTodaysVisitors();
    } else if (activeTab === 'pending') {
      loadPendingRequests();
    } else {
      fetchVisitors({ status: statusFilter !== 'all' ? statusFilter : undefined });
    }
    fetchStats();
  }, [activeTab, statusFilter, refreshTrigger]);

  const loadPendingRequests = async () => {
    try {
      const result = await fetchPendingRequests();
      setPendingRequests(result.data || []);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    }
  };

  const handleApproveRequest = async (visitorId) => {
    try {
      await approveCheckinRequest(visitorId);
      // Refresh pending requests after approval
      loadPendingRequests();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  };

  const handleViewDetails = (visitor) => {
    setViewingVisitor(visitor);
    setShowViewModal(true);
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleCheckIn = (visitor) => {
    setSelectedVisitor(visitor);
    setShowCheckInModal(true);
  };

  const handleCheckOut = (visitor) => {
    setSelectedVisitor(visitor);
    setShowCheckOutModal(true);
  };

  const handleQRScan = async (token) => {
    try {
      const result = await scanQRCode(token);
      if (result.success) {
        handleRefresh();
        return { success: true, visitor: result.data };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleCheckInSubmit = async (data) => {
    try {
      const result = await checkInVisitor(selectedVisitor._id, data);
      if (result.success) {
        setShowCheckInModal(false);
        setSelectedVisitor(null);
        handleRefresh();
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handleCheckOutSubmit = async (data) => {
    try {
      const result = await checkOutVisitor(selectedVisitor._id, data);
      if (result.success) {
        setShowCheckOutModal(false);
        setSelectedVisitor(null);
        handleRefresh();
        return { success: true };
      }
      return { success: false, message: result.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const filteredVisitors = (activeTab === 'today' ? todaysVisitors : visitors).filter(visitor => {
    const matchesSearch = !searchTerm || 
      visitor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.phone?.includes(searchTerm) ||
      visitor.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.hostMember?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.hostMember?.lastName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || visitor.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'invited': return 'bg-blue-100 text-blue-800';
      case 'checked_in': return 'bg-green-100 text-green-800';
      case 'checked_out': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no_show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reception Dashboard</h1>
            <p className="text-gray-600 mt-1">Manage visitor check-ins and check-outs</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Invite Visitor
            </button>
            <button
              onClick={() => setShowQRScanner(true)}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <QrCode className="w-5 h-5 mr-2" />
              Scan QR
            </button>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <VisitorStats stats={stats} loading={loading} />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('today')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'today'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Today's Visitors
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'pending'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending Requests
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'all'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All Visitors
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search visitors by name, email, phone, company, or host..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="invited">Invited</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm">
        {activeTab === 'pending' ? (
          <PendingRequestsTable
            requests={pendingRequests}
            loading={loading}
            onApprove={handleApproveRequest}
          />
        ) : (
          <VisitorTable
            visitors={activeTab === 'today' ? todaysVisitors : visitors}
            loading={loading}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onViewDetails={handleViewDetails}
            searchTerm={searchTerm}
            statusFilter={statusFilter}
          />
        )}
      </div>

      {/* Modals */}
      {showQRScanner && (
        <QRScanner
          onClose={() => setShowQRScanner(false)}
          onScan={handleQRScan}
        />
      )}

      {showCheckInModal && selectedVisitor && (
        <CheckInModal
          visitor={selectedVisitor}
          onClose={() => {
            setShowCheckInModal(false);
            setSelectedVisitor(null);
          }}
          onSubmit={handleCheckInSubmit}
        />
      )}

      {showCheckOutModal && selectedVisitor && (
        <CheckOutModal
          visitor={selectedVisitor}
          onClose={() => {
            setShowCheckOutModal(false);
            setSelectedVisitor(null);
          }}
          onSubmit={handleCheckOutSubmit}
        />
      )}

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Invite Visitor</h2>
              <button onClick={() => setShowInviteModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-0">
              <InviteVisitor
                isModal
                onBack={() => {
                  setShowInviteModal(false);
                  handleRefresh();
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Visitor Details Modal */}
      {showViewModal && viewingVisitor && (
        <VisitorDetailsModal
          visitor={viewingVisitor}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false);
            setViewingVisitor(null);
          }}
        />
      )}
    </div>
  );
};

export default ReceptionDashboard;
