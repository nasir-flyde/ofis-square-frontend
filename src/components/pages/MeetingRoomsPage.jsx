import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";
import { Calendar, Users, Clock, MapPin } from "lucide-react";

export function MeetingRoomsPage() {
  const [meetingRooms, setMeetingRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create", "edit", "view"
  const [formData, setFormData] = useState({
    building: "",
    name: "",
    capacity: "",
    amenities: [],
    status: "active",
    pricing: {
      hourlyRate: "",
      dailyRate: ""
    },
    availability: {
      daysOfWeek: [1, 2, 3, 4, 5],
      openTime: "09:00",
      closeTime: "19:00",
      bufferMinutes: "15",
      minBookingMinutes: "30",
      maxBookingMinutes: "480"
    }
  });
  const [bookingData, setBookingData] = useState({
    client: "",
    title: "",
    description: "",
    start: "",
    end: "",
    attendeesCount: "1",
    amenitiesRequested: [],
    notes: ""
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { client: api } = useApi();

  const fetchMeetingRooms = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/meeting-rooms");
      
      if (response.data.success) {
        setMeetingRooms(response.data.data);
        setFilteredRooms(response.data.data);
      } else {
        setError("Failed to fetch meeting rooms");
      }
    } catch (err) {
      console.error("Error fetching meeting rooms:", err);
      setError(err.response?.data?.message || "Failed to fetch meeting rooms");
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
    fetchMeetingRooms();
    fetchBuildings();
    fetchClients();
  }, []);

  useEffect(() => {
    const filtered = meetingRooms.filter(room =>
      (room.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.building?.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (room.amenities || []).some(amenity => 
        amenity.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredRooms(filtered);
  }, [searchTerm, meetingRooms]);

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
      building: "",
      name: "",
      capacity: "",
      amenities: [],
      status: "active",
      pricing: {
        hourlyRate: "",
        dailyRate: ""
      },
      availability: {
        daysOfWeek: [1, 2, 3, 4, 5],
        openTime: "09:00",
        closeTime: "19:00",
        bufferMinutes: "15",
        minBookingMinutes: "30",
        maxBookingMinutes: "480"
      }
    });
    setFormErrors({});
  };

  const resetBookingForm = () => {
    setBookingData({
      client: "",
      title: "",
      description: "",
      start: "",
      end: "",
      attendeesCount: "1",
      amenitiesRequested: [],
      notes: ""
    });
    setFormErrors({});
  };

  const handleCreate = () => {
    resetForm();
    setModalMode("create");
    setSelectedRoom(null);
    setShowModal(true);
  };

  const handleEdit = (room) => {
    setFormData({
      building: room.building?._id || room.building || "",
      name: room.name || "",
      capacity: room.capacity || "",
      amenities: room.amenities || [],
      status: room.status || "active",
      pricing: {
        hourlyRate: room.pricing?.hourlyRate || "",
        dailyRate: room.pricing?.dailyRate || ""
      },
      availability: {
        daysOfWeek: room.availability?.daysOfWeek || [1, 2, 3, 4, 5],
        openTime: room.availability?.openTime || "09:00",
        closeTime: room.availability?.closeTime || "19:00",
        bufferMinutes: room.availability?.bufferMinutes || "15",
        minBookingMinutes: room.availability?.minBookingMinutes || "30",
        maxBookingMinutes: room.availability?.maxBookingMinutes || "480"
      }
    });
    setSelectedRoom(room);
    setModalMode("edit");
    setShowModal(true);
  };

  const handleView = (room) => {
    setSelectedRoom(room);
    setModalMode("view");
    setShowModal(true);
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    resetBookingForm();
    setShowBookingModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedRoom(null);
    resetForm();
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    resetBookingForm();
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.building) {
      errors.building = "Building is required";
    }
    
    if (!formData.name.trim()) {
      errors.name = "Room name is required";
    }
    
    if (!formData.capacity || isNaN(formData.capacity) || formData.capacity < 1) {
      errors.capacity = "Capacity must be a positive number";
    }

    if (formData.pricing.hourlyRate && (isNaN(formData.pricing.hourlyRate) || formData.pricing.hourlyRate < 0)) {
      errors.hourlyRate = "Hourly rate must be a positive number";
    }

    if (formData.pricing.dailyRate && (isNaN(formData.pricing.dailyRate) || formData.pricing.dailyRate < 0)) {
      errors.dailyRate = "Daily rate must be a positive number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateBookingForm = () => {
    const errors = {};
    
    if (!bookingData.client) {
      errors.client = "Client is required";
    }
    
    if (!bookingData.title.trim()) {
      errors.title = "Meeting title is required";
    }
    
    if (!bookingData.start) {
      errors.start = "Start time is required";
    }
    
    if (!bookingData.end) {
      errors.end = "End time is required";
    }

    if (bookingData.start && bookingData.end && new Date(bookingData.start) >= new Date(bookingData.end)) {
      errors.end = "End time must be after start time";
    }

    if (!bookingData.attendeesCount || isNaN(bookingData.attendeesCount) || bookingData.attendeesCount < 1) {
      errors.attendeesCount = "Attendees count must be a positive number";
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
        capacity: parseInt(formData.capacity),
        pricing: {
          hourlyRate: formData.pricing.hourlyRate ? parseFloat(formData.pricing.hourlyRate) : undefined,
          dailyRate: formData.pricing.dailyRate ? parseFloat(formData.pricing.dailyRate) : undefined
        },
        availability: {
          ...formData.availability,
          bufferMinutes: parseInt(formData.availability.bufferMinutes),
          minBookingMinutes: parseInt(formData.availability.minBookingMinutes),
          maxBookingMinutes: parseInt(formData.availability.maxBookingMinutes)
        }
      };

      let response;
      if (modalMode === "create") {
        response = await api.post("/api/meeting-rooms", payload);
      } else {
        response = await api.patch(`/api/meeting-rooms/${selectedRoom._id}`, payload);
      }

      if (response.data.success) {
        await fetchMeetingRooms();
        handleCloseModal();
      } else {
        setError(response.data.message || "Operation failed");
      }
    } catch (err) {
      console.error("Error submitting form:", err);
      setError(err.response?.data?.message || "Failed to save meeting room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateBookingForm()) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        room: selectedRoom._id,
        client: bookingData.client,
        title: bookingData.title,
        description: bookingData.description,
        start: bookingData.start,
        end: bookingData.end,
        attendeesCount: parseInt(bookingData.attendeesCount),
        amenitiesRequested: bookingData.amenitiesRequested,
        notes: bookingData.notes,
        paymentMethod: "cash" // Default payment method
      };

      const response = await api.post("/api/meeting-bookings", payload);

      if (response.data.success) {
        handleCloseBookingModal();
        alert("Meeting room booked successfully!");
      } else {
        setError(response.data.message || "Booking failed");
      }
    } catch (err) {
      console.error("Error booking room:", err);
      setError(err.response?.data?.message || "Failed to book meeting room");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (room) => {
    if (!window.confirm(`Are you sure you want to delete "${room.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.delete(`/api/meeting-rooms/${room._id}`);
      
      if (response.data.success) {
        await fetchMeetingRooms();
      } else {
        setError(response.data.message || "Failed to delete meeting room");
      }
    } catch (err) {
      console.error("Error deleting meeting room:", err);
      setError(err.response?.data?.message || "Failed to delete meeting room");
    }
  };

  const handleAmenityChange = (amenity) => {
    const currentAmenities = formData.amenities || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setFormData({ ...formData, amenities: updatedAmenities });
  };

  const handleBookingAmenityChange = (amenity) => {
    const currentAmenities = bookingData.amenitiesRequested || [];
    const updatedAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity];
    
    setBookingData({ ...bookingData, amenitiesRequested: updatedAmenities });
  };

  const handleDayChange = (day) => {
    const currentDays = formData.availability.daysOfWeek || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    setFormData({ 
      ...formData, 
      availability: { ...formData.availability, daysOfWeek: updatedDays }
    });
  };

  const commonAmenities = [
    "Projector", "Whiteboard", "Video Conferencing", "WiFi", 
    "Air Conditioning", "Coffee Machine", "Flipchart", "Microphone", 
    "Sound System", "TV Screen"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
          <h1 className="text-2xl font-bold text-gray-900">Meeting Rooms</h1>
          <p className="text-gray-600 mt-1">Manage your meeting rooms and bookings</p>
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
                {meetingRooms.filter(r => r.status === 'active').length}
              </div>
              <div className="text-gray-600">Active Rooms</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {meetingRooms.filter(r => r.status === 'inactive').length}
              </div>
              <div className="text-gray-600">Inactive Rooms</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {meetingRooms.reduce((sum, r) => sum + (r.capacity || 0), 0)}
              </div>
              <div className="text-gray-600">Total Capacity</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {meetingRooms.length}
              </div>
              <div className="text-gray-600">Total Rooms</div>
            </div>
          </Card>
        </div>

        {/* Search and Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Search meeting rooms..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={handleCreate}>
            Add New Meeting Room
          </Button>
        </div>

        {/* Meeting Rooms Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Room
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Building
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Capacity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pricing
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
                {filteredRooms.map((room) => (
                  <tr key={room._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{room.name}</div>
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <Users size={14} className="mr-1" />
                          {room.capacity} people
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin size={14} className="mr-1 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {room.building?.name || "N/A"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {room.capacity || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        {room.pricing?.hourlyRate ? `₹${room.pricing.hourlyRate}/hr` : "N/A"}
                        {room.pricing?.dailyRate && (
                          <div className="text-xs text-gray-500">
                            ₹{room.pricing.dailyRate}/day
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(room.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleBookRoom(room)}
                        className="mr-2"
                      >
                        Book Room
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleView(room)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(room)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(room)}
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

        {/* Meeting Room Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    {modalMode === "create" ? "Add New Meeting Room" : 
                     modalMode === "edit" ? "Edit Meeting Room" : "Meeting Room Details"}
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
                            <label className="text-sm font-medium text-gray-500">Room Name</label>
                            <p className="text-gray-900">{selectedRoom?.name}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Building</label>
                            <p className="text-gray-900">{selectedRoom?.building?.name || "N/A"}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Capacity</label>
                            <p className="text-gray-900">{selectedRoom?.capacity} people</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Status</label>
                            <div className="mt-1">{getStatusBadge(selectedRoom?.status)}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Availability</h3>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Hourly Rate</label>
                            <p className="text-gray-900">
                              {selectedRoom?.pricing?.hourlyRate ? `₹${selectedRoom.pricing.hourlyRate}` : "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Daily Rate</label>
                            <p className="text-gray-900">
                              {selectedRoom?.pricing?.dailyRate ? `₹${selectedRoom.pricing.dailyRate}` : "N/A"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Operating Hours</label>
                            <p className="text-gray-900">
                              {selectedRoom?.availability?.openTime || "09:00"} - {selectedRoom?.availability?.closeTime || "19:00"}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-500">Available Days</label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(selectedRoom?.availability?.daysOfWeek || [1,2,3,4,5]).map(day => (
                                <Badge key={day} variant="secondary">{dayNames[day]}</Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedRoom.amenities.map((amenity, index) => (
                            <Badge key={index} variant="secondary">{amenity}</Badge>
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
                          Building *
                        </label>
                        <select
                          value={formData.building}
                          onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.building ? "border-red-300" : "border-gray-300"}`}
                        >
                          <option value="">Select Building</option>
                          {buildings.map((building) => (
                            <option key={building._id} value={building._id}>
                              {building.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.building && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.building}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Room Name *
                        </label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter room name"
                          className={formErrors.name ? "border-red-300" : ""}
                        />
                        {formErrors.name && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.name}</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Capacity *
                        </label>
                        <Input
                          type="number"
                          value={formData.capacity}
                          onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                          placeholder="Number of people"
                          min="1"
                          className={formErrors.capacity ? "border-red-300" : ""}
                        />
                        {formErrors.capacity && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.capacity}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Hourly Rate (₹)
                        </label>
                        <Input
                          type="number"
                          value={formData.pricing.hourlyRate}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            pricing: { ...formData.pricing, hourlyRate: e.target.value }
                          })}
                          placeholder="Rate per hour"
                          min="0"
                          className={formErrors.hourlyRate ? "border-red-300" : ""}
                        />
                        {formErrors.hourlyRate && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.hourlyRate}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Daily Rate (₹)
                        </label>
                        <Input
                          type="number"
                          value={formData.pricing.dailyRate}
                          onChange={(e) => setFormData({ 
                            ...formData, 
                            pricing: { ...formData.pricing, dailyRate: e.target.value }
                          })}
                          placeholder="Rate per day"
                          min="0"
                          className={formErrors.dailyRate ? "border-red-300" : ""}
                        />
                        {formErrors.dailyRate && (
                          <p className="text-sm text-red-600 mt-1">{formErrors.dailyRate}</p>
                        )}
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
                        Availability
                      </label>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-600 mb-2">
                            Available Days
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {dayNames.map((day, index) => (
                              <label key={index} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={formData.availability.daysOfWeek.includes(index)}
                                  onChange={() => handleDayChange(index)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-700">{day}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Open Time
                            </label>
                            <Input
                              type="time"
                              value={formData.availability.openTime}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                availability: { ...formData.availability, openTime: e.target.value }
                              })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Close Time
                            </label>
                            <Input
                              type="time"
                              value={formData.availability.closeTime}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                availability: { ...formData.availability, closeTime: e.target.value }
                              })}
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
                              Buffer (mins)
                            </label>
                            <Input
                              type="number"
                              value={formData.availability.bufferMinutes}
                              onChange={(e) => setFormData({ 
                                ...formData, 
                                availability: { ...formData.availability, bufferMinutes: e.target.value }
                              })}
                              min="0"
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">
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
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <Button variant="outline" onClick={handleCloseModal} type="button">
                        Cancel
                      </Button>
                      <Button variant="primary" type="submit" loading={submitting}>
                        {submitting ? "Saving..." : modalMode === "create" ? "Create Room" : "Update Room"}
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
                  <Button variant="primary" onClick={() => handleEdit(selectedRoom)}>
                    Edit Room
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Booking Modal */}
        {showBookingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">
                    Book Meeting Room: {selectedRoom?.name}
                  </h2>
                  <button
                    onClick={handleCloseBookingModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <form onSubmit={handleBookingSubmit} className="space-y-6">
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Client *
                    </label>
                    <select
                      value={bookingData.client}
                      onChange={(e) => setBookingData({ ...bookingData, client: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.client ? "border-red-300" : "border-gray-300"}`}
                    >
                      <option value="">Select Client</option>
                      {clients.map((client) => (
                        <option key={client._id} value={client._id}>
                          {client.companyName} - {client.contactPerson}
                        </option>
                      ))}
                    </select>
                    {formErrors.client && (
                      <p className="text-sm text-red-600 mt-1">{formErrors.client}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Meeting Title *
                      </label>
                      <Input
                        value={bookingData.title}
                        onChange={(e) => setBookingData({ ...bookingData, title: e.target.value })}
                        placeholder="Enter meeting title"
                        className={formErrors.title ? "border-red-300" : ""}
                      />
                      {formErrors.title && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.title}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Attendees Count *
                      </label>
                      <Input
                        type="number"
                        value={bookingData.attendeesCount}
                        onChange={(e) => setBookingData({ ...bookingData, attendeesCount: e.target.value })}
                        placeholder="Number of attendees"
                        min="1"
                        max={selectedRoom?.capacity}
                        className={formErrors.attendeesCount ? "border-red-300" : ""}
                      />
                      {formErrors.attendeesCount && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.attendeesCount}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Time *
                      </label>
                      <Input
                        type="datetime-local"
                        value={bookingData.start}
                        onChange={(e) => setBookingData({ ...bookingData, start: e.target.value })}
                        className={formErrors.start ? "border-red-300" : ""}
                      />
                      {formErrors.start && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.start}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Time *
                      </label>
                      <Input
                        type="datetime-local"
                        value={bookingData.end}
                        onChange={(e) => setBookingData({ ...bookingData, end: e.target.value })}
                        className={formErrors.end ? "border-red-300" : ""}
                      />
                      {formErrors.end && (
                        <p className="text-sm text-red-600 mt-1">{formErrors.end}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      value={bookingData.description}
                      onChange={(e) => setBookingData({ ...bookingData, description: e.target.value })}
                      placeholder="Meeting description (optional)"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {selectedRoom?.amenities && selectedRoom.amenities.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Required Amenities
                      </label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedRoom.amenities.map((amenity) => (
                          <label key={amenity} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={bookingData.amenitiesRequested.includes(amenity)}
                              onChange={() => handleBookingAmenityChange(amenity)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">{amenity}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={bookingData.notes}
                      onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                      placeholder="Additional notes (optional)"
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button variant="outline" onClick={handleCloseBookingModal} type="button">
                      Cancel
                    </Button>
                    <Button variant="primary" type="submit" loading={submitting}>
                      {submitting ? "Booking..." : "Book Meeting Room"}
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
