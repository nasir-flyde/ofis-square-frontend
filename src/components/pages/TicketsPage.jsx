import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { 
  Ticket, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Building, 
  User, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Upload,
  X,
  Image
} from "lucide-react";

export function TicketsPage() {
  const [tickets, setTickets] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // view, create, edit
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({ open: 0, closed: 0, total: 0 });
  
  const [ticketData, setTicketData] = useState({
    subject: "",
    description: "",
    priority: "low",
    status: "open",
    building: "",
    cabin: "",
    assignedTo: "",
    category: {
      categoryId: "",
      subCategory: ""
    },
    images: []
  });

  const { client: api } = useApi();

  const fetchTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/tickets");
      console.log('Tickets API Response:', response.data);
      
      if (response.data.success && response.data.data) {
        setTickets(response.data.data);
        setFilteredTickets(response.data.data);
      } else {
        setError("Failed to fetch tickets");
      }
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError(err.response?.data?.error || "Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuildings = async () => {
    try {
      const response = await api.get("/api/buildings");
      if (response.data.success) {
        setBuildings(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching buildings:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/api/users/staff");
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/api/ticket-categories");
      // Controller returns plain array
      if (Array.isArray(response.data)) {
        setCategories(response.data);
      }
    } catch (err) {
      console.error("Error fetching ticket categories:", err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/api/tickets/stats");
      setStats(response.data);
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchBuildings();
    fetchUsers();
    fetchStats();
    fetchCategories();
  }, []);

  useEffect(() => {
    const filtered = tickets.filter(ticket =>
      ticket.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.building?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTickets(filtered);
  }, [searchTerm, tickets]);

  const handleCreate = () => {
    setSelectedTicket(null);
    setTicketData({
      subject: "",
      description: "",
      priority: "low",
      status: "open",
      building: "",
      cabin: "",
      assignedTo: "",
      category: {
        categoryId: "",
        subCategory: ""
      },
      images: []
    });
    setModalMode("create");
    setShowModal(true);
  };

  const handleEdit = (ticket) => {
    setSelectedTicket(ticket);
    setTicketData({
      subject: ticket.subject || "",
      description: ticket.description || "",
      priority: ticket.priority || "low",
      status: ticket.status || "open",
      building: ticket.building?._id || "",
      cabin: ticket.cabin?._id || "",
      assignedTo: ticket.assignedTo?._id || "",
      category: {
        categoryId: ticket.category?.categoryId?._id || "",
        subCategory: ticket.category?.subCategory || ""
      },
      images: ticket.images || []
    });
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (ticket) => {
    setSelectedTicket(ticket);
    setModalMode("view");
    setShowModal(true);
  };

  const handleDelete = async (ticket) => {
    if (!window.confirm(`Are you sure you want to delete ticket "${ticket.subject}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/tickets/${ticket._id}`);
      setTickets(prev => prev.filter(t => t._id !== ticket._id));
      fetchStats();
    } catch (err) {
      console.error("Error deleting ticket:", err);
      setError(err.response?.data?.error || "Failed to delete ticket");
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // For now, we'll store file names. In production, you'd upload to cloud storage
      const imageNames = files.map(file => file.name);
      setTicketData(prev => ({
        ...prev,
        images: [...prev.images, ...imageNames]
      }));
    }
  };

  const removeImage = (index) => {
    setTicketData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const payload = {
        ...ticketData,
        building: ticketData.building || undefined,
        cabin: ticketData.cabin || undefined,
        assignedTo: ticketData.assignedTo || undefined,
        category: {
          categoryId: ticketData.category.categoryId || undefined,
          subCategory: ticketData.category.subCategory || undefined
        },
        images: ticketData.images
      };

      if (modalMode === "create") {
        const response = await api.post("/api/tickets", payload);
        setTickets(prev => [response.data, ...prev]);
      } else if (modalMode === "edit") {
        const response = await api.patch(`/api/tickets/${selectedTicket._id}`, payload);
        setTickets(prev => prev.map(t => t._id === selectedTicket._id ? response.data : t));
      }

      setShowModal(false);
      fetchStats();
    } catch (err) {
      console.error("Error saving ticket:", err);
      setError(err.response?.data?.error || "Failed to save ticket");
    }
  };

  const getPriorityBadge = (priority) => {
    const variants = {
      low: "secondary",
      medium: "warning", 
      high: "danger",
      urgent: "danger"
    };
    
    return (
      <Badge variant={variants[priority] || "secondary"}>
        {priority?.toUpperCase() || "LOW"}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { variant: "primary", icon: <AlertCircle size={12} /> },
      inprogress: { variant: "warning", icon: <Clock size={12} /> },
      resolved: { variant: "success", icon: <CheckCircle size={12} /> },
      closed: { variant: "secondary", icon: <XCircle size={12} /> },
      pending: { variant: "warning", icon: <Clock size={12} /> }
    };
    
    const { variant, icon } = config[status] || config.open;
    
    return (
      <Badge variant={variant}>
        <span className="flex items-center gap-1">
          {icon}
          {status?.toUpperCase() || "OPEN"}
        </span>
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">Loading tickets...</div>
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
          <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
          <p className="text-gray-600 mt-1">Manage support tickets and issues</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Open Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.open}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Closed Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.closed}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <Ticket className="h-6 w-6 text-gray-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Tickets</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Search and Create */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search tickets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreate}>
            Create New Ticket
          </Button>
        </div>

        {/* Tickets Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Assigned To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTickets.map((ticket) => (
                  <tr key={ticket._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Ticket size={14} className="mr-2 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {ticket.ticketId || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ticket.subject || "N/A"}
                      </div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {ticket.description || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Building size={14} className="mr-2 text-gray-400" />
                        <span>{ticket.building?.name || "N/A"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <User size={14} className="mr-2 text-gray-400" />
                        <span>{ticket.assignedTo?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(ticket.priority)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(ticket.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(ticket)}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(ticket)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(ticket)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Ticket Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {modalMode === "create" ? "Create New Ticket" : 
                   modalMode === "edit" ? "Edit Ticket" : "Ticket Details"}
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                >
                  ×
                </Button>
              </div>

              {modalMode === "view" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Ticket ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.ticketId || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.subject || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.description || "N/A"}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTicket?.category?.categoryId?.name || "N/A"}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedTicket?.category?.subCategory || "N/A"}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <div className="mt-1">{getPriorityBadge(selectedTicket?.priority)}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedTicket?.status)}</div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Building</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.building?.name || "N/A"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.assignedTo?.name || "Unassigned"}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Latest Update</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTicket?.latestUpdate || "N/A"}</p>
                  </div>
                  {selectedTicket?.images && selectedTicket.images.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Images</label>
                      <div className="mt-1 grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {selectedTicket.images.map((image, index) => (
                          <div key={index} className="relative group">
                            <div className="aspect-square bg-gray-100 rounded-lg border-2 border-gray-200 flex items-center justify-center overflow-hidden hover:border-blue-300 transition-colors cursor-pointer">
                              {/* For now showing placeholder. In production, you'd show actual image */}
                              <div className="text-center">
                                <Image size={32} className="text-gray-400 mx-auto mb-2" />
                                <span className="text-xs text-gray-600 break-all px-2">{image}</span>
                              </div>
                            </div>
                            {/* Hover overlay */}
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 rounded-lg transition-all duration-200 flex items-center justify-center">
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye size={20} className="text-white" />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Click on images to view full size</p>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Subject *</label>
                    <Input
                      type="text"
                      value={ticketData.subject}
                      onChange={(e) => setTicketData(prev => ({ ...prev, subject: e.target.value }))}
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Description *</label>
                    <textarea
                      value={ticketData.description}
                      onChange={(e) => setTicketData(prev => ({ ...prev, description: e.target.value }))}
                      required
                      rows={4}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={ticketData.priority}
                        onChange={(e) => setTicketData(prev => ({ ...prev, priority: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={ticketData.status}
                        onChange={(e) => setTicketData(prev => ({ ...prev, status: e.target.value }))}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="open">Open</option>
                        <option value="inprogress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                        <option value="pending">Pending</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category</label>
                      <select
                        value={ticketData.category.categoryId}
                        onChange={(e) => {
                          const categoryId = e.target.value;
                          setTicketData(prev => ({
                            ...prev,
                            category: {
                              categoryId,
                              // Reset subcategory when category changes
                              subCategory: "",
                            },
                          }));
                        }}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Category</option>
                        {categories.map((cat) => (
                          <option key={cat._id} value={cat._id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                      <select
                        value={ticketData.category.subCategory}
                        onChange={(e) => setTicketData(prev => ({
                          ...prev,
                          category: {
                            ...prev.category,
                            subCategory: e.target.value,
                          },
                        }))}
                        disabled={!ticketData.category.categoryId}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      >
                        <option value="">{!ticketData.category.categoryId ? "Select category first" : "Select Subcategory"}</option>
                        {(categories.find(c => c._id === ticketData.category.categoryId)?.subCategories || []).map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Building</label>
                    <select
                      value={ticketData.building}
                      onChange={(e) => setTicketData(prev => ({ ...prev, building: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Select Building</option>
                      {buildings.map((building) => (
                        <option key={building._id} value={building._id}>
                          {building.name} - {building.city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                    <select
                      value={ticketData.assignedTo}
                      onChange={(e) => setTicketData(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.name} - {user.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Images (Optional)</label>
                    <div className="mt-1">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:bg-gray-50"
                      >
                        <div className="flex flex-col items-center">
                          <Upload size={24} className="text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">Click to upload images</span>
                          <span className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</span>
                        </div>
                      </label>
                      
                      {ticketData.images.length > 0 && (
                        <div className="mt-3 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Uploaded Images:</p>
                          <div className="flex flex-wrap gap-2">
                            {ticketData.images.map((image, index) => (
                              <div key={index} className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-lg">
                                <Image size={14} className="text-gray-400" />
                                <span className="text-sm text-gray-700">{image}</span>
                                <button
                                  type="button"
                                  onClick={() => removeImage(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">
                      {modalMode === "create" ? "Create Ticket" : "Update Ticket"}
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
