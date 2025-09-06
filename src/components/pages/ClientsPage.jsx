import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { client: api } = useApi("http://localhost:5001");

  // Details modal tab state and data
  const [activeTab, setActiveTab] = useState("overview");
  const [cabins, setCabins] = useState([]);
  const [cabinsLoading, setCabinsLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  // Meeting booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [bookingForm, setBookingForm] = useState({
    room: "",
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    attendeesCount: "",
    paymentMethod: "credits", // credits | cash
    amount: "",
    notes: "",
    member: ""
  });

  const fetchClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/clients");
      
      if (response.data.success) {
        setClients(response.data.data);
        setFilteredClients(response.data.data);
      } else {
        setError("Failed to fetch clients");
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
      setError(err.response?.data?.error || "Failed to fetch clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = clients.filter(client =>
      (client.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.contactPerson || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.phone || "").includes(searchTerm)
    );
    setFilteredClients(filtered);
  }, [searchTerm, clients]);

  const getStatusBadge = (kycStatus) => {
    const statusConfig = {
      verified: { variant: "success", label: "Verified" },
      pending: { variant: "warning", label: "Pending" },
      rejected: { variant: "danger", label: "Rejected" },
      none: { variant: "secondary", label: "Not Started" }
    };
    
    const config = statusConfig[kycStatus] || statusConfig.none;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleViewDetails = (client) => {
    setSelectedClient(client);
    setActiveTab("overview");
    setShowDetailsModal(true);
  };

  const handleCloseDetails = () => {
    setShowDetailsModal(false);
  };

  // Meeting booking helpers
  const openBookingModal = async (client) => {
    setSelectedClient(client);
    setBookingError("");
    setBookingSubmitting(false);
    setBookingForm({
      room: "",
      title: `${client.companyName || "Client"} Meeting`,
      description: "",
      date: "",
      startTime: "",
      endTime: "",
      attendeesCount: "",
      paymentMethod: "credits",
      amount: "",
      notes: "",
      member: ""
    });
    try {
      const resp = await api.get("/api/meeting-rooms");
      setRooms(resp?.data?.data || []);
    } catch (e) {
      setRooms([]);
    }
    setShowBookingModal(true);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
    setBookingError("");
  };

  const submitBooking = async (e) => {
    e.preventDefault();
    setBookingError("");
    setBookingSubmitting(true);

    try {
      // Compose ISO start and end using local datetime inputs
      if (!bookingForm.date || !bookingForm.startTime || !bookingForm.endTime) {
        setBookingError("Please select date, start time and end time");
        setBookingSubmitting(false);
        return;
      }

      const startISO = new Date(`${bookingForm.date}T${bookingForm.startTime}:00`).toISOString();
      const endISO = new Date(`${bookingForm.date}T${bookingForm.endTime}:00`).toISOString();

      const payload = {
        room: bookingForm.room,
        clientId: selectedClient?._id,
        member: bookingForm.member || undefined,
        paymentMethod: bookingForm.paymentMethod,
        idempotencyKey: `meet_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        title: bookingForm.title || undefined,
        description: bookingForm.description || undefined,
        start: startISO,
        end: endISO,
        attendeesCount: bookingForm.attendeesCount ? parseInt(bookingForm.attendeesCount) : undefined,
        amenitiesRequested: undefined,
        currency: "INR",
        amount: bookingForm.paymentMethod === "cash" && bookingForm.amount ? parseFloat(bookingForm.amount) : undefined,
        notes: bookingForm.notes || undefined,
      };

      const resp = await api.post("/api/meeting-bookings", payload);
      if (resp?.data?.success) {
        closeBookingModal();
      } else {
        setBookingError(resp?.data?.message || "Failed to create booking");
      }
    } catch (err) {
      setBookingError(err.response?.data?.message || "Failed to create booking");
    } finally {
      setBookingSubmitting(false);
    }
  };

  // Fetch cabins and invoices when a client is selected and tab switches
  useEffect(() => {
    if (!selectedClient) return;

    // Fetch cabins allocated to client (requires auth; API supports status filter, we'll filter by allocatedTo on client side)
    const loadCabins = async () => {
      try {
        setCabinsLoading(true);
        const resp = await api.get("/api/cabins", { params: { status: "occupied" } });
        const all = resp?.data?.data || [];
        const forClient = all.filter(c => (c.allocatedTo?._id || c.allocatedTo) === selectedClient._id);
        setCabins(forClient);
      } catch (e) {
        setCabins([]);
      } finally {
        setCabinsLoading(false);
      }
    };

    // Fetch invoices for client
    const loadInvoices = async () => {
      try {
        setInvoicesLoading(true);
        const resp = await api.get("/api/invoices", { params: { client: selectedClient._id } });
        setInvoices(resp?.data?.data || []);
      } catch (e) {
        setInvoices([]);
      } finally {
        setInvoicesLoading(false);
      }
    };

    loadCabins();
    loadInvoices();
  }, [selectedClient]);

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

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600 mt-1">Manage your clients and their details</p>
          </div>
          <Card>
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Clients</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchClients} variant="primary">
                Try Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-1">Manage your clients and their details</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {clients.filter(c => c.kycStatus === 'verified').length}
              </div>
              <div className="text-gray-600">Verified Clients</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {clients.filter(c => c.kycStatus === 'pending').length}
              </div>
              <div className="text-gray-600">Pending KYC</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {clients.filter(c => c.companyDetailsComplete).length}
              </div>
              <div className="text-gray-600">Complete Profiles</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {clients.length}
              </div>
              <div className="text-gray-600">Total Clients</div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary">
            Add New Client
          </Button>
        </div>

        {/* Clients Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Credits
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Profile Complete
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredClients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{client.companyName || "N/A"}</div>
                        <div className="text-sm text-gray-500">{client.contactPerson || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-sm text-gray-900">{client.email || "N/A"}</div>
                        <div className="text-sm text-gray-500">{client.phone || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {client.wallet?.balance || 0} / {client.totalCredits || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          Used: {(client.totalCredits || 0) - (client.wallet?.balance || 0)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {getStatusBadge(client.kycStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {client.companyDetailsComplete ? "✓" : "✗"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewDetails(client)}
                      >
                        View Details
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => openBookingModal(client)}
                        className="ml-2"
                      >
                        Book Meeting
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Client Details Modal */}
        {showDetailsModal && selectedClient && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Client Details</h2>
                  <button
                    onClick={handleCloseDetails}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Tabs */}
                <div className="flex space-x-2 border-b border-gray-200 mb-4">
                  {[
                    { id: "overview", label: "Overview" },
                    { id: "cabins", label: "Cabins" },
                    { id: "invoices", label: "Invoices" },
                  ].map(t => (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-md ${activeTab === t.id ? "bg-white border-x border-t border-gray-200 -mb-px" : "text-gray-600 hover:text-gray-800"}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                {activeTab === "overview" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Company Name</label>
                          <p className="text-gray-900">{selectedClient.companyName || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Person</label>
                          <p className="text-gray-900">{selectedClient.contactPerson || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Email</label>
                          <p className="text-gray-900">{selectedClient.email || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Phone</label>
                          <p className="text-gray-900">{selectedClient.phone || "N/A"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">KYC Status</label>
                          <div className="mt-1">{getStatusBadge(selectedClient.kycStatus)}</div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">System Details</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Profile Complete</label>
                          <p className="text-gray-900">{selectedClient.companyDetailsComplete ? "Yes" : "No"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Zoho Books Contact ID</label>
                          <p className="text-gray-900">{selectedClient.zohoBooksContactId || "Not Synced"}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Created Date</label>
                          <p className="text-gray-900">{new Date(selectedClient.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Last Updated</label>
                          <p className="text-gray-900">{new Date(selectedClient.updatedAt).toLocaleDateString()}</p>
                        </div>
                        {selectedClient.kycRejectionReason && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">KYC Rejection Reason</label>
                            <p className="text-red-600">{selectedClient.kycRejectionReason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="md:col-span-2">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Address</h3>
                      <p className="text-gray-900">{selectedClient.companyAddress || "Not provided"}</p>
                    </div>
                  </div>
                )}

                {activeTab === "cabins" && (
                  <div>
                    {cabinsLoading ? (
                      <div className="text-sm text-gray-600">Loading cabins...</div>
                    ) : cabins.length === 0 ? (
                      <div className="text-sm text-gray-600">No cabins allocated to this client.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabin</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Floor</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Allocated At</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {cabins.map(c => (
                              <tr key={c._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{c.number}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.building?.name || "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.floor ?? "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.type}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.status}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{c.allocatedAt ? new Date(c.allocatedAt).toLocaleDateString() : "-"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "invoices" && (
                  <div>
                    {invoicesLoading ? (
                      <div className="text-sm text-gray-600">Loading invoices...</div>
                    ) : invoices.length === 0 ? (
                      <div className="text-sm text-gray-600">No invoices found for this client.</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paid</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Balance</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map(inv => (
                              <tr key={inv._id} className="hover:bg-gray-50">
                                <td className="px-4 py-2 text-sm text-gray-900">{inv.invoiceNumber || inv.zohoInvoiceNumber || inv._id.slice(-6)}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{inv.issueDate ? new Date(inv.issueDate).toLocaleDateString() : "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : "-"}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{Number(inv.total || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{Number(inv.amountPaid || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-sm text-gray-900">₹{Number(inv.balanceDue || 0).toLocaleString()}</td>
                                <td className="px-4 py-2 text-xs">
                                  <span className={`px-2 py-1 rounded-full ${inv.status === 'paid' ? 'bg-green-100 text-green-700' : inv.status === 'overdue' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                    {inv.status || 'issued'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

              </div>

              <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                <Button variant="outline" onClick={handleCloseDetails}>
                  Close
                </Button>
                <Button variant="primary">
                  Edit Client
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Meeting Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Book Meeting Room</h2>
                  <button onClick={closeBookingModal} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-sm text-gray-600 mt-1">Client: <span className="font-medium">{selectedClient?.companyName}</span></p>
              </div>
              <div className="p-6">
                {bookingError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">{bookingError}</p>
                  </div>
                )}
                <form onSubmit={submitBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meeting Room *</label>
                    <select
                      value={bookingForm.room}
                      onChange={(e) => setBookingForm({ ...bookingForm, room: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select a room...</option>
                      {rooms.map(r => (
                        <option key={r._id} value={r._id}>{r.name} ({r.capacity})</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <Input
                        value={bookingForm.title}
                        onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                        placeholder="e.g., Client Review Meeting"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Attendees</label>
                      <Input
                        type="number"
                        value={bookingForm.attendeesCount}
                        onChange={(e) => setBookingForm({ ...bookingForm, attendeesCount: e.target.value })}
                        placeholder="Number of attendees"
                        min="1"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={bookingForm.description}
                      onChange={(e) => setBookingForm({ ...bookingForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Agenda or notes"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                      <Input
                        type="date"
                        value={bookingForm.date}
                        onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                      <Input
                        type="time"
                        value={bookingForm.startTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                      <Input
                        type="time"
                        value={bookingForm.endTime}
                        onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                      <select
                        value={bookingForm.paymentMethod}
                        onChange={(e) => setBookingForm({ ...bookingForm, paymentMethod: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="credits">Credits</option>
                        <option value="cash">Cash/Card</option>
                      </select>
                    </div>
                    {bookingForm.paymentMethod === "cash" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                        <Input
                          type="number"
                          value={bookingForm.amount}
                          onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
                          placeholder="Enter amount"
                          min="0"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <Input
                      value={bookingForm.notes}
                      onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                      placeholder="Optional notes"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-2">
                    <Button variant="outline" type="button" onClick={closeBookingModal}>Cancel</Button>
                    <Button variant="primary" type="submit" loading={bookingSubmitting}>
                      {bookingSubmitting ? "Booking..." : "Create Booking"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
