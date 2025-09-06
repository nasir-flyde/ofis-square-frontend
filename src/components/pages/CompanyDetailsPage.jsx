import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";

export function CompanyDetailsPage() {
  const [companyData, setCompanyData] = useState({
    name: "OFIS SQUARE PRIVATE LIMITED",
    address: "123 Business District, Mumbai, Maharashtra 400001",
    phone: "+91 98765 43210",
    email: "info@ofissquare.com",
    website: "www.ofissquare.com",
    gst: "27AABCO1234A1Z5",
    pan: "AABCO1234A",
    established: "2020",
    employees: "50-100"
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setIsEditing(false);
      // Show success message
    }, 1000);
  };

  const handleCancel = () => {
    setIsEditing(false);
    // Reset form data if needed
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Company Details</h1>
          <p className="text-gray-600 mt-1">Manage your company information and settings</p>
        </div>

        {/* Company Info Card */}
        <Card className="mb-6">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Basic Information</h2>
              {!isEditing ? (
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditing(true)}
                >
                  Edit Details
                </Button>
              ) : (
                <div className="space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="primary" 
                    onClick={handleSave}
                    loading={loading}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input
                label="Company Name"
                name="name"
                value={companyData.name}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Email Address"
                name="email"
                type="email"
                value={companyData.email}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Phone Number"
                name="phone"
                value={companyData.phone}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Website"
                name="website"
                value={companyData.website}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <div className="md:col-span-2">
                <Input
                  label="Address"
                  name="address"
                  value={companyData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                />
              </div>
              
              <Input
                label="GST Number"
                name="gst"
                value={companyData.gst}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="PAN Number"
                name="pan"
                value={companyData.pan}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Year Established"
                name="established"
                value={companyData.established}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
              
              <Input
                label="Number of Employees"
                name="employees"
                value={companyData.employees}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">25</div>
              <div className="text-gray-600">Active Clients</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">150</div>
              <div className="text-gray-600">Total Cabins</div>
            </div>
          </Card>
          
          <Card>
            <div className="p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">12</div>
              <div className="text-gray-600">Meeting Rooms</div>
            </div>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New client registration</p>
                  <p className="text-xs text-gray-500">Tech Solutions Pvt Ltd - 2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Cabin booking confirmed</p>
                  <p className="text-xs text-gray-500">Cabin A-101 booked for 3 months - 4 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Invoice generated</p>
                  <p className="text-xs text-gray-500">Invoice #INV-2024-001 for ₹25,000 - 6 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
