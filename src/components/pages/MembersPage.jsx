import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function MembersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [members, setMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [clients, setClients] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientFromUrl, setClientFromUrl] = useState(null);
  
  // Add Member Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState("");
  const [addForm, setAddForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    role: "",
    client: "",
    status: "active"
  });

  // Edit Member Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    companyName: "",
    role: "",
    client: "",
    status: "active"
  });
  // Linked user + roles state
  const [linkedUser, setLinkedUser] = useState(null); // fetched from /api/users/:id
  const [roles, setRoles] = useState([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const [userRoleId, setUserRoleId] = useState("");
  const [originalUserRoleId, setOriginalUserRoleId] = useState("");
  const [userRoleUpdating, setUserRoleUpdating] = useState(false);

  const { client: api } = useApi();

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/api/members");
      
      if (response.data.success) {
        setMembers(response.data.data);
        setFilteredMembers(response.data.data);
      } else {
        setError("Failed to fetch members");
      }
    } catch (err) {
      console.error("Error fetching members:", err);
      setError(err.response?.data?.error || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }, [api]);

  const fetchClients = useCallback(async () => {
    try {
      const response = await api.get("/api/clients");
      if (response.data.success) {
        setClients(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  }, [api]);

  useEffect(() => {
    fetchMembers();
    fetchClients();
  }, [fetchMembers, fetchClients]);

  // Handle URL parameters for client filtering
  useEffect(() => {
    const clientId = searchParams.get('client');
    if (clientId) {
      setSelectedClient(clientId);
      setClientFromUrl(clientId);
    }
  }, [searchParams]);

  // Find client name for display when filtered by URL
  const getFilteredClientName = () => {
    if (clientFromUrl) {
      const client = clients.find(c => c._id === clientFromUrl);
      return client ? (client.companyName || client.contactPerson) : 'Unknown Client';
    }
    return null;
  };

  // Filter members based on search term, client, and status
  useEffect(() => {
    let filtered = members;

    if (searchTerm) {
      filtered = filtered.filter(member =>
        `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.email || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (member.phone || "").includes(searchTerm) ||
        (member.role || "").toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedClient) {
      filtered = filtered.filter(member => member.client?._id === selectedClient);
    }

    if (selectedStatus) {
      filtered = filtered.filter(member => member.status === selectedStatus);
    }

    setFilteredMembers(filtered);
  }, [searchTerm, selectedClient, selectedStatus, members]);

  // Add Member Functions
  const openAddModal = () => {
    setAddForm({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      companyName: "",
      role: "",
      client: "",
      status: "active"
    });
    setAddError("");
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setAddError("");
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError("");
    setAddSubmitting(true);

    try {
      const response = await api.post("/api/members", addForm);
      
      if (response.data.success) {
        await fetchMembers();
        closeAddModal();
      } else {
        setAddError(response.data.message || "Failed to create member");
      }
    } catch (err) {
      console.error("Error creating member:", err);
      setAddError(err.response?.data?.message || "Failed to create member");
    } finally {
      setAddSubmitting(false);
    }
  };

  // Edit Member Functions
  const openEditModal = (member) => {
    setSelectedMember(member);
    setEditForm({
      firstName: member.firstName || "",
      lastName: member.lastName || "",
      email: member.email || "",
      phone: member.phone || "",
      companyName: member.companyName || "",
      role: member.role || "",
      client: member.client?._id || "",
      status: member.status || "active"
    });
    setEditError("");
    setLinkedUser(null);
    setUserRoleId("");
    setOriginalUserRoleId("");
    setShowEditModal(true);
    // If member has a linked user, fetch it and roles list
    if (member.user) {
      fetchUserAndRoles(member.user);
    } else {
      // Still load roles so dropdown can be shown/disabled state if needed
      fetchRoles();
    }
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditError("");
    setSelectedMember(null);
  };

  const handleEditMember = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditSubmitting(true);

    try {
      // 1) Update member
      const response = await api.put(`/api/members/${selectedMember._id}`, editForm);
      
      if (response.data.success) {
        // 2) If linked user exists and role changed, update user role
        if (linkedUser && userRoleId && originalUserRoleId && userRoleId !== originalUserRoleId) {
          try {
            setUserRoleUpdating(true);
            const userUpdateResp = await api.put(`/api/users/${linkedUser._id}`, { role: userRoleId });
            if (!userUpdateResp?.data?.success) {
              console.warn("User role update failed:", userUpdateResp?.data);
            }
          } catch (uErr) {
            console.warn("User role update error:", uErr);
          } finally {
            setUserRoleUpdating(false);
          }
        }

        await fetchMembers(); // refresh list
        closeEditModal(); // close modal
      } else {
        setEditError(response.data.message || "Failed to update member");
      }
    } catch (err) {
      console.error("Error updating member:", err);
      setEditError(err.response?.data?.message || "Failed to update member");
    } finally {
      setEditSubmitting(false);
    }
  };

  // Helpers to fetch roles and user
  const fetchRoles = useCallback(async () => {
    try {
      setRolesLoading(true);
      // roleController.getRoles returns array
      const resp = await api.get("/api/roles");
      setRoles(Array.isArray(resp?.data) ? resp.data : (resp?.data?.roles || []));
    } catch (err) {
      console.warn("Failed to load roles", err);
      setRoles([]);
    } finally {
      setRolesLoading(false);
    }
  }, [api]);

  const fetchUserAndRoles = useCallback(async (userId) => {
    try {
      // Fetch roles in parallel with user
      setRolesLoading(true);
      const [userResp, rolesResp] = await Promise.all([
        api.get(`/api/users/${userId}`),
        api.get("/api/roles"),
      ]);
      const usr = userResp?.data?.data || null;
      setLinkedUser(usr);
      const rls = Array.isArray(rolesResp?.data) ? rolesResp.data : (rolesResp?.data?.roles || []);
      setRoles(rls);
      const currentRoleId = usr?.role?._id || usr?.role || "";
      setUserRoleId(currentRoleId);
      setOriginalUserRoleId(currentRoleId);
    } catch (err) {
      console.warn("Failed to load user or roles", err);
      // Try to still load roles if user fetch failed
      try {
        if (!roles.length) {
          const rolesOnly = await api.get("/api/roles");
          setRoles(Array.isArray(rolesOnly?.data) ? rolesOnly.data : (rolesOnly?.data?.roles || []));
        }
      } catch {}
    } finally {
      setRolesLoading(false);
    }
  }, [api, roles.length]);

  // Delete Member Function
  const handleDeleteMember = async (memberId) => {
    if (!window.confirm("Are you sure you want to delete this member?")) {
      return;
    }

    try {
      const response = await api.delete(`/api/members/${memberId}`);
      
      if (response.data.success) {
        await fetchMembers();
      } else {
        alert("Failed to delete member");
      }
    } catch (err) {
      console.error("Error deleting member:", err);
      alert("Failed to delete member");
    }
  };

  const getStatusBadge = (status) => {
    return (
      <Badge variant={status === "active" ? "success" : "secondary"}>
        {status === "active" ? "Active" : "Inactive"}
      </Badge>
    );
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

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Members</h1>
            <p className="text-gray-600 mt-1">Manage team members and their roles</p>
          </div>
          <Card>
            <div className="p-6 text-center">
              <div className="text-red-600 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Members</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchMembers} variant="primary">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Members</h1>
              <p className="text-gray-600 mt-1">
                {clientFromUrl ? `Members for ${getFilteredClientName()}` : 'Manage team members and their roles'}
              </p>
            </div>
            {clientFromUrl && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedClient("");
                  setClientFromUrl(null);
                  setSearchParams({});
                }}
              >
                Clear Filter
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {members.length}
              </div>
              <div className="text-gray-600">Total Members</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {members.filter(m => m.status === 'active').length}
              </div>
              <div className="text-gray-600">Active Members</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-gray-600 mb-2">
                {members.filter(m => m.status === 'inactive').length}
              </div>
              <div className="text-gray-600">Inactive Members</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                {new Set(members.map(m => m.client?._id).filter(Boolean)).size}
              </div>
              <div className="text-gray-600">Unique Clients</div>
            </div>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={selectedClient}
              onChange={(e) => {
                setSelectedClient(e.target.value);
                if (e.target.value) {
                  setSearchParams({ client: e.target.value });
                } else {
                  setSearchParams({});
                  setClientFromUrl(null);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client._id} value={client._id}>
                  {client.companyName || client.contactPerson}
                </option>
              ))}
            </select>
          </div>
          <div className="w-full md:w-32">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button variant="primary" onClick={openAddModal}>
            Add Member
          </Button>
        </div>

        {/* Members Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {`${member.firstName} ${member.lastName || ''}`.trim()}
                        </div>
                        <div className="text-sm text-gray-500">{member.companyName || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{member.email || "N/A"}</div>
                        <div className="text-sm text-gray-500">{member.phone || "N/A"}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {member.client?.companyName || member.client?.contactPerson || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{member.role || "N/A"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(member.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(member.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex gap-2 justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(member)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteMember(member._id)}
                        >
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

        {/* Add Member Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Add Member</h2>
                  <button onClick={closeAddModal} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
              </div>
              <div className="p-6">
                {addError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">{addError}</p>
                  </div>
                )}
                <form onSubmit={handleAddMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <Input
                        value={addForm.firstName}
                        onChange={(e) => setAddForm({ ...addForm, firstName: e.target.value })}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <Input
                        value={addForm.lastName}
                        onChange={(e) => setAddForm({ ...addForm, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        value={addForm.email}
                        onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        value={addForm.phone}
                        onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <select
                      value={addForm.client}
                      onChange={(e) => setAddForm({ ...addForm, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a client...</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.companyName || client.contactPerson}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <Input
                        value={addForm.companyName}
                        onChange={(e) => setAddForm({ ...addForm, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <Input
                        value={addForm.role}
                        onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                        placeholder="e.g., Manager, Developer, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={addForm.status}
                      onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" type="button" onClick={closeAddModal}>Cancel</Button>
                    <Button variant="primary" type="submit" loading={addSubmitting}>
                      {addSubmitting ? "Adding..." : "Add Member"}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Member Modal */}
        {showEditModal && selectedMember && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg max-w-xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900">Edit Member</h2>
                  <button onClick={closeEditModal} className="text-gray-400 hover:text-gray-600">✕</button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Member: <span className="font-medium">{`${selectedMember.firstName} ${selectedMember.lastName || ''}`.trim()}</span>
                </p>
              </div>
              <div className="p-6">
                {editError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <p className="text-sm text-red-600">{editError}</p>
                  </div>
                )}
                <form onSubmit={handleEditMember} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <Input
                        value={editForm.firstName}
                        onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <Input
                        value={editForm.lastName}
                        onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                        placeholder="Enter last name"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <Input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <Input
                        value={editForm.phone}
                        onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <select
                      value={editForm.client}
                      onChange={(e) => setEditForm({ ...editForm, client: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a client...</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.companyName || client.contactPerson}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
                      <Input
                        value={editForm.companyName}
                        onChange={(e) => setEditForm({ ...editForm, companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <Input
                        value={editForm.role}
                        onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                        placeholder="e.g., Manager, Developer, etc."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Linked User and Role (from Users table) */}
                  <div className="border-t border-gray-200 pt-4">
                    <h4 className="text-md font-semibold text-gray-900 mb-2">Linked User</h4>
                    {selectedMember?.user ? (
                      <div className="space-y-3">
                        {linkedUser ? (
                          <div className="bg-gray-50 rounded-md p-3">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div>
                                <div className="text-gray-500">Name</div>
                                <div className="text-gray-900">{linkedUser.name}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Email</div>
                                <div className="text-gray-900">{linkedUser.email}</div>
                              </div>
                              <div>
                                <div className="text-gray-500">Phone</div>
                                <div className="text-gray-900">{linkedUser.phone}</div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {rolesLoading ? "Loading user & roles..." : "No user details loaded"}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">User Role</label>
                          <select
                            value={userRoleId}
                            onChange={(e) => setUserRoleId(e.target.value)}
                            disabled={!linkedUser || rolesLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="">Select role...</option>
                            {roles.map(r => (
                              <option key={r._id} value={r._id}>{r.roleName}</option>
                            ))}
                          </select>
                          {linkedUser && originalUserRoleId && userRoleId !== originalUserRoleId && (
                            <p className="text-xs text-yellow-700 mt-1">Role will be updated on save.</p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600">No linked system user for this member.</div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" type="button" onClick={closeEditModal}>Cancel</Button>
                    <Button variant="primary" type="submit" loading={editSubmitting || userRoleUpdating}>
                      {editSubmitting || userRoleUpdating ? "Updating..." : "Update Member"}
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
