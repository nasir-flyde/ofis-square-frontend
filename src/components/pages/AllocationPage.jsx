import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function AllocationPage() {
  const navigate = useNavigate();
  const { client: api } = useApi();
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const initializeAllocation = async () => {
      setLoading(true);
      setError("");
      
      try {
        // Get building information from contract phase
        const buildingId = localStorage.getItem('ofis_selected_building_id');
        const buildingData = localStorage.getItem('ofis_selected_building');
        
        if (!buildingId || !buildingData) {
          setError("No building selected in contract phase. Please go back to contract.");
          return;
        }
        
        const building = JSON.parse(buildingData);
        setSelectedBuilding(building);
        
        // Fetch available cabins for the selected building
        const { data } = await api.get(`/api/cabins/building/${buildingId}/available`);
        setCabins(data.data?.cabins || []);
        
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load cabins for selected building");
        setCabins([]);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAllocation();
  }, [api]);

  const handleCabinSelect = (cabin) => {
    setSelectedCabin(cabin);
  };

  const handleConfirmAllocation = () => {
    if (!selectedCabin) return;
    allocateSelectedCabin();
  };

  const allocateSelectedCabin = async () => {
    try {
      const clientId = localStorage.getItem("ofis_current_client_id");
      if (!clientId) {
        alert("Missing client ID. Please complete Company Details first.");
        navigate("/details");
        return;
      }
      const cabinId = selectedCabin._id || selectedCabin.id;
      await api.post("/api/cabins/allocate", { clientId, cabinId });
      alert("Cabin allocated successfully.");
      navigate("/record-payment");
    } catch (e) {
      alert(e.response?.data?.message || "Failed to allocate cabin");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Auth</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Details</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">KYC</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Contract</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                5
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Allocation</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cabin Allocation</CardTitle>
            <CardDescription>
              Select your preferred cabin from the available options below.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Selected Building Display */}
            {selectedBuilding && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-blue-900 mb-2">Selected Building from Contract</h3>
                <div className="text-sm text-blue-800">
                  <p><strong>{selectedBuilding.name}</strong></p>
                  <p>{selectedBuilding.address}, {selectedBuilding.city}</p>
                  {selectedBuilding.pricing && (
                    <p>Pricing: ₹{selectedBuilding.pricing}/seat/month</p>
                  )}
                </div>
              </div>
            )}

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading available cabins...</p>
              </div>
            ) : error ? (
              <div className="text-center py-10">
                <div className="text-red-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{error}</p>
                <Button 
                  variant="secondary" 
                  className="mt-4"
                  onClick={() => navigate("/contract")}
                >
                  Go Back to Contract
                </Button>
              </div>
            ) : cabins.length === 0 ? (
              <div className="text-center py-10">
                <div className="text-gray-400 mb-4">
                  <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-600">No available cabins in {selectedBuilding?.name}</p>
                <p className="text-sm text-gray-500 mt-1">Please contact support for assistance</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Available Cabins in {selectedBuilding?.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {cabins.map((cabin) => (
                      <div
                        key={cabin._id || cabin.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-all ${
                          (selectedCabin?._id === cabin._id || selectedCabin?.id === cabin.id)
                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                            : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                        }`}
                        onClick={() => handleCabinSelect(cabin)}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="font-semibold text-gray-900">{cabin.name || cabin.number}</h3>
                          <Badge variant="success">
                            Available
                          </Badge>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Capacity: {cabin.capacity || cabin.desks?.length || 0} people
                          </div>
                          <div className="flex items-center">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                            Floor {cabin.floor ?? "-"}
                          </div>
                          <div className="flex items-center font-semibold text-gray-900">
                            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            {cabin.price ? `₹${Number(cabin.price).toLocaleString()}/month` : "Contact for pricing"}
                          </div>
                        </div>
                        
                        {(selectedCabin?._id === cabin._id || selectedCabin?.id === cabin.id) && (
                          <div className="mt-3 p-2 bg-blue-100 rounded text-sm text-blue-800">
                            ✓ Selected
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
              </div>
            )}

            {selectedCabin && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-medium text-green-900 mb-2">Selected Cabin Details</h4>
                <div className="text-sm text-green-800">
                  <p><strong>{selectedCabin.name || selectedCabin.number}</strong> - Floor {selectedCabin.floor ?? "-"}</p>
                  <p>Capacity: {selectedCabin.capacity || selectedCabin.desks?.length || 0} people</p>
                  {selectedCabin.price && (
                    <p>Monthly Rent: ₹{Number(selectedCabin.price).toLocaleString()}</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/contract")}
              >
                Back
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmAllocation}
                disabled={!selectedCabin}
              >
                Confirm Allocation
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
