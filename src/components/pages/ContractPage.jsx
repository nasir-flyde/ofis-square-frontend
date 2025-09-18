import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { Input, Select, Textarea } from "../ui/Input";
import { useApi } from "../../hooks/useApi";

export function ContractPage() {
  const navigate = useNavigate();
  const { client: api } = useApi();
  const [contractStatus, setContractStatus] = useState("form"); // form, pending, sent, signed, declined
  const [formData, setFormData] = useState({
    buildingId: "",
    capacity: "",
    monthlyRent: "",
    initialCredits: "",
    contractStartDate: "",
    contractEndDate: "",
    terms: ""
  });
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [loadingBuildings, setLoadingBuildings] = useState(true);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isMonthlyRentDirty, setIsMonthlyRentDirty] = useState(false);

  // Fetch buildings on component mount
  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const { data } = await api.get("/api/buildings?status=active");
        setBuildings(data.data || []);
      } catch (error) {
        console.error("Failed to fetch buildings:", error);
        setErrors(prev => ({ ...prev, general: "Failed to load buildings" }));
      } finally {
        setLoadingBuildings(false);
      }
    };
    fetchBuildings();
  }, [api]);

  // Calculate monthly rent when building or capacity changes (only if user hasn't overridden)
  useEffect(() => {
    if (isMonthlyRentDirty) return;
    if (selectedBuilding && formData.capacity) {
      const capacity = parseInt(formData.capacity);
      if (capacity > 0 && selectedBuilding.pricing != null) {
        const calculatedRent = selectedBuilding.pricing * capacity;
        setFormData(prev => ({ ...prev, monthlyRent: calculatedRent.toString() }));
      } else {
        setFormData(prev => ({ ...prev, monthlyRent: "" }));
      }
    } else {
      setFormData(prev => ({ ...prev, monthlyRent: "" }));
    }
  }, [selectedBuilding, formData.capacity]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleBuildingChange = (e) => {
    const buildingId = e.target.value;
    const building = buildings.find(b => b._id === buildingId);
    setSelectedBuilding(building);
    setFormData(prev => ({ ...prev, buildingId }));
    setIsMonthlyRentDirty(false); // switch back to auto when building changes
    if (errors.buildingId) {
      setErrors(prev => ({ ...prev, buildingId: "" }));
    }
  };

  const handleMonthlyRentChange = (e) => {
    setIsMonthlyRentDirty(true);
    const val = e.target.value;
    setFormData(prev => ({ ...prev, monthlyRent: val }));
    if (errors.monthlyRent) setErrors(prev => ({ ...prev, monthlyRent: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.buildingId) {
      newErrors.buildingId = "Building selection is required";
    }
    
    if (!formData.capacity.trim() || parseInt(formData.capacity) <= 0) {
      newErrors.capacity = "Capacity must be a positive number";
    }
    
    if (!selectedBuilding?.pricing && selectedBuilding?.pricing !== 0) {
      newErrors.buildingId = "Selected building has no pricing configured";
    }
    
    // Security deposit removed from contracts
    
    if (!formData.contractStartDate.trim()) {
      newErrors.contractStartDate = "Contract start date is required";
    }
    
    if (!formData.contractEndDate.trim()) {
      newErrors.contractEndDate = "Contract end date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Get the client ID saved after Details submission
      const clientId = localStorage.getItem('ofis_current_client_id');
      if (!clientId) {
        setErrors({ general: "Missing client ID. Please complete Company Details first." });
        setLoading(false);
        return;
      }
      
      // Create contract with form data
      const contractData = {
        clientId,
        buildingId: formData.buildingId,
        capacity: parseInt(formData.capacity),
        contractStartDate: formData.contractStartDate,
        contractEndDate: formData.contractEndDate,
        terms: formData.terms
      };
      if (formData.monthlyRent !== "" && isMonthlyRentDirty) {
        contractData.monthlyRent = parseFloat(formData.monthlyRent);
      }
      if (formData.initialCredits && parseInt(formData.initialCredits) > 0) {
        contractData.initialCredits = parseInt(formData.initialCredits);
      }
      
      const { data } = await api.post("/api/contracts", contractData);
      const contractId = data.contract._id;
      
      // Send contract for digital signature via Zoho Sign
      const signResponse = await api.post(`/api/contracts/${contractId}/send-for-signature`);
      
      if (signResponse.data.zohoSignRequestId) {
        // Contract sent successfully for signature
        setContractStatus("sent");
        
        // Store contract info for tracking
        localStorage.setItem('ofis_contract_id', contractId);
        localStorage.setItem('ofis_zoho_request_id', signResponse.data.zohoSignRequestId);
        
        // Navigate to dashboard after successful contract submission
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        throw new Error("Failed to send contract for signature");
      }
      
    } catch (error) {
      setErrors({ general: error.response?.data?.error || "Failed to process contract. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const handleSendContract = () => {
    setContractStatus("sent");
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Auth</span>
            </div>
            <div className="flex-1 mx-2 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Details</span>
            </div>
            <div className="flex-1 mx-2 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">KYC</span>
            </div>
            <div className="flex-1 mx-2 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                4
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Contract</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Contract Details</CardTitle>
            <CardDescription>
              Please fill in the contract details to generate your service agreement.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {contractStatus === "form" && (
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-600">{errors.general}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Select
                    label="Building"
                    name="buildingId"
                    value={formData.buildingId}
                    onChange={handleBuildingChange}
                    error={errors.buildingId}
                    required
                    disabled={loadingBuildings}
                  >
                    <option value="">
                      {loadingBuildings ? 'Loading buildings...' : 'Select a building'}
                    </option>
                    {buildings.map(building => (
                      <option key={building._id} value={building._id}>
                        {building.name} - {building.address}
                        {building.pricing != null ? ` (₹${building.pricing}/seat)` : ' (No pricing)'}
                      </option>
                    ))}
                  </Select>

                  <Input
                    label="Capacity (Number of Seats)"
                    name="capacity"
                    type="number"
                    value={formData.capacity}
                    onChange={handleChange}
                    error={errors.capacity}
                    placeholder="4"
                    min="1"
                    required
                  />

                  <div>
                    <Input
                      label="Monthly Rent (₹)"
                      name="monthlyRent"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={handleMonthlyRentChange}
                      error={errors.monthlyRent}
                      placeholder={selectedBuilding?.pricing != null && formData.capacity ? `${selectedBuilding.pricing * parseInt(formData.capacity || 0)}` : 'Enter monthly rent'}
                      min="0"
                    />
                    {selectedBuilding && formData.capacity && (
                      <p className="mt-1 text-xs text-gray-600">
                        Auto: ₹{selectedBuilding.pricing || 0} × {formData.capacity} seats = ₹{(selectedBuilding.pricing || 0) * parseInt(formData.capacity || 0)}
                      </p>
                    )}
                  </div>

                  <Input
                    label="Initial Credits"
                    name="initialCredits"
                    type="number"
                    value={formData.initialCredits}
                    onChange={handleChange}
                    error={errors.initialCredits}
                    placeholder="0"
                    min="0"
                  />

                  {formData.initialCredits && parseInt(formData.initialCredits) > 0 && (
                    <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                      <strong>Credit Value:</strong> ₹500 per credit (fixed rate)<br/>
                      <strong>Total Credit Value:</strong> ₹{(parseInt(formData.initialCredits || 0) * 500).toLocaleString()}
                    </div>
                  )}

                  {/* Security deposit field removed */}

                  <Input
                    label="Contract Start Date"
                    name="contractStartDate"
                    type="date"
                    value={formData.contractStartDate}
                    onChange={handleChange}
                    error={errors.contractStartDate}
                    required
                  />

                  <Input
                    label="Contract End Date"
                    name="contractEndDate"
                    type="date"
                    value={formData.contractEndDate}
                    onChange={handleChange}
                    error={errors.contractEndDate}
                    required
                  />
                </div>

                <Textarea
                  label="Additional Terms (Optional)"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  error={errors.terms}
                  placeholder="Any additional terms and conditions..."
                  rows={4}
                />

                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => navigate("/kyc")}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={loading}
                  >
                    {loading ? "Generating Contract..." : "Generate & Download Contract"}
                  </Button>
                </div>
              </form>
            )}

            {contractStatus === "sent" && (
              <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Contract Sent for Digital Signature!</h3>
                <p className="text-gray-600 mb-6">Your contract has been sent via Zoho Sign for digital signature. Please check your email to sign the document.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-600">
                    <strong>Next Steps:</strong><br/>
                    1. Check your email for the Zoho Sign document<br/>
                    2. Sign the contract digitally<br/>
                    3. You'll be redirected to the dashboard shortly
                  </p>
                </div>
                <p className="text-sm text-gray-500">Redirecting to dashboard...</p>
              </div>
            )}

            {contractStatus !== "form" && contractStatus !== "pending" && (
              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/kyc")}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={() => navigate("/allocation")}
                >
                  Continue
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
