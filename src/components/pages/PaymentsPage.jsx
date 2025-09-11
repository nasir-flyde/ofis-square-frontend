import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { 
  CreditCard, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  FileText, 
  User, 
  Calendar,
  DollarSign,
  Building,
  X,
  Check,
  XCircle,
  Clock,
  MessageSquare,
  Upload,
  Image
} from "lucide-react";

export function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [draftPayments, setDraftPayments] = useState([]);
  const [filteredDrafts, setFilteredDrafts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, create, edit, draft, approve, reject
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ totalAmount: 0, totalPayments: 0, thisMonth: 0 });
  const [activeTab, setActiveTab] = useState("payments"); // payments, drafts
  const [reviewNote, setReviewNote] = useState("");
  
  const [paymentData, setPaymentData] = useState({
    invoice: "",
    client: "",
    amount: "",
    paymentDate: "",
    type: "Bank Transfer",
    referenceNumber: "",
    paymentGatewayRef: "",
    currency: "INR",
    notes: "",
    bankName: "",
    accountNumber: "",
    screenshots: []
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const { client: api } = useApi();

  const paymentTypes = [
    "Bank Transfer",
    "Cash", 
    "UPI",
    "Card",
    "Cheque",
    "Online Gateway"
  ];

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/payments");
      
      if (response.data.success) {
        setPayments(response.data.data);
        setFilteredPayments(response.data.data);
        calculateStats(response.data.data);
      } else {
        setError("Failed to fetch payments");
      }
    } catch (err) {
      console.error("Error fetching payments:", err);
      setError(err.response?.data?.message || "Failed to fetch payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDraftPayments = async () => {
    try {
      const response = await api.get("/api/draft-payments");
      if (response.data.success) {
        setDraftPayments(response.data.data);
        setFilteredDrafts(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching draft payments:", err);
    }
  };

  const fetchInvoices = async () => {
    try {
      const response = await api.get("/api/invoices");
      if (response.data.success) {
        setInvoices(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching invoices:", err);
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

  const calculateStats = (paymentsData) => {
    const totalAmount = paymentsData.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    const totalPayments = paymentsData.length;
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const thisMonth = paymentsData
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
      })
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);

    setStats({ totalAmount, totalPayments, thisMonth });
  };

  useEffect(() => {
    fetchPayments();
    fetchDraftPayments();
    fetchInvoices();
    fetchClients();
  }, []);

  useEffect(() => {
    if (activeTab === "payments") {
      const filtered = payments.filter(payment =>
        payment.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.type?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPayments(filtered);
    } else {
      const filtered = draftPayments.filter(draft =>
        draft.invoice?.invoiceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.client?.companyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        draft.status?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredDrafts(filtered);
    }
  }, [searchTerm, payments, draftPayments, activeTab]);

  const resetForm = () => {
    setPaymentData({
      invoice: "",
      client: "",
      amount: "",
      paymentDate: "",
      type: "Bank Transfer",
      referenceNumber: "",
      paymentGatewayRef: "",
      currency: "INR",
      notes: "",
      bankName: "",
      accountNumber: ""
    });
    setFormErrors({});
    setSelectedPayment(null);
  };

  const handleCreate = () => {
    resetForm();
    setModalMode("create");
    setShowModal(true);
  };

  const handleCreateDraft = () => {
    resetForm();
    setModalMode("draft");
    setShowModal(true);
  };

  const handleApproveDraft = (draft) => {
    setSelectedDraft(draft);
    setModalMode("approve");
    setReviewNote("");
    setShowModal(true);
  };

  const handleRejectDraft = (draft) => {
    setSelectedDraft(draft);
    setModalMode("reject");
    setReviewNote("");
    setShowModal(true);
  };

  const handleViewDraft = (draft) => {
    setSelectedDraft(draft);
    setModalMode("viewDraft");
    setShowModal(true);
  };

  const submitApproval = async () => {
    try {
      setSubmitting(true);
      await api.post(`/api/draft-payments/${selectedDraft._id}/approve`, {
        reviewNote: reviewNote || undefined
      });
      await fetchDraftPayments();
      await fetchPayments();
      setShowModal(false);
      setSelectedDraft(null);
      setReviewNote("");
    } catch (err) {
      console.error("Error approving draft:", err);
      setError(err.response?.data?.message || "Failed to approve draft");
    } finally {
      setSubmitting(false);
    }
  };

  const submitRejection = async () => {
    if (!reviewNote.trim()) {
      setError("Review note is required for rejection");
      return;
    }
    
    try {
      setSubmitting(true);
      await api.post(`/api/draft-payments/${selectedDraft._id}/reject`, {
        reviewNote: reviewNote
      });
      await fetchDraftPayments();
      setShowModal(false);
      setSelectedDraft(null);
      setReviewNote("");
    } catch (err) {
      console.error("Error rejecting draft:", err);
      setError(err.response?.data?.message || "Failed to reject draft");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (payment) => {
    setSelectedPayment(payment);
    setPaymentData({
      invoice: payment.invoice?._id || "",
      client: payment.client?._id || "",
      amount: payment.amount || "",
      paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : "",
      type: payment.type || "Bank Transfer",
      referenceNumber: payment.referenceNumber || "",
      paymentGatewayRef: payment.paymentGatewayRef || "",
      currency: payment.currency || "INR",
      notes: payment.notes || "",
      bankName: payment.bankName || "",
      accountNumber: payment.accountNumber || ""
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (payment) => {
    setSelectedPayment(payment);
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = async (payment) => {
    if (!window.confirm(`Are you sure you want to delete this payment?`)) {
      return;
    }

    try {
      await api.delete(`/api/payments/${payment._id}`);
      // Reload from server to refresh list and stats accurately
      await fetchPayments();
      setShowModal(false);
      setSelectedPayment(null);
    } catch (err) {
      console.error("Error deleting payment:", err);
      setError(err.response?.data?.message || "Failed to delete payment");
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!paymentData.invoice) errors.invoice = "Invoice is required";
    if (!paymentData.amount || Number(paymentData.amount) <= 0) errors.amount = "Amount must be greater than 0";
    if (!paymentData.paymentDate) errors.paymentDate = "Payment date is required";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 5;
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (uploadedFiles.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image`);
        return false;
      }
      return true;
    });
    
    // Convert files to base64 for preview and storage
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          name: file.name,
          size: file.size,
          type: file.type,
          data: e.target.result // base64 data
        };
        setUploadedFiles(prev => [...prev, fileData]);
        setPaymentData(prev => ({
          ...prev,
          screenshots: [...prev.screenshots, e.target.result]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    setPaymentData(prev => ({
      ...prev,
      screenshots: prev.screenshots.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      const payload = {
        ...paymentData,
        amount: Number(paymentData.amount)
      };

      if (modalMode === "create") {
        const response = await api.post("/api/payments", payload);
        if (response.data.success) {
          setPayments(prev => [response.data.data.payment, ...prev]);
        }
      } else if (modalMode === "edit") {
        const response = await api.put(`/api/payments/${selectedPayment._id}`, payload);
        if (response.data.success) {
          setPayments(prev => prev.map(p => p._id === selectedPayment._id ? response.data.data : p));
        }
      } else if (modalMode === "draft") {
        const selectedInvoice = invoices.find(inv => inv._id === paymentData.invoice);
        const draftPayload = {
          ...payload,
          client: selectedInvoice?.client || payload.client
        };
        const response = await api.post("/api/draft-payments", draftPayload);
        if (response.data.success) {
          await fetchDraftPayments();
        }
      }

      setShowModal(false);
      resetForm();
      fetchPayments(); // Refresh to get updated stats
    } catch (err) {
      console.error("Error saving payment:", err);
      setError(err.response?.data?.message || "Failed to save payment");
    } finally {
      setSubmitting(false);
    }
  };

  const getPaymentTypeBadge = (type) => {
    const variants = {
      "Bank Transfer": "primary",
      "Cash": "success", 
      "UPI": "warning",
      "Card": "secondary",
      "Cheque": "secondary",
      "Online Gateway": "primary"
    };
    
    return (
      <Badge variant={variants[type] || "secondary"}>
        {type}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading payments...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600 mt-1">Manage payments against invoices</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalAmount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Payments</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.thisMonth.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab("payments")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "payments"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <CreditCard size={16} className="mr-2 inline" />
            Payments
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "drafts"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            <Clock size={16} className="mr-2 inline" />
            Draft Transactions ({draftPayments.filter(d => d.status === "pending").length})
          </button>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder={`Search ${activeTab === "payments" ? "payments" : "draft transactions"}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            {activeTab === "drafts" && (
              <Button variant="outline" onClick={handleCreateDraft}>
                <Plus size={16} className="mr-2" />
                Add Draft Transaction
              </Button>
            )}
            <Button variant="primary" onClick={handleCreate}>
              <Plus size={16} className="mr-2" />
              Create Payment
            </Button>
          </div>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  {activeTab === "drafts" && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activeTab === "payments" ? (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={14} className="mr-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {payment.invoice?.invoiceNumber || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building size={14} className="mr-2 text-gray-400" />
                          <span>{payment.client?.companyName || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{payment.amount?.toLocaleString() || "0"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {payment.currency || "INR"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentTypeBadge(payment.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {payment.referenceNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          <span>{new Date(payment.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleView(payment)}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(payment)}
                        >
                          <Edit size={14} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(payment)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 size={14} className="mr-1" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  filteredDrafts.map((draft) => (
                    <tr key={draft._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <FileText size={14} className="mr-2 text-gray-400" />
                          <span className="text-sm font-medium text-gray-900">
                            {draft.invoice?.invoiceNumber || "N/A"}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building size={14} className="mr-2 text-gray-400" />
                          <span>{draft.client?.companyName || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          ₹{draft.amount?.toLocaleString() || "0"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {draft.currency || "INR"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getPaymentTypeBadge(draft.type)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          draft.status === "pending" ? "warning" :
                          draft.status === "approved" ? "success" : "destructive"
                        }>
                          {draft.status === "pending" && <Clock size={12} className="mr-1" />}
                          {draft.status === "approved" && <Check size={12} className="mr-1" />}
                          {draft.status === "rejected" && <XCircle size={12} className="mr-1" />}
                          {draft.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {draft.referenceNumber || "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Calendar size={14} className="mr-1 text-gray-400" />
                          <span>{new Date(draft.paymentDate).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDraft(draft)}
                        >
                          <Eye size={14} className="mr-1" />
                          View
                        </Button>
                        {draft.status === "pending" && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApproveDraft(draft)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Check size={14} className="mr-1" />
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRejectDraft(draft)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <XCircle size={14} className="mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Payment Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "create" ? "Create New Payment" : 
                   modalMode === "edit" ? "Edit Payment" :
                   modalMode === "draft" ? "Create Draft Transaction" :
                   modalMode === "viewDraft" ? "Draft Transaction Details" :
                   modalMode === "approve" ? "Approve Draft Transaction" :
                   modalMode === "reject" ? "Reject Draft Transaction" :
                   "Payment Details"}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  <X size={16} />
                </Button>
              </div>

              {modalMode === "view" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment?.invoice?.invoiceNumber || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment?.client?.companyName || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedPayment?.amount?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                      <div className="mt-1">{getPaymentTypeBadge(selectedPayment?.type)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedPayment?.referenceNumber || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                    <p className="mt-1 text-sm text-gray-900">{new Date(selectedPayment?.paymentDate).toLocaleDateString()}</p>
                  </div>
                  {selectedPayment?.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedPayment.notes}</p>
                    </div>
                  )}
                  {selectedPayment?.screenshots && selectedPayment.screenshots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Screenshots</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedPayment.screenshots.map((screenshot, index) => (
                          <div key={index} className="relative border rounded-lg p-2">
                            <img
                              src={screenshot}
                              alt={`Payment screenshot ${index + 1}`}
                              className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(screenshot, '_blank')}
                            />
                            <div className="mt-1 text-xs text-gray-600 text-center">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : modalMode === "viewDraft" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDraft?.invoice?.invoiceNumber || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDraft?.client?.companyName || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="mt-1 text-sm text-gray-900">₹{selectedDraft?.amount?.toLocaleString() || "0"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                      <div className="mt-1">{getPaymentTypeBadge(selectedDraft?.type)}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">
                        <Badge variant={
                          selectedDraft?.status === "pending" ? "warning" :
                          selectedDraft?.status === "approved" ? "success" : "destructive"
                        }>
                          {selectedDraft?.status === "pending" && <Clock size={12} className="mr-1" />}
                          {selectedDraft?.status === "approved" && <Check size={12} className="mr-1" />}
                          {selectedDraft?.status === "rejected" && <XCircle size={12} className="mr-1" />}
                          {selectedDraft?.status}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDraft?.referenceNumber || "N/A"}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedDraft?.paymentDate ? new Date(selectedDraft.paymentDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  {selectedDraft?.notes && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Notes</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDraft.notes}</p>
                    </div>
                  )}
                  {selectedDraft?.screenshots && selectedDraft.screenshots.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Payment Screenshots</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedDraft.screenshots.map((screenshot, index) => (
                          <div key={index} className="relative border rounded-lg p-2">
                            <img
                              src={screenshot}
                              alt={`Payment screenshot ${index + 1}`}
                              className="w-full h-20 object-cover rounded cursor-pointer hover:opacity-80"
                              onClick={() => window.open(screenshot, '_blank')}
                            />
                            <div className="mt-1 text-xs text-gray-600 text-center">
                              Screenshot {index + 1}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDraft?.reviewNote && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Review Note</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedDraft.reviewNote}</p>
                    </div>
                  )}
                  {selectedDraft?.reviewedAt && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                      <p className="mt-1 text-sm text-gray-900">{new Date(selectedDraft.reviewedAt).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ) : modalMode === "approve" || modalMode === "reject" ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="font-medium text-gray-900 mb-2">Draft Transaction Details</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Invoice:</span>
                        <span className="ml-2 font-medium">{selectedDraft?.invoice?.invoiceNumber}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Client:</span>
                        <span className="ml-2 font-medium">{selectedDraft?.client?.companyName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount:</span>
                        <span className="ml-2 font-medium">₹{selectedDraft?.amount?.toLocaleString()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-2">{selectedDraft?.type}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Review Note {modalMode === "reject" && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder={modalMode === "approve" ? "Optional note about the approval..." : "Required note explaining the rejection..."}
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={modalMode === "approve" ? submitApproval : submitRejection}
                      disabled={submitting}
                      variant={modalMode === "approve" ? "primary" : "destructive"}
                    >
                      {submitting ? "Processing..." : modalMode === "approve" ? "Approve Transaction" : "Reject Transaction"}
                    </Button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Invoice *</label>
                      <Select
                        name="invoice"
                        value={paymentData.invoice}
                        onChange={handleInputChange}
                        className="mt-1"
                      >
                        <option value="">Select Invoice</option>
                        {invoices.map((invoice) => (
                          <option key={invoice._id} value={invoice._id}>
                            {invoice.invoiceNumber} - ₹{invoice.total}
                          </option>
                        ))}
                      </Select>
                      {formErrors.invoice && <p className="text-red-500 text-xs mt-1">{formErrors.invoice}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount *</label>
                      <Input
                        type="number"
                        name="amount"
                        value={paymentData.amount}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="mt-1"
                      />
                      {formErrors.amount && <p className="text-red-500 text-xs mt-1">{formErrors.amount}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Date *</label>
                      <Input
                        type="date"
                        name="paymentDate"
                        value={paymentData.paymentDate}
                        onChange={handleInputChange}
                        className="mt-1"
                      />
                      {formErrors.paymentDate && <p className="text-red-500 text-xs mt-1">{formErrors.paymentDate}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Type</label>
                      <Select
                        name="type"
                        value={paymentData.type}
                        onChange={handleInputChange}
                        className="mt-1"
                      >
                        {paymentTypes.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                    <Input
                      type="text"
                      name="referenceNumber"
                      value={paymentData.referenceNumber}
                      onChange={handleInputChange}
                      className="mt-1"
                      placeholder="UTR, Cheque No, Transaction ID, etc."
                    />
                  </div>

                  {(paymentData.type === "Bank Transfer" || paymentData.type === "Cheque") && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Bank Name</label>
                        <Input
                          type="text"
                          name="bankName"
                          value={paymentData.bankName}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Account Number</label>
                        <Input
                          type="text"
                          name="accountNumber"
                          value={paymentData.accountNumber}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea
                      name="notes"
                      value={paymentData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes about this payment..."
                    />
                  </div>

                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Screenshots (Optional)</label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      <div className="text-center">
                        <Upload size={24} className="mx-auto text-gray-400 mb-2" />
                        <div className="text-sm text-gray-600 mb-2">
                          Upload payment receipts, bank statements, or transaction screenshots
                        </div>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          <Upload size={16} className="mr-2" />
                          Choose Files
                        </label>
                        <p className="text-xs text-gray-500 mt-1">Max 5 files, 5MB each</p>
                      </div>
                    </div>

                    {/* Uploaded Files Preview */}
                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <h4 className="text-sm font-medium text-gray-700">Uploaded Files:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {uploadedFiles.map((file, index) => (
                            <div key={index} className="relative border rounded-lg p-2">
                              <img
                                src={file.data}
                                alt={file.name}
                                className="w-full h-20 object-cover rounded"
                              />
                              <div className="mt-1 text-xs text-gray-600 truncate">{file.name}</div>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={submitting}>
                      {submitting ? "Saving..." : 
                       modalMode === "create" ? "Create Payment" : 
                       modalMode === "draft" ? "Create Draft Transaction" : 
                       "Update Payment"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
