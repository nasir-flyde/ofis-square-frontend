import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Badge } from "../ui/Badge";

export function ClientsList({ api, refreshSignal }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(null);
  const [verifying, setVerifying] = useState(null);

  const loadClients = async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/clients");
      setClients(data || []);
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [refreshSignal]);

  const handleVerifyKYC = async (clientId) => {
    setVerifying(clientId);
    try {
      await api.post(`/api/clients/${clientId}/kyc/verify`);
      await loadClients();
      // Show success message
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setVerifying(null);
    }
  };

  const handleUploadKYC = async (clientId, files) => {
    if (!files || !files.length) return;
    
    const formData = new FormData();
    Array.from(files).forEach((file) => formData.append("kycFiles", file));
    
    setUploading(clientId);
    try {
      await api.post(`/api/clients/${clientId}/kyc`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await loadClients();
      // Show success message
    } catch (err) {
      setError(err?.response?.data?.error || err.message);
    } finally {
      setUploading(null);
    }
  };

  const getKYCBadgeVariant = (status) => {
    switch ((status || "").toLowerCase()) {
      case "verified": return "success";
      case "pending": return "warning";
      case "rejected": return "error";
      default: return "gray";
    }
  };

  if (loading && clients.length === 0) {
    return (
      <Card>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="loaderCustom"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Clients Management</CardTitle>
      </CardHeader>
      
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {clients.length === 0 ? (
          <div className="text-center py-8">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new client.</p>
          </div>
        ) : (
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    KYC Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {clients.map((client) => (
                  <tr key={client._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {client.companyName || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.contactPerson || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.email || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {client.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getKYCBadgeVariant(client.kycStatus)}>
                        {client.kycStatus || "Not Started"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <div className="flex items-center space-x-2">
                        {String(client.kycStatus).toLowerCase() !== "verified" && (
                          <>
                            <label className="relative">
                              <input
                                type="file"
                                multiple
                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                onChange={(e) => handleUploadKYC(client._id, e.target.files)}
                                disabled={uploading === client._id}
                                className="sr-only"
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                loading={uploading === client._id}
                                className="cursor-pointer"
                              >
                                {uploading === client._id ? "Uploading..." : "Upload KYC"}
                              </Button>
                            </label>
                            
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleVerifyKYC(client._id)}
                              loading={verifying === client._id}
                            >
                              {verifying === client._id ? "Verifying..." : "Verify KYC"}
                            </Button>
                          </>
                        )}
                        
                        {String(client.kycStatus).toLowerCase() === "verified" && (
                          <span className="text-sm text-green-600 font-medium">
                            ✓ KYC Verified
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
