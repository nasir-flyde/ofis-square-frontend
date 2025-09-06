import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";
import { useApi } from "../../hooks/useApi";

export function AllocationPage() {
  const navigate = useNavigate();
  const { client: api } = useApi("http://localhost:5001");
  const [selectedCabin, setSelectedCabin] = useState(null);
  const [cabins, setCabins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCabins = async () => {
      setLoading(true);
      setError("");
      try {
        // Fetch all cabins; backend returns status for each
        const { data } = await api.get("/api/cabins");
        setCabins(data.data || []);
      } catch (e) {
        setError(e.response?.data?.message || "Failed to load cabins");
      } finally {
        setLoading(false);
      }
    };
    fetchCabins();
  }, [api]);

  const handleCabinSelect = (cabin) => {
    const isOccupied = cabin?.status !== "available";
    if (isOccupied) return;
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

            {loading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading cabins...</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {cabins.map((cabin) => (
                <div
                  key={cabin._id || cabin.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    (cabin.status !== "available")
                      ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                      : (selectedCabin?._id === cabin._id || selectedCabin?.id === cabin.id)
                      ? "border-blue-500 bg-blue-50 ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                  }`}
                  onClick={() => cabin.status === "available" && handleCabinSelect(cabin)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-gray-900">{cabin.name || cabin.number}</h3>
                    <Badge variant={(cabin.status !== "available") ? "secondary" : "success"}>
                      {cabin.status === "available" ? "Available" : cabin.status?.charAt(0).toUpperCase() + cabin.status?.slice(1)}
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
                      {cabin.building?.name || "Building"} • Floor {cabin.floor ?? "-"}
                    </div>
                    <div className="flex items-center font-semibold text-gray-900">
                      <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      {cabin.price ? `₹${Number(cabin.price).toLocaleString()}/month` : ""}
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
