import React, { useState, useEffect } from "react";
import { useApi } from "../../hooks/useApi";
import { useLocation } from "react-router-dom";
import { 
  Plus, CreditCard, Users, AlertCircle, CheckCircle, X, ShoppingCart, 
  TrendingUp, Wallet, History, Award, DollarSign, Calendar, Clock,
  ArrowUpRight, ArrowDownRight, Filter, Search, RefreshCw
} from "lucide-react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select } from "../ui/Input";
import { Badge } from "../ui/Badge";

export function CreditManagementPage() {
  const { client } = useApi();
  const location = useLocation();
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [creditAmount, setCreditAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [creditSummary, setCreditSummary] = useState(null);
  const [customItems, setCustomItems] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [consumeQty, setConsumeQty] = useState(1);
  const [consumeNote, setConsumeNote] = useState("");
  const [consumeLoading, setConsumeLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchCustomItems();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchCreditSummary(selectedClient);
    }
  }, [selectedClient]);

  // Check for client parameter in URL and set it when clients are loaded
  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const clientParam = urlParams.get('client');
    
    if (clientParam && clients.length > 0 && !selectedClient) {
      // Check if the client ID exists in the clients list
      const clientExists = clients.find(c => c._id === clientParam);
      if (clientExists) {
        setSelectedClient(clientParam);
      }
    }
  }, [clients, location.search, selectedClient]);

  const fetchClients = async () => {
    try {
      const response = await client.get("/api/clients");
      console.log("Clients response:", response.data); // Debug log
      setClients(response.data.data || response.data.clients || response.data || []);
    } catch (error) {
      console.error("Error fetching clients:", error);
      setMessage({ type: "error", text: "Failed to fetch clients" });
    }
  };

  const fetchCreditSummary = async (clientId) => {
    try {
      const response = await client.get(`/api/credits/summary/${clientId}`);
      setCreditSummary(response.data);
    } catch (error) {
      console.error("Error fetching credit summary:", error);
      setCreditSummary(null);
    }
  };

  const fetchCustomItems = async () => {
    try {
      const response = await client.get("/api/credits/custom-items");
      const items = response.data?.data || response.data || [];
      setCustomItems(Array.isArray(items) ? items : []);
    } catch (error) {
      console.error("Error fetching custom items:", error);
      // don't block the page for items errors
    }
  };

  const handleGrantCredits = async (e) => {
    e.preventDefault();
    
    if (!selectedClient || !creditAmount || !reason) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (parseFloat(creditAmount) <= 0) {
      setMessage({ type: "error", text: "Credit amount must be greater than 0" });
      return;
    }

    setLoading(true);
    try {
      const response = await client.post("/api/credits/grant", {
        clientId: selectedClient,
        credits: parseFloat(creditAmount),
        reason: reason,
        type: "admin_grant"
      });

      setMessage({ type: "success", text: `Successfully granted ${creditAmount} credits to client` });
      setCreditAmount("");
      setReason("");
      
      // Refresh credit summary
      if (selectedClient) {
        fetchCreditSummary(selectedClient);
      }
    } catch (error) {
      console.error("Error granting credits:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to grant credits" 
      });
    } finally {
      setLoading(false);
    }
  };

  const clearMessage = () => {
    setMessage({ type: "", text: "" });
  };

  const handleConsumeItem = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      setMessage({ type: "error", text: "Please select a client first" });
      return;
    }
    if (!selectedItemId) {
      setMessage({ type: "error", text: "Please select an item to consume" });
      return;
    }
    if (!consumeQty || Number(consumeQty) <= 0) {
      setMessage({ type: "error", text: "Quantity must be greater than 0" });
      return;
    }
    setConsumeLoading(true);
    try {
      const payload = {
        clientId: selectedClient,
        itemId: selectedItemId,
        quantity: Number(consumeQty),
        description: consumeNote || undefined
      };
      const resp = await client.post("/api/credits/consume-item", payload);
      setMessage({ type: "success", text: resp.data?.message || "Credits consumed successfully" });
      // refresh summary to reflect new balance
      if (selectedClient) {
        fetchCreditSummary(selectedClient);
      }
      // reset only qty and note
      setConsumeNote("");
    } catch (error) {
      const errMsg = error.response?.data?.message || "Failed to consume credits for item";
      setMessage({ type: "error", text: errMsg });
    } finally {
      setConsumeLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Wallet className="h-8 w-8 text-blue-600 mr-3" />
                Credit Management
              </h1>
              <p className="text-gray-600 mt-1">Manage client credits, grants, and consumption</p>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

        {/* Message Display */}
        {message.text && (
          <Card className={`mb-6 ${
            message.type === "success" 
              ? "border-green-200 bg-green-50" 
              : "border-red-200 bg-red-50"
          }`}>
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center">
                {message.type === "success" ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600 mr-3" />
                )}
                <span className={message.type === "success" ? "text-green-800" : "text-red-800"}>
                  {message.text}
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearMessage}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Available Items</p>
                <p className="text-2xl font-bold text-gray-900">{customItems.length}</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credits Available</p>
                <p className="text-2xl font-bold text-gray-900">
                  {creditSummary?.availableCredits || 0}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Credit Value</p>
                <p className="text-2xl font-bold text-gray-900">
                  ₹{creditSummary?.creditValue || 500}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Credit Grant Form */}
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-blue-100 rounded-lg mr-3">
                <Plus className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Grant Credits</h2>
                <p className="text-sm text-gray-600">Add credits to client accounts</p>
              </div>
            </div>

            <form onSubmit={handleGrantCredits} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Client
                </label>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.companyName || client.name || 'Unnamed Client'}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Credit Amount
                </label>
                <Input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  placeholder="Enter credit amount"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Grant
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Enter reason for granting credits..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Granting Credits...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Grant Credits
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Consume Item Form */}
          <Card className="p-6">
            <div className="flex items-center mb-6">
              <div className="p-2 bg-purple-100 rounded-lg mr-3">
                <ShoppingCart className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Consume Credits</h2>
                <p className="text-sm text-gray-600">Use credits for items/services</p>
              </div>
            </div>

            <form onSubmit={handleConsumeItem} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
                <Select
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  required
                >
                  <option value="">Choose a client...</option>
                  {clients.map((client) => (
                    <option key={client._id} value={client._id}>
                      {client.companyName || client.name || 'Unnamed Client'}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                <Select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                >
                  <option value="">Choose an item...</option>
                  {customItems
                    .filter(ci => ci?.isActive !== false)
                    .map((ci) => (
                    <option key={ci._id} value={ci._id}>
                      {ci.name} ({ci.unitType || 'unit'}) · {ci.unitCredits || 0} credits/unit
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                <Input
                  type="number"
                  min="1"
                  step="1"
                  value={consumeQty}
                  onChange={(e) => setConsumeQty(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
                <textarea
                  rows={2}
                  value={consumeNote}
                  onChange={(e) => setConsumeNote(e.target.value)}
                  placeholder="E.g., Meeting Room A for 2 hours"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              <Button type="submit" disabled={consumeLoading} variant="secondary" className="w-full">
                {consumeLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Consuming...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Consume Credits
                  </>
                )}
              </Button>
            </form>
          </Card>

          {/* Credit Summary */}
          {selectedClient && creditSummary && (
            <Card className="p-6">
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Credit Status</h2>
                  <p className="text-sm text-gray-600">Current balance overview</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-blue-600 font-medium">Available</div>
                        <div className="text-2xl font-bold text-blue-900">
                          {creditSummary.availableCredits || 0}
                        </div>
                      </div>
                      <Wallet className="h-8 w-8 text-blue-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-green-600 font-medium">Total</div>
                        <div className="text-2xl font-bold text-green-900">
                          {creditSummary.totalCredits || 0}
                        </div>
                      </div>
                      <Award className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-orange-600 font-medium">Used</div>
                        <div className="text-2xl font-bold text-orange-900">
                          {creditSummary.usedCredits || 0}
                        </div>
                      </div>
                      <ArrowDownRight className="h-8 w-8 text-orange-600" />
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-purple-600 font-medium">Value</div>
                        <div className="text-2xl font-bold text-purple-900">
                          ₹{creditSummary.creditValue || 500}
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-purple-600" />
                    </div>
                  </div>
                </div>

                {creditSummary.contract && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-3">
                      <Calendar className="h-5 w-5 text-gray-600 mr-2" />
                      <div className="text-sm text-gray-600 font-medium">Contract Details</div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Allocated Credits:</span>
                        <Badge variant="secondary">{creditSummary.contract.allocated_credits || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Credit Enabled:</span>
                        <Badge variant={creditSummary.contract.credit_enabled ? "success" : "destructive"}>
                          {creditSummary.contract.credit_enabled ? "Yes" : "No"}
                        </Badge>
                      </div>
                      {creditSummary.contract.credit_terms_days && (
                        <div className="flex justify-between">
                          <span>Terms:</span>
                          <Badge variant="outline">{creditSummary.contract.credit_terms_days} days</Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    // </div>
  );
}
