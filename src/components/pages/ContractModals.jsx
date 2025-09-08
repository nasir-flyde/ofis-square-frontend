import React from "react";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";

export function ContractModal({ 
  showModal, 
  modalMode, 
  selectedContract, 
  formData, 
  setFormData, 
  formErrors, 
  clients, 
  buildings, 
  error, 
  submitting, 
  onSubmit, 
  onClose 
}) {
  if (!showModal) return null;

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { variant: "secondary", label: "Draft" },
      pending_signature: { variant: "warning", label: "Pending Signature" },
      active: { variant: "success", label: "Active" }
    };
    
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {modalMode === "create" ? "Create New Contract" : 
               modalMode === "edit" ? "Edit Contract" : "Contract Details"}
            </h2>
            <button
              onClick={onClose}
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Client Information</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Company Name</label>
                      <p className="text-gray-900">{selectedContract?.client?.companyName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Contact Person</label>
                      <p className="text-gray-900">{selectedContract?.client?.contactPerson}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Email</label>
                      <p className="text-gray-900">{selectedContract?.client?.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Phone</label>
                      <p className="text-gray-900">{selectedContract?.client?.phone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Contract Details</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Building</label>
                      <p className="text-gray-900">{selectedContract?.building?.name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Capacity</label>
                      <p className="text-gray-900">{selectedContract?.capacity} people</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Monthly Rent</label>
                      <p className="text-gray-900">₹{selectedContract?.monthlyRent?.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Security Deposit</label>
                      <p className="text-gray-900">₹{selectedContract?.securityDeposit?.toLocaleString() || "N/A"}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">Status</label>
                      <div className="mt-1">{getStatusBadge(selectedContract?.status)}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">Start Date</label>
                  <p className="text-gray-900">{new Date(selectedContract?.startDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">End Date</label>
                  <p className="text-gray-900">{new Date(selectedContract?.endDate).toLocaleDateString()}</p>
                </div>
              </div>

              {selectedContract?.initialCredits && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Initial Credits</label>
                    <p className="text-gray-900">{selectedContract.initialCredits}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Credit Value at Signup</label>
                    <p className="text-gray-900">₹{selectedContract?.creditValueAtSignup || "N/A"}</p>
                  </div>
                </div>
              )}

              {selectedContract?.terms && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Terms & Conditions</label>
                  <p className="text-gray-900 mt-1 whitespace-pre-wrap">{selectedContract.terms}</p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client *
                  </label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
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
                    Monthly Rent (₹) *
                  </label>
                  <Input
                    type="number"
                    value={formData.monthlyRent}
                    onChange={(e) => setFormData({ ...formData, monthlyRent: e.target.value })}
                    placeholder="Will be calculated automatically"
                    min="0"
                    className={`${formErrors.monthlyRent ? "border-red-300" : ""} ${formData.monthlyRent ? "bg-blue-50" : ""}`}
                    readOnly={!!formData.monthlyRent}
                  />
                  {formErrors.monthlyRent && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.monthlyRent}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Security Deposit (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.securityDeposit}
                    onChange={(e) => setFormData({ ...formData, securityDeposit: e.target.value })}
                    placeholder="Security deposit amount"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.contractStartDate}
                    onChange={(e) => setFormData({ ...formData, contractStartDate: e.target.value })}
                    className={formErrors.contractStartDate ? "border-red-300" : ""}
                  />
                  {formErrors.contractStartDate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.contractStartDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date *
                  </label>
                  <Input
                    type="date"
                    value={formData.contractEndDate}
                    onChange={(e) => setFormData({ ...formData, contractEndDate: e.target.value })}
                    className={formErrors.contractEndDate ? "border-red-300" : ""}
                  />
                  {formErrors.contractEndDate && (
                    <p className="text-sm text-red-600 mt-1">{formErrors.contractEndDate}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Initial Credits
                  </label>
                  <Input
                    type="number"
                    value={formData.initialCredits}
                    onChange={(e) => setFormData({ ...formData, initialCredits: e.target.value })}
                    placeholder="Initial credits to grant"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Credit Value at Signup (₹)
                  </label>
                  <Input
                    type="number"
                    value={formData.creditValueAtSignup}
                    onChange={(e) => setFormData({ ...formData, creditValueAtSignup: e.target.value })}
                    placeholder="Value per credit"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Terms & Conditions
                </label>
                <textarea
                  value={formData.terms}
                  onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                  placeholder="Enter contract terms and conditions..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : modalMode === "create" ? "Create Contract" : "Update Contract"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
