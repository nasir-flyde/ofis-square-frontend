import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { 
  Activity, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  FileText,
  CreditCard,
  Building,
  Users,
  Trash2,
  Edit,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";

export function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filters, setFilters] = useState({
    action: "",
    entity: "",
    status: "",
    userId: "",
    dateFrom: "",
    dateTo: ""
  });

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  const { request } = useApi();

  useEffect(() => {
    fetchLogs();
  }, [currentPage, filters]);

  useEffect(() => {
    filterLogs();
  }, [logs, searchTerm]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: currentPage,
        limit: itemsPerPage,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      console.log('Fetching logs with params:', params.toString());
      const response = await request(`/api/activity-logs?${params}`);
      console.log('API Response:', response);
      
      if (response.success) {
        setLogs(response.data || []);
        setTotalPages(response.pagination?.totalPages || 1);
      } else {
        setError(response.message || 'Failed to fetch logs');
      }
    } catch (err) {
      console.error('Error fetching logs:', err);
      setError(err.message || 'Network error occurred');
    } finally {
      setLoading(false);
    }
  };


  const filterLogs = () => {
    if (!searchTerm) {
      setFilteredLogs(logs);
      return;
    }

    const filtered = logs.filter(log =>
      log.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entity?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLogs(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: "",
      entity: "",
      status: "",
      userId: "",
      dateFrom: "",
      dateTo: ""
    });
    setSearchTerm("");
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });

      const response = await fetch(`/api/activity-logs/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const getActionIcon = (action) => {
    const iconMap = {
      CREATE: <Plus className="w-4 h-4" />,
      UPDATE: <Edit className="w-4 h-4" />,
      DELETE: <Trash2 className="w-4 h-4" />,
      LOGIN: <User className="w-4 h-4" />,
      LOGOUT: <User className="w-4 h-4" />,
      PAYMENT_PROCESSED: <CreditCard className="w-4 h-4" />,
      PAYMENT_MADE: <CreditCard className="w-4 h-4" />,
      CONTRACT_SIGNED: <FileText className="w-4 h-4" />,
      INVOICE_SENT: <FileText className="w-4 h-4" />,
      ERROR: <AlertCircle className="w-4 h-4" />
    };
    return iconMap[action] || <Activity className="w-4 h-4" />;
  };

  const getStatusBadge = (status) => {
    const variants = {
      SUCCESS: "success",
      FAILED: "error",
      PARTIAL: "warning"
    };
    return <Badge variant={variants[status] || "gray"}>{status}</Badge>;
  };

  const getEntityIcon = (entity) => {
    const iconMap = {
      User: <User className="w-4 h-4" />,
      Client: <Users className="w-4 h-4" />,
      Building: <Building className="w-4 h-4" />,
      Payment: <CreditCard className="w-4 h-4" />,
      Invoice: <FileText className="w-4 h-4" />,
      Contract: <FileText className="w-4 h-4" />
    };
    return iconMap[entity] || <Database className="w-4 h-4" />;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
          <p className="text-gray-600">Monitor all system activities and user actions</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            icon={<Download className="w-4 h-4" />}
            onClick={exportLogs}
          >
            Export CSV
          </Button>
          <Button
            variant="outline"
            icon={<RefreshCw className="w-4 h-4" />}
            onClick={fetchLogs}
          >
            Refresh
          </Button>
        </div>
      </div>


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="md:col-span-2">
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
            
            <Select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="PAYMENT_PROCESSED">Payment</option>
              <option value="CONTRACT_SIGNED">Contract</option>
            </Select>

            <Select
              value={filters.entity}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
            >
              <option value="">All Entities</option>
              <option value="User">Users</option>
              <option value="Client">Clients</option>
              <option value="Payment">Payments</option>
              <option value="Invoice">Invoices</option>
              <option value="Contract">Contracts</option>
            </Select>

            <Select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILED">Failed</option>
              <option value="PARTIAL">Partial</option>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              icon={<XCircle className="w-4 h-4" />}
            >
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <Input
              type="date"
              label="From Date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            />
            <Input
              type="date"
              label="To Date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Logs</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800">{error}</span>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Entity</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Description</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getActionIcon(log.action)}
                        <span className="font-medium text-gray-900">{log.action}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-gray-900">{log.userName}</p>
                        <p className="text-sm text-gray-600">{log.userRole}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {getEntityIcon(log.entity)}
                        <span className="text-gray-900">{log.entity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-gray-900 max-w-xs truncate" title={log.description}>
                        {log.description}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(log.status)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">{formatDate(log.createdAt)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-4 h-4" />}
                        onClick={() => viewLogDetails(log)}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredLogs.length === 0 && !loading && (
              <div className="text-center py-12">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No activity logs found</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <p className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                  icon={<ChevronLeft className="w-4 h-4" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  icon={<ChevronRight className="w-4 h-4" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Log Details Modal */}
      {showModal && selectedLog && (
        <LogDetailsModal
          log={selectedLog}
          onClose={() => {
            setShowModal(false);
            setSelectedLog(null);
          }}
        />
      )}
    </div>
  );
}

function LogDetailsModal({ log, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Activity Log Details</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">Action</label>
                  <p className="text-gray-900">{log.action}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Entity</label>
                  <p className="text-gray-900">{log.entity}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <div className="mt-1">
                    <Badge variant={log.status === 'SUCCESS' ? 'success' : log.status === 'FAILED' ? 'error' : 'warning'}>
                      {log.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Timestamp</label>
                  <p className="text-gray-900">{new Date(log.createdAt).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600">User Name</label>
                  <p className="text-gray-900">{log.userName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User Role</label>
                  <p className="text-gray-900">{log.userRole}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">IP Address</label>
                  <p className="text-gray-900">{log.ipAddress || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">User Agent</label>
                  <p className="text-gray-900 text-sm truncate" title={log.userAgent}>
                    {log.userAgent || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Description</h3>
            <p className="text-gray-900 bg-gray-50 p-4 rounded-lg">{log.description}</p>
          </div>

          {/* Changes */}
          {log.changes && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Changes</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(log.changes, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Metadata */}
          {log.metadata && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Metadata</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <pre className="text-sm text-gray-900 whitespace-pre-wrap">
                  {JSON.stringify(log.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {/* Error Message */}
          {log.errorMessage && (
            <div>
              <h3 className="text-lg font-medium text-red-900 mb-4">Error Message</h3>
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="text-red-900">{log.errorMessage}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
