import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function BuildingsPage() {
  const [buildings, setBuildings] = useState([]);
  const [filteredBuildings, setFilteredBuildings] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create", "edit", "view"
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    country: "India",
    pincode: "",
    totalFloors: "",
    amenities: [],
    status: "active",
    pricing: "",
    photos: []
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { client: api } = useApi();

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/buildings");
      
      if (response.data.success) {
        setBuildings(response.data.data);
        setFilteredBuildings(response.data.data);
      } else {
        setError("Failed to fetch buildings");
      }
    } catch (err) {
      console.error("Error fetching buildings:", err);
      setError(err.response?.data?.message || "Failed to fetch buildings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBuildings();
  }, []);

  useEffect(() => {
    const filtered = buildings.filter(building =>
      (building.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (building.address || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (building.city || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (building.state || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredBuildings(filtered);
  }, [searchTerm, buildings]);

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: "success", label: "Active" },
      inactive: { variant: "secondary", label: "Inactive" }
    };
    
    const config = statusConfig[status] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      pincode: "",
      totalFloors: "",
      amenities: [],
      status: "active",
      pricing: "",
      photos: []
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setModalMode("create");
    setSelectedBuilding(null);
    setShowModal(true);
  };

  const handleEdit = (building) => {
    setFormData({
      name: building.name || "",
      address: building.address || "",
      city: building.city || "",
      state: building.state || "",
      country: building.country || "India",
      pincode: building.pincode || "",
      totalFloors: building.totalFloors || "",
      amenities: building.amenities || [],
      status: building.status || "active",
      pricing: building.pricing || "",
      photos: []
    });
    setSelectedBuilding(building);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (building) => {
    setSelectedBuilding(building);
    setModalMode("view");
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedBuilding(null);
    resetForm();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = "Building name is required";
    }
    
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }
    
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }

    if (formData.totalFloors && (isNaN(formData.totalFloors) || formData.totalFloors < 1)) {
      errors.totalFloors = "Total floors must be a positive number";
    }

    if (formData.pricing && (isNaN(formData.pricing) || formData.pricing < 0)) {
      errors.pricing = "Pricing must be a positive number";
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
        totalFloors: formData.totalFloors ? parseInt(formData.totalFloors) : undefined,
        pricing: formData.pricing ? parseFloat(formData.pricing) : undefined
      };

      let response;
      if (modalMode === "create") {
        response = await api.post("/api/buildings", payload);
      } else {
        response = await api.put(`/api/buildings/${selectedBuilding._id}`, payload);
      }

      if (response.data.success) {
        await fetchBuildings();
        handleCloseModal();
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.message || "Failed to save building");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (building) => {
    if (!window.confirm(`Are you sure you want to delete "${building.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/buildings/${building._id}`);
      
      if (response.data.success) {
        await fetchBuildings();
      } else {
        setError(response.data.message || "Failed to delete building");
      }
    } catch (err) {
      console.error("Error deleting building:", err);
      setError(err.response?.data?.message || "Failed to delete building");
    }
  };

  const handleAmenityChange = (amenity) => {
    const currentAmenities = formData.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setFormData({ ...formData, amenities: updatedAmenities });
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 10 * 1024 * 1024; // 10MB
    const maxFiles = 10;

    if (formData.photos.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} photos allowed`);
      return;
    }

    const processedFiles = [];
    let hasError = false;

    files.forEach((file) => {
      if (file.size > maxSize) {
        setError(`File ${file.name} is too large. Maximum size is 10MB.`);
        hasError = true;
        return;
      }

      if (!file.type.startsWith('image/')) {
        setError(`File ${file.name} is not an image.`);
        hasError = true;
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        processedFiles.push({
          name: file.name,
          file: event.target.result, // base64 string
          size: file.size,
          preview: event.target.result
        });

        if (processedFiles.length === files.length && !hasError) {
          setFormData(prev => ({
            ...prev,
            photos: [...prev.photos, ...processedFiles]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const commonAmenities = [
    "Parking", "Security", "Elevator", "Generator", "WiFi", 
    "Conference Room", "Cafeteria", "Reception", "CCTV", "Fire Safety"
  ];

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
          <h1 className="text-2xl font-bold text-gray-900">Buildings</h1>
          <p className="text-gray-600 mt-1">Manage your office buildings and properties</p>
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
                {buildings.filter(b => b.status === 'active').length}
              </div>
              <div className="text-gray-600">Active Buildings</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {buildings.filter(b => b.status === 'inactive').length}
              </div>
              <div className="text-gray-600">Inactive Buildings</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {buildings.reduce((sum, b) => sum + (b.totalFloors || 0), 0)}
              </div>
              <div className="text-gray-600">Total Floors</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {buildings.length}
              </div>
              <div className="text-gray-600">Total Buildings</div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search buildings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreate}>
            Add New Building
          </Button>
        </div>

        {/* Buildings Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Floors
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBuildings.map((building) => (
                  <tr key={building._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{building.name}</div>
                        <div className="text-sm text-gray-500">{building.address}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{building.city}</div>
                        <div className="text-sm text-gray-500">{building.state}, {building.country}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {building.totalFloors || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {building.pricing ? `₹${building.pricing.toLocaleString()}` : "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(building.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(building.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(building)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(building)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(building)}
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

        {/* Building Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === "create" ? "Add New Building" : 
                     modalMode === "edit" ? "Edit Building" : "Building Details"}
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
                            <label className="text-sm font-medium text-gray-500">Building Name</label>
                            <p className="text-gray-900">{selectedBuilding?.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Address</label>
                            <p className="text-gray-900">{selectedBuilding?.address}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">City</label>
                            <p className="text-gray-900">{selectedBuilding?.city}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">State</label>
                            <p className="text-gray-900">{selectedBuilding?.state || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Country</label>
                            <p className="text-gray-900">{selectedBuilding?.country}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pincode</label>
                            <p className="text-gray-900">{selectedBuilding?.pincode || "N/A"}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Details</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Total Floors</label>
                            <p className="text-gray-900">{selectedBuilding?.totalFloors || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Pricing</label>
                            <p className="text-gray-900">{selectedBuilding?.pricing ? `₹${selectedBuilding.pricing.toLocaleString()}` : "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedBuilding?.status)}</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Created Date</label>
                            <p className="text-gray-900">{new Date(selectedBuilding?.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedBuilding?.amenities && selectedBuilding.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedBuilding.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary">{amenity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedBuilding?.photos && selectedBuilding.photos.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Building Photos</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {selectedBuilding.photos.map((photo, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={photo.url}
                                alt={photo.name}
                                className="w-full h-32 object-cover rounded-lg border border-gray-300 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(photo.url, '_blank')}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 rounded-b-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="truncate">{photo.name}</div>
                                <div>{(photo.size / 1024 / 1024).toFixed(2)} MB</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
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
                          Building Name *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter building name"
                          className={formErrors.name ? "border-red-300" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <Input
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          placeholder="Enter city"
                          className={formErrors.city ? "border-red-300" : ""}
                        />
                        {formErrors.city && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.city}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address *
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter complete address"
                        rows={3}
                        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.address ? "border-red-300" : "border-gray-300"}`}
                      />
                      {formErrors.address && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.address}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <Input
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          placeholder="Enter state"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Country
                        </label>
                        <Input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="Enter country"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <Input
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          placeholder="Enter pincode"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Total Floors
                        </label>
                        <Input
                          type="number"
                          value={formData.totalFloors}
                          onChange={(e) => setFormData({ ...formData, totalFloors: e.target.value })}
                          placeholder="Enter number of floors"
                          min="1"
                          className={formErrors.totalFloors ? "border-red-300" : ""}
                        />
                        {formErrors.totalFloors && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.totalFloors}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pricing (₹)
                        </label>
                        <Input
                          type="number"
                          value={formData.pricing}
                          onChange={(e) => setFormData({ ...formData, pricing: e.target.value })}
                          placeholder="Enter pricing"
                          min="0"
                          className={formErrors.pricing ? "border-red-300" : ""}
                        />
                        {formErrors.pricing && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.pricing}</p>
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
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {commonAmenities.map((amenity) => (
                          <label key={amenity} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={formData.amenities.includes(amenity)}
                              onChange={() => handleAmenityChange(amenity)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Building Photos
                      </label>
                      <div className="space-y-4">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <label htmlFor="photo-upload" className="cursor-pointer">
                            <div className="text-gray-600">
                              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <div className="mt-2">
                                <span className="text-blue-600 font-medium">Click to upload</span> or drag and drop
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                PNG, JPG, GIF up to 10MB each (Max 10 photos)
                              </div>
                            </div>
                          </label>
                        </div>

                        {formData.photos.length > 0 && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {formData.photos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img
                                  src={photo.preview}
                                  alt={photo.name}
                                  className="w-full h-24 object-cover rounded-lg border border-gray-300"
                                />
                                <button
                                  type="button"
                                  onClick={() => removePhoto(index)}
                                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                >
                                  ×
                                </button>
                                <div className="text-xs text-gray-500 mt-1 truncate">{photo.name}</div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={handleCloseModal} type="button">
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={submitting}>
                        {submitting ? "Saving..." : modalMode === "create" ? "Create Building" : "Update Building"}
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
                  <Button variant="primary" onClick={() => handleEdit(selectedBuilding)}>
                    Edit Building
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
