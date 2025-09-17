import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { FileText, Download, Eye, Edit, Trash2, Building, User, Calendar, IndianRupee, Plus } from "lucide-react";

export function InvoicesPage() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState([]);
  const [filteredInvoices, setFilteredInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const { client: api } = useApi();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/invoices");
      
      if (response.data.success) {
        setInvoices(response.data.data);
        setFilteredInvoices(response.data.data);
      } else {
        setError("Failed to fetch invoices");
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setError(err.response?.data?.message || "Failed to fetch invoices");
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get("/api/clients");
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  };

  useEffect(() => {
    fetchInvoices();
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = invoices.filter(invoice =>
      (invoice.client?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.invoice_number || invoice.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.status || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredInvoices(filtered);
  }, [searchTerm, invoices]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: "secondary", label: "Draft" },
      issued: { variant: "warning", label: "Issued" },
      paid: { variant: "success", label: "Paid" },
      overdue: { variant: "destructive", label: "Overdue" },
      void: { variant: "secondary", label: "Void" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleCreateNew = () => {
    navigate("/create-invoice");
  };

  const handleView = (invoice) => {
    setSelectedInvoice(invoice);
    setModalMode("view");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedInvoice(null);
  };

  const handleDownload = async (invoice) => {
    try {
      setError(null);
      const response = await api.get(`/api/invoices/${invoice._id}/download-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice_${(invoice.invoice_number || invoice.invoiceNumber)?.replace(/[^a-zA-Z0-9]/g, '_') || 'invoice'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading invoice:", err);
      setError(err.response?.data?.message || "Failed to download invoice");
    }
  };

  const handleDelete = async (invoice) => {
    if (!window.confirm(`Are you sure you want to delete invoice "${invoice.invoice_number || invoice.invoiceNumber}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/invoices/${invoice._id}`);
      
      if (response.data.success) {
        await fetchInvoices();
      } else {
        setError(response.data.message || "Failed to delete invoice");
      }
    } catch (err) {
      console.error("Error deleting invoice:", err);
      setError(err.response?.data?.message || "Failed to delete invoice");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <p className="text-gray-600 mt-1">Manage client invoices and billing</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {invoices.filter(i => i.status === 'draft').length}
              </div>
              <div className="text-gray-600">Draft</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {invoices.filter(i => i.status === 'issued').length}
              </div>
              <div className="text-gray-600">Issued</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {invoices.filter(i => i.status === 'paid').length}
              </div>
              <div className="text-gray-600">Paid</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {invoices.filter(i => i.status === 'overdue').length}
              </div>
              <div className="text-gray-600">Overdue</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2 break-words">
                ₹{invoices.reduce((sum, i) => sum + (i.total || 0), 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Amount</div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search invoices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreateNew}>
            <Plus size={16} className="mr-2" />
            Create New Invoice
          </Button>
        </div>

        {/* Invoices Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInvoices.map((invoice) => (
                  <tr key={invoice._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center">
                        <FileText size={14} className="mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {invoice.invoice_number || invoice.invoiceNumber || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center justify-center">
                          <User size={14} className="mr-2 text-gray-400" />
                          {invoice.client?.companyName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">{invoice.client?.contactPerson}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center justify-center">
                          <IndianRupee size={14} className="mr-1 text-gray-400" />
                          {invoice.total?.toLocaleString() || "0"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Paid: ₹{(invoice.amount_paid || invoice.amountPaid || 0).toLocaleString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center text-sm text-gray-900 justify-center">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        <div>
                          <div>Issued: {new Date(invoice.date || invoice.issueDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            Due: {new Date(invoice.due_date || invoice.dueDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-center space-x-2">
                        <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(invoice)}
                        className="mr-2"
                        title="Download Invoice"
                      >
                        <Download size={14} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(invoice)}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(invoice)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Invoice Details Modal */}
        {showModal && selectedInvoice && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Invoice Details - {selectedInvoice.invoice_number || selectedInvoice.invoiceNumber}
                  </h2>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Company Name</label>
                          <p className="text-gray-900">{selectedInvoice.client?.companyName || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Person</label>
                          <p className="text-gray-900">{selectedInvoice.client?.contactPerson || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{selectedInvoice.client?.email || "N/A"}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Invoice Number</label>
                          <p className="text-gray-900">{selectedInvoice.invoice_number || selectedInvoice.invoiceNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Status</label>
                          <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Total Amount</label>
                          <p className="text-gray-900">₹{selectedInvoice.total?.toLocaleString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Amount Paid</label>
                          <p className="text-gray-900">₹{(selectedInvoice.amount_paid || selectedInvoice.amountPaid || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Issue Date</label>
                      <p className="text-gray-900">{new Date(selectedInvoice.date || selectedInvoice.issueDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Due Date</label>
                      <p className="text-gray-900">{new Date(selectedInvoice.due_date || selectedInvoice.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Billing Period Start</label>
                      <p className="text-gray-900">{new Date((selectedInvoice.billing_period || selectedInvoice.billingPeriod)?.start).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Billing Period End</label>
                      <p className="text-gray-900">{new Date((selectedInvoice.billing_period || selectedInvoice.billingPeriod)?.end).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {((selectedInvoice.line_items && selectedInvoice.line_items.length > 0) || (selectedInvoice.items && selectedInvoice.items.length > 0)) && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 mb-3 block">Invoice Items</label>
                      <div className="border rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Description</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Qty</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unit Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Amount</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {(selectedInvoice.line_items || selectedInvoice.items || []).map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.description || item.name}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{item.quantity}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{(item.rate || item.unitPrice || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{(item.item_total || item.amount || 0).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {selectedInvoice.notes && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Notes</label>
                      <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedInvoice.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
