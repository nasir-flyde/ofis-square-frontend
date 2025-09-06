import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function CabinsPage() {
  const [cabins, setCabins] = useState([]);
  const [filteredCabins, setFilteredCabins] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create", "edit", "view"
  const [formData, setFormData] = useState({
    building: "",
    floor: "",
    number: "",
    type: "cabin",
    capacity: "1",
    status: "available"
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { client: api } = useApi("http://localhost:5001");

  const fetchCabins = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/cabins");
      
      if (response.data.success) {
        setCabins(response.data.data);
        setFilteredCabins(response.data.data);
      } else {
        setError("Failed to fetch cabins");
      }
    } catch (err) {
      console.error("Error fetching cabins:", err);
      setError(err.response?.data?.message || "Failed to fetch cabins");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchCabins();
    fetchBuildings();
  }, []);

  useEffect(() => {
    const filtered = cabins.filter(cabin =>
      (cabin.number || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cabin.building?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cabin.allocatedTo?.companyName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (cabin.status || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCabins(filtered);
  }, [searchTerm, cabins]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      available: { variant: "success", label: "Available" },
      occupied: { variant: "warning", label: "Occupied" },
      maintenance: { variant: "secondary", label: "Maintenance" }
    };
    
    const config = statusConfig[status] || statusConfig.available;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const resetForm = () => {
    setFormData({
      building: "",
      floor: "",
      number: "",
      type: "cabin",
      capacity: "1",
      status: "available"
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setModalMode("create");
    setSelectedCabin(null);
    setShowModal(true);
  };

  const handleEdit = (cabin) => {
    setFormData({
      building: cabin.building?._id || "",
      floor: cabin.floor || "",
      number: cabin.number || "",
      type: cabin.type || "cabin",
      capacity: cabin.capacity || "1",
      status: cabin.status || "available"
    });
    setSelectedCabin(cabin);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (cabin) => {
    setSelectedCabin(cabin);
    setModalMode("view");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedCabin(null);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.building.trim()) {
      errors.building = "Building is required";
    }
    
    if (!formData.number.trim()) {
      errors.number = "Cabin number is required";
    }

    if (formData.floor && (isNaN(formData.floor) || formData.floor < 0)) {
      errors.floor = "Floor must be a positive number";
    }

    if (formData.capacity && (isNaN(formData.capacity) || formData.capacity < 1)) {
      errors.capacity = "Capacity must be at least 1";
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
        ...formData,
        floor: formData.floor ? parseInt(formData.floor) : undefined,
        capacity: formData.capacity ? parseInt(formData.capacity) : 1
      };

      let response;
      if (modalMode === "create") {
        response = await api.post("/api/cabins", payload);
      } else {
        response = await api.put(`/api/cabins/${selectedCabin._id}`, payload);
      }

      if (response.data.success) {
        await fetchCabins();
        handleCloseModal();
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.message || "Failed to save cabin");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (cabin) => {
    if (!window.confirm(`Are you sure you want to delete cabin "${cabin.number}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/cabins/${cabin._id}`);
      
      if (response.data.success) {
        await fetchCabins();
      } else {
        setError(response.data.message || "Failed to delete cabin");
      }
    } catch (err) {
      console.error("Error deleting cabin:", err);
      setError(err.response?.data?.message || "Failed to delete cabin");
    }
  };

  const handleRelease = async (cabin) => {
    if (!window.confirm(`Are you sure you want to release cabin "${cabin.number}"?`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.post(`/api/cabins/${cabin._id}/release`);
      
      if (response.data.success) {
        await fetchCabins();
      } else {
        setError(response.data.message || "Failed to release cabin");
      }
    } catch (err) {
      console.error("Error releasing cabin:", err);
      setError(err.response?.data?.message || "Failed to release cabin");
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
          <h1 className="text-2xl font-bold text-gray-900">Cabins</h1>
          <p className="text-gray-600 mt-1">Manage your office cabins and workspaces</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {cabins.filter(c => c.status === 'available').length}
              </div>
              <div className="text-gray-600">Available</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-yellow-600 mb-2">
                {cabins.filter(c => c.status === 'occupied').length}
              </div>
              <div className="text-gray-600">Occupied</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {cabins.filter(c => c.status === 'maintenance').length}
              </div>
              <div className="text-gray-600">Maintenance</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {cabins.length}
              </div>
              <div className="text-gray-600">Total Cabins</div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search cabins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreate}>
            Add New Cabin
          </Button>
        </div>

        {/* Cabins Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cabin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Floor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Allocated To
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCabins.map((cabin) => (
                  <tr key={cabin._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{cabin.number}</div>
                        <div className="text-sm text-gray-500">{cabin.type}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{cabin.building?.name || "N/A"}</div>
                        <div className="text-sm text-gray-500">{cabin.building?.city || ""}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cabin.floor || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {cabin.capacity || 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(cabin.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">
                          {cabin.allocatedTo?.companyName || "Not Allocated"}
                        </div>
                        {cabin.allocatedAt && (
                          <div className="text-sm text-gray-500">
                            Since: {new Date(cabin.allocatedAt).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(cabin)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cabin)}
                      >
                        Edit
                      </Button>
                      {cabin.status === "occupied" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRelease(cabin)}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          Release
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(cabin)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Cabin Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === "create" ? "Add New Cabin" : 
                     modalMode === "edit" ? "Edit Cabin" : "Cabin Details"}
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
                {modalMode === "view" ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Cabin Number</label>
                            <p className="text-gray-900">{selectedCabin?.number}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Building</label>
                            <p className="text-gray-900">{selectedCabin?.building?.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Floor</label>
                            <p className="text-gray-900">{selectedCabin?.floor || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Type</label>
                            <p className="text-gray-900">{selectedCabin?.type}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Capacity</label>
                            <p className="text-gray-900">{selectedCabin?.capacity}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedCabin?.status)}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Allocation Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Allocated To</label>
                            <p className="text-gray-900">{selectedCabin?.allocatedTo?.companyName || "Not Allocated"}</p>
                          </div>
                          {selectedCabin?.allocatedTo && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Contact Person</label>
                              <p className="text-gray-900">{selectedCabin.allocatedTo.contactPerson}</p>
                            </div>
                          )}
                          <div>
                            <label className="text-sm font-medium text-gray-500">Allocated At</label>
                            <p className="text-gray-900">
                              {selectedCabin?.allocatedAt ? new Date(selectedCabin.allocatedAt).toLocaleDateString() : "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Contract Status</label>
                            <p className="text-gray-900">{selectedCabin?.contract?.status || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created Date</label>
                            <p className="text-gray-900">{new Date(selectedCabin?.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-600">{error}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Building *
                        </label>
                        <select
                          value={formData.building}
                          onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.building ? "border-red-300" : "border-gray-300"}`}
                          required
                        >
                          <option value="">Select building...</option>
                          {buildings.map(building => (
                            <option key={building._id} value={building._id}>
                              {building.name} - {building.city}
                            </option>
                          ))}
                        </select>
                        {formErrors.building && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.building}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Cabin Number *
                        </label>
                        <Input
                          value={formData.number}
                          onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                          placeholder="Enter cabin number"
                          className={formErrors.number ? "border-red-300" : ""}
                        />
                        {formErrors.number && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.number}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Floor
                        </label>
                        <Input
                          type="number"
                          value={formData.floor}
                          onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                          placeholder="Enter floor number"
                          min="0"
                          className={formErrors.floor ? "border-red-300" : ""}
                        />
                        {formErrors.floor && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.floor}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity
                        </label>
                        <Input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="Enter capacity"
                          min="1"
                          className={formErrors.capacity ? "border-red-300" : ""}
                        />
                        {formErrors.capacity && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.capacity}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="available">Available</option>
                          <option value="occupied">Occupied</option>
                          <option value="maintenance">Maintenance</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={handleCloseModal} type="button">
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={submitting}>
                        {submitting ? "Saving..." : modalMode === "create" ? "Create Cabin" : "Update Cabin"}
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {modalMode === "view" && (
                <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                  <Button variant="outline" onClick={handleCloseModal}>
                    Close
                  </Button>
                  <Button variant="primary" onClick={() => handleEdit(selectedCabin)}>
                    Edit Cabin
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
