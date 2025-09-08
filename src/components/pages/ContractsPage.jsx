import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { ContractModal } from "./ContractModals";
import { FileText, Download, Eye, Edit, Trash2, Building, User, Calendar, IndianRupee, Upload } from "lucide-react";

export function ContractsPage() {
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create");
  const [formData, setFormData] = useState({
    client: "",
    building: "",
    capacity: "",
    monthlyRent: "",
    initialCredits: "",
    creditValueAtSignup: "",
    securityDeposit: "",
    contractStartDate: "",
    contractEndDate: "",
    terms: "",
    signedFileUrl: "",
    signedFile: null,
    status: "draft"
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { client: api } = useApi();
  const navigate = useNavigate();

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/contracts");
      
      if (response.data.success) {
        setContracts(response.data.data);
        setFilteredContracts(response.data.data);
      } else {
        setError("Failed to fetch contracts");
      }
    } catch (err) {
      console.error("Error fetching contracts:", err);
      setError(err.response?.data?.message || "Failed to fetch contracts");
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

  const fetchBuildings = async () => {
    try {
      const response = await api.get("/api/buildings");
      if (response.data.success) {
        setBuildings(response.data.data.filter(b => b.status === 'active'));
      }
    } catch (err) {
      console.error("Error fetching buildings:", err);
    }
  };

  // Auto-calculate monthly rent when capacity or building changes
  const calculateMonthlyRent = (capacity, buildingId) => {
    if (!capacity || !buildingId) return '';
    
    const selectedBuilding = buildings.find(b => b._id === buildingId);
    if (!selectedBuilding || !selectedBuilding.pricing) return '';
    
    return (parseInt(capacity) * selectedBuilding.pricing).toString();
  };

  useEffect(() => {
    fetchContracts();
    fetchClients();
    fetchBuildings();
  }, []);

  useEffect(() => {
    const filtered = contracts.filter(contract =>
      (contract.client?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.building?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contract.status || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContracts(filtered);
  }, [searchTerm, contracts]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: "secondary", label: "Draft" },
      pending_signature: { variant: "warning", label: "Pending Signature" },
      active: { variant: "success", label: "Active" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const resetForm = () => {
    setFormData({
      client: "",
      building: "",
      capacity: "",
      monthlyRent: "",
      initialCredits: "",
      creditValueAtSignup: "",
      securityDeposit: "",
      contractStartDate: "",
      contractEndDate: "",
      terms: "",
      signedFileUrl: "",
      signedFile: null,
      status: "draft"
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setModalMode("create");
    setSelectedContract(null);
    setShowModal(true);
  };

  const handleEdit = (contract) => {
    setFormData({
      client: contract.client?._id || "",
      building: contract.building?._id || "",
      capacity: contract.capacity || "",
      monthlyRent: contract.monthlyRent || "",
      initialCredits: contract.initialCredits || "",
      creditValueAtSignup: contract.creditValueAtSignup || "",
      securityDeposit: contract.securityDeposit || "",
      contractStartDate: contract.startDate ? new Date(contract.startDate).toISOString().split('T')[0] : "",
      contractEndDate: contract.endDate ? new Date(contract.endDate).toISOString().split('T')[0] : "",
      terms: contract.terms || "",
      signedFileUrl: "",
      signedFile: null,
      status: contract.status || "draft"
    });
    setSelectedContract(contract);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleFormDataChange = (updates) => {
    const newFormData = { ...formData, ...updates };
    
    // Auto-calculate monthly rent if capacity or building changes
    if (updates.capacity !== undefined || updates.building !== undefined) {
      const calculatedRent = calculateMonthlyRent(
        updates.capacity !== undefined ? updates.capacity : formData.capacity,
        updates.building !== undefined ? updates.building : formData.building
      );
      if (calculatedRent) {
        newFormData.monthlyRent = calculatedRent;
      }
    }
    
    setFormData(newFormData);
  };

  const handleView = (contract) => {
    setSelectedContract(contract);
    setModalMode("view");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedContract(null);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.client) {
      errors.client = "Client is required";
    }
    
    if (!formData.building) {
      errors.building = "Building is required";
    }
    
    if (!formData.capacity || isNaN(formData.capacity) || formData.capacity < 1) {
      errors.capacity = "Capacity must be a positive number";
    }

    if (!formData.monthlyRent || isNaN(formData.monthlyRent) || formData.monthlyRent < 0) {
      errors.monthlyRent = "Monthly rent must be a positive number";
    }

    if (!formData.contractStartDate) {
      errors.contractStartDate = "Start date is required";
    }

    if (!formData.contractEndDate) {
      errors.contractEndDate = "End date is required";
    }

    if (formData.contractStartDate && formData.contractEndDate && 
        new Date(formData.contractStartDate) >= new Date(formData.contractEndDate)) {
      errors.contractEndDate = "End date must be after start date";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        clientId: formData.client,
        buildingId: formData.building,
        capacity: parseInt(formData.capacity),
        monthlyRent: parseFloat(formData.monthlyRent),
        initialCredits: formData.initialCredits ? parseInt(formData.initialCredits) : undefined,
        creditValueAtSignup: formData.creditValueAtSignup ? parseFloat(formData.creditValueAtSignup) : undefined,
        securityDeposit: formData.securityDeposit ? parseFloat(formData.securityDeposit) : undefined,
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        terms: formData.terms
      };

      let response;
      if (modalMode === "create") {
        response = await api.post("/api/contracts", payload);
      } else {
        response = await api.put(`/api/contracts/${selectedContract._id}`, payload);
      }

      if (response.data.success || response.data.message) {
        // If editing and a new signed file (preferred) or URL is provided, upload it
        if (modalMode === "edit" && (formData.signedFile || (formData.signedFileUrl && formData.signedFileUrl !== selectedContract?.fileUrl))) {
          try {
            const fd = new FormData();
            if (formData.signedFile) {
              fd.append('file', formData.signedFile);
            } else if (formData.signedFileUrl) {
              fd.append('fileUrl', formData.signedFileUrl);
            }
            await api.post(`/api/contracts/${selectedContract._id}/upload-signed`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
          } catch (uploadErr) {
            console.error("Error replacing signed contract:", uploadErr);
            // Surface a non-blocking message
            alert(uploadErr.response?.data?.error || 'Failed to replace signed contract');
          }
        }
        await fetchContracts();
        handleCloseModal();
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.message || "Failed to save contract");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownload = async (contract) => {
    try {
      setError(null);
      const response = await api.get(`/api/contracts/${contract._id}/download-pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contract_${contract.client?.companyName?.replace(/[^a-zA-Z0-9]/g, '_') || 'contract'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error downloading contract:", err);
      setError(err.response?.data?.message || "Failed to download contract");
    }
  };

  // Removed digital signature flow from UI. Using manual upload of signed contracts instead.

  const handleDelete = async (contract) => {
    if (!window.confirm(`Are you sure you want to delete the contract for "${contract.client?.companyName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/contracts/${contract._id}`);
      
      if (response.data.success) {
        await fetchContracts();
      } else {
        setError(response.data.message || "Failed to delete contract");
      }
    } catch (err) {
      console.error("Error deleting contract:", err);
      setError(err.response?.data?.message || "Failed to delete contract");
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
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Contracts</h1>
          <p className="text-gray-600 mt-1">Manage client contracts and digital signatures</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {contracts.filter(c => c.status === 'draft').length}
              </div>
              <div className="text-gray-600">Draft Contracts</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {contracts.filter(c => c.status === 'pending_signature').length}
              </div>
              <div className="text-gray-600">Pending Signature</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {contracts.filter(c => c.status === 'active').length}
              </div>
              <div className="text-gray-600">Active Contracts</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                ₹{contracts.reduce((sum, c) => sum + (c.monthlyRent || 0), 0).toLocaleString()}
              </div>
              <div className="text-gray-600">Total Monthly Revenue</div>
            </div>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search contracts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreate}>
            Create New Contract
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
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
                {filteredContracts.map((contract) => (
                  <tr key={contract._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 flex items-center">
                          <User size={14} className="mr-2 text-gray-400" />
                          {contract.client?.companyName || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">{contract.client?.contactPerson}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Building size={14} className="mr-2 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {contract.building?.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900 flex items-center">
                          <IndianRupee size={14} className="mr-1 text-gray-400" />
                          {contract.monthlyRent?.toLocaleString() || "0"}/month
                        </div>
                        <div className="text-sm text-gray-500">
                          Capacity: {contract.capacity} people
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Calendar size={14} className="mr-1 text-gray-400" />
                        <div>
                          <div>{new Date(contract.startDate).toLocaleDateString()}</div>
                          <div className="text-xs text-gray-500">
                            to {new Date(contract.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(contract.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDownload(contract)}
                        className="mr-2"
                        title="Download Contract"
                      >
                        <Download size={14} />
                      </Button>
                      {(contract.status === 'draft' || contract.status === 'pending_signature') && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/upload-signed-contract/${contract._id}`, { state: { fromContracts: true } })}
                          className="mr-2"
                          title="Upload Signed Contract"
                        >
                          <Upload size={14} className="mr-1" />
                          Upload Signed
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(contract)}
                      >
                        <Eye size={14} className="mr-1" />
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(contract)}
                      >
                        <Edit size={14} className="mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(contract)}
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

        {/* Contract Modal */}
        <ContractModal
          showModal={showModal}
          modalMode={modalMode}
          selectedContract={selectedContract}
          formData={formData}
          setFormData={handleFormDataChange}
          formErrors={formErrors}
          clients={clients}
          buildings={buildings}
          error={error}
          submitting={submitting}
          onSubmit={handleSubmit}
          onClose={handleCloseModal}
        />
      </div>
    </div>
  );
}
