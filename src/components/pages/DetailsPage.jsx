import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Input, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";
import { useApi } from "../../hooks/useApi";

export function DetailsPage() {
  const navigate = useNavigate();
  const { client: api } = useApi();
  const [formData, setFormData] = useState({
    // Basic Company Info
    companyName: "",
    legalName: "",
    contactPerson: "",
    email: "",
    phone: "",
    website: "",
    companyAddress: "",
    industry: "",
    
    // Commercial Details
    contactType: "customer",
    customerSubType: "business",
    creditLimit: "",
    contactNumber: "",
    isPortalEnabled: false,
    paymentTerms: "",
    paymentTermsLabel: "",
    notes: "",
    
    // Addresses
    billingAddress: {
      attention: "",
      address: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    },
    shippingAddress: {
      attention: "",
      address: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    },
    sameAsBilling: false,
    
    // Contact Persons
    contactPersons: [{
      salutation: "",
      first_name: "",
      last_name: "",
      email: "",
      phone: "",
      designation: "",
      department: "",
      is_primary_contact: true,
      enable_portal: false,
    }],
    
    // Tax Details
    gstNumber: "",
    gstNo: "",
    gstTreatment: "",
    isTaxable: true,
    taxRegNo: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const finalValue = type === 'checkbox' ? checked : value;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...prev[parent], [child]: finalValue }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: finalValue }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handleContactPersonChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      contactPersons: prev.contactPersons.map((person, i) => 
        i === index ? { ...person, [field]: value } : person
      )
    }));
  };

  const addContactPerson = () => {
    setFormData(prev => ({
      ...prev,
      contactPersons: [...prev.contactPersons, {
        salutation: "",
        first_name: "",
        last_name: "",
        email: "",
        phone: "",
        designation: "",
        department: "",
        is_primary_contact: false,
        enable_portal: false,
      }]
    }));
  };

  const removeContactPerson = (index) => {
    if (formData.contactPersons.length > 1) {
      setFormData(prev => ({
        ...prev,
        contactPersons: prev.contactPersons.filter((_, i) => i !== index)
      }));
    }
  };

  const handleSameAsBilling = (checked) => {
    setFormData(prev => ({
      ...prev,
      sameAsBilling: checked,
      shippingAddress: checked ? { ...prev.billingAddress } : {
        attention: "",
        address: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        phone: "",
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.companyName.trim()) {
      newErrors.companyName = "Company name is required";
    }
    
    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid 10-digit phone number";
    }
    
    if (!formData.companyAddress.trim()) {
      newErrors.companyAddress = "Company address is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      // Send complete payload with all fields for proper Zoho Books integration
      const payload = {
        // Basic Company Info
        companyName: formData.companyName || "",
        legalName: formData.legalName || "",
        contactPerson: formData.contactPerson || "",
        email: formData.email || "",
        phone: formData.phone || "",
        website: formData.website || "",
        companyAddress: formData.companyAddress || "",
        industry: formData.industry || "",
        
        // Commercial Details
        contactType: formData.contactType || "customer",
        customerSubType: formData.customerSubType || "business",
        creditLimit: formData.creditLimit || 0,
        contactNumber: formData.contactNumber || "",
        isPortalEnabled: formData.isPortalEnabled || false,
        paymentTerms: formData.paymentTerms || 0,
        paymentTermsLabel: formData.paymentTermsLabel || "",
        notes: formData.notes || "",
        
        // Addresses
        billingAddress: {
          attention: formData.billingAddress?.attention || "",
          address: formData.billingAddress?.address || "",
          street2: formData.billingAddress?.street2 || "",
          city: formData.billingAddress?.city || "",
          state: formData.billingAddress?.state || "",
          zip: formData.billingAddress?.zip || "",
          country: formData.billingAddress?.country || "INDIA",
          phone: formData.billingAddress?.phone || ""
        },
        shippingAddress: {
          attention: formData.shippingAddress?.attention || "",
          address: formData.shippingAddress?.address || "",
          street2: formData.shippingAddress?.street2 || "",
          city: formData.shippingAddress?.city || "",
          state: formData.shippingAddress?.state || "",
          zip: formData.shippingAddress?.zip || "",
          country: formData.shippingAddress?.country || "INDIA",
          phone: formData.shippingAddress?.phone || ""
        },
        
        // Contact Persons
        contactPersons: formData.contactPersons || [],
        
        // Tax Details
        gstNumber: formData.gstNumber || "",
        gstNo: formData.gstNo || "",
        gstTreatment: formData.gstTreatment || "",
        isTaxable: formData.isTaxable !== undefined ? formData.isTaxable : true,
        taxRegNo: formData.taxRegNo || ""
      };
      
      const { data } = await api.post("/api/clients", payload);
      const createdId = data?.client?._id;
      if (createdId) {
        localStorage.setItem("ofis_current_client_id", createdId);
      }
      // Navigate to KYC page after successful company details submission
      navigate("/kyc");
    } catch (error) {
      setErrors({ general: error.response?.data?.error || "Failed to save company details. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Authentication</span>
            </div>
            <div className="flex-1 mx-4 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                2
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">Company Details</span>
            </div>
            <div className="flex-1 mx-4 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-400 rounded-full text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-gray-400">KYC Documents</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Company Details</CardTitle>
            <CardDescription>
              Please provide your company information to continue with the onboarding process.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Tab Navigation */}
              <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                  {[
                    { id: 'basic', name: 'Basic Info' },
                    { id: 'commercial', name: 'Commercial' },
                    { id: 'addresses', name: 'Addresses' },
                    { id: 'contacts', name: 'Contacts' },
                    { id: 'tax', name: 'Tax Details' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {activeTab === 'basic' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Basic Company Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="Company Name"
                        name="companyName"
                        value={formData.companyName}
                        onChange={handleChange}
                        error={errors.companyName}
                        placeholder="Acme Corporation"
                        required
                      />
                      <Input
                        label="Legal Name (Optional)"
                        name="legalName"
                        value={formData.legalName}
                        onChange={handleChange}
                        placeholder="Acme Corporation Pvt Ltd"
                      />
                      <Input
                        label="Contact Person"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                        error={errors.contactPerson}
                        placeholder="John Doe"
                        required
                      />
                      <Input
                        label="Email Address"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        error={errors.email}
                        placeholder="contact@acme.com"
                        required
                      />
                      <Input
                        label="Phone Number"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        error={errors.phone}
                        placeholder="9876543210"
                        required
                      />
                      <Input
                        label="Website (Optional)"
                        name="website"
                        value={formData.website}
                        onChange={handleChange}
                        placeholder="https://www.acme.com"
                      />
                      <Input
                        label="Industry (Optional)"
                        name="industry"
                        value={formData.industry}
                        onChange={handleChange}
                        placeholder="e.g., Technology, Retail, Finance"
                      />
                    </div>
                    <Textarea
                      label="Company Address"
                      name="companyAddress"
                      value={formData.companyAddress}
                      onChange={handleChange}
                      error={errors.companyAddress}
                      placeholder="Street Address, City, State, PIN Code"
                      rows={3}
                      required
                    />
                  </div>
                )}

                {activeTab === 'commercial' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Commercial Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Contact Type</label>
                        <select
                          name="contactType"
                          value={formData.contactType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="customer">Customer</option>
                          <option value="vendor">Vendor</option>
                          <option value="both">Both</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Customer Sub Type</label>
                        <select
                          name="customerSubType"
                          value={formData.customerSubType}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="business">Business</option>
                          <option value="individual">Individual</option>
                        </select>
                      </div>
                      <Input
                        label="Credit Limit (Optional)"
                        name="creditLimit"
                        type="number"
                        value={formData.creditLimit}
                        onChange={handleChange}
                        placeholder="50000"
                      />
                      <Input
                        label="Contact Number (Optional)"
                        name="contactNumber"
                        value={formData.contactNumber}
                        onChange={handleChange}
                        placeholder="CNT-001234"
                      />
                      <Input
                        label="Payment Terms (Days)"
                        name="paymentTerms"
                        type="number"
                        value={formData.paymentTerms}
                        onChange={handleChange}
                        placeholder="30"
                      />
                      <Input
                        label="Payment Terms Label"
                        name="paymentTermsLabel"
                        value={formData.paymentTermsLabel}
                        onChange={handleChange}
                        placeholder="Net 30"
                      />
                      <div className="md:col-span-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="isPortalEnabled"
                            checked={formData.isPortalEnabled}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Enable Portal Access</span>
                        </label>
                      </div>
                    </div>
                    <Textarea
                      label="Notes (Optional)"
                      name="notes"
                      value={formData.notes}
                      onChange={handleChange}
                      placeholder="Additional notes about the client"
                      rows={3}
                    />
                  </div>
                )}

                {activeTab === 'addresses' && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Address Details</h3>
                    
                    <div className="space-y-4">
                      <h4 className="text-md font-medium text-gray-800">Billing Address</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          label="Attention"
                          name="billingAddress.attention"
                          value={formData.billingAddress.attention}
                          onChange={handleChange}
                          placeholder="Mr. John Doe"
                        />
                        <Input
                          label="Phone"
                          name="billingAddress.phone"
                          value={formData.billingAddress.phone}
                          onChange={handleChange}
                          placeholder="+91-9876543210"
                        />
                        <Input
                          label="Address"
                          name="billingAddress.address"
                          value={formData.billingAddress.address}
                          onChange={handleChange}
                          placeholder="Street Address"
                        />
                        <Input
                          label="Street 2"
                          name="billingAddress.street2"
                          value={formData.billingAddress.street2}
                          onChange={handleChange}
                          placeholder="Apartment, Suite, etc."
                        />
                        <Input
                          label="City"
                          name="billingAddress.city"
                          value={formData.billingAddress.city}
                          onChange={handleChange}
                          placeholder="Mumbai"
                        />
                        <Input
                          label="State"
                          name="billingAddress.state"
                          value={formData.billingAddress.state}
                          onChange={handleChange}
                          placeholder="Maharashtra"
                        />
                        <Input
                          label="ZIP Code"
                          name="billingAddress.zip"
                          value={formData.billingAddress.zip}
                          onChange={handleChange}
                          placeholder="400001"
                        />
                        <Input
                          label="Country"
                          name="billingAddress.country"
                          value={formData.billingAddress.country}
                          onChange={handleChange}
                          placeholder="India"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-800">Shipping Address</h4>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.sameAsBilling}
                            onChange={(e) => handleSameAsBilling(e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-600">Same as billing address</span>
                        </label>
                      </div>
                      
                      {!formData.sameAsBilling && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            label="Attention"
                            name="shippingAddress.attention"
                            value={formData.shippingAddress.attention}
                            onChange={handleChange}
                            placeholder="Mr. John Doe"
                          />
                          <Input
                            label="Phone"
                            name="shippingAddress.phone"
                            value={formData.shippingAddress.phone}
                            onChange={handleChange}
                            placeholder="+91-9876543210"
                          />
                          <Input
                            label="Address"
                            name="shippingAddress.address"
                            value={formData.shippingAddress.address}
                            onChange={handleChange}
                            placeholder="Street Address"
                          />
                          <Input
                            label="Street 2"
                            name="shippingAddress.street2"
                            value={formData.shippingAddress.street2}
                            onChange={handleChange}
                            placeholder="Apartment, Suite, etc."
                          />
                          <Input
                            label="City"
                            name="shippingAddress.city"
                            value={formData.shippingAddress.city}
                            onChange={handleChange}
                            placeholder="Mumbai"
                          />
                          <Input
                            label="State"
                            name="shippingAddress.state"
                            value={formData.shippingAddress.state}
                            onChange={handleChange}
                            placeholder="Maharashtra"
                          />
                          <Input
                            label="ZIP Code"
                            name="shippingAddress.zip"
                            value={formData.shippingAddress.zip}
                            onChange={handleChange}
                            placeholder="400001"
                          />
                          <Input
                            label="Country"
                            name="shippingAddress.country"
                            value={formData.shippingAddress.country}
                            onChange={handleChange}
                            placeholder="India"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'contacts' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Contact Persons</h3>
                      <Button type="button" onClick={addContactPerson} variant="outline">
                        Add Contact Person
                      </Button>
                    </div>
                  
                  {formData.contactPersons.map((person, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-gray-800">
                          Contact Person {index + 1}
                          {person.is_primary_contact && <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Primary</span>}
                        </h4>
                        {formData.contactPersons.length > 1 && (
                          <Button 
                            type="button" 
                            onClick={() => removeContactPerson(index)} 
                            variant="outline"
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Salutation</label>
                          <select
                            value={person.salutation}
                            onChange={(e) => handleContactPersonChange(index, 'salutation', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select</option>
                            <option value="Mr">Mr</option>
                            <option value="Ms">Ms</option>
                            <option value="Mrs">Mrs</option>
                            <option value="Dr">Dr</option>
                          </select>
                        </div>
                        <Input
                          label="First Name"
                          value={person.first_name}
                          onChange={(e) => handleContactPersonChange(index, 'first_name', e.target.value)}
                          placeholder="John"
                        />
                        <Input
                          label="Last Name"
                          value={person.last_name}
                          onChange={(e) => handleContactPersonChange(index, 'last_name', e.target.value)}
                          placeholder="Doe"
                        />
                        <Input
                          label="Email"
                          type="email"
                          value={person.email}
                          onChange={(e) => handleContactPersonChange(index, 'email', e.target.value)}
                          placeholder="john@acme.com"
                        />
                        <Input
                          label="Phone"
                          value={person.phone}
                          onChange={(e) => handleContactPersonChange(index, 'phone', e.target.value)}
                          placeholder="9876543210"
                        />
                        <Input
                          label="Designation"
                          value={person.designation}
                          onChange={(e) => handleContactPersonChange(index, 'designation', e.target.value)}
                          placeholder="Sales Manager"
                        />
                        <Input
                          label="Department"
                          value={person.department}
                          onChange={(e) => handleContactPersonChange(index, 'department', e.target.value)}
                          placeholder="Sales"
                        />
                      </div>
                      
                      <div className="flex space-x-6">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={person.is_primary_contact}
                            onChange={(e) => {
                              // If setting as primary, unset others
                              if (e.target.checked) {
                                setFormData(prev => ({
                                  ...prev,
                                  contactPersons: prev.contactPersons.map((p, i) => ({
                                    ...p,
                                    is_primary_contact: i === index
                                  }))
                                }));
                              } else {
                                handleContactPersonChange(index, 'is_primary_contact', false);
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Primary Contact</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={person.enable_portal}
                            onChange={(e) => handleContactPersonChange(index, 'enable_portal', e.target.checked)}
                            className="mr-2"
                          />
                          <span className="text-sm text-gray-700">Enable Portal Access</span>
                        </label>
                      </div>
                    </div>
                    ))}
                  </div>
                )}

                {activeTab === 'tax' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Tax & Compliance Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Input
                        label="GST Number"
                        name="gstNumber"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        placeholder="27AABCO1234A1Z5"
                      />
                      <Input
                        label="GST Number (New)"
                        name="gstNo"
                        value={formData.gstNo}
                        onChange={handleChange}
                        placeholder="27AABCO1234A1Z5"
                      />
                      <Input
                        label="GST Treatment"
                        name="gstTreatment"
                        value={formData.gstTreatment}
                        onChange={handleChange}
                        placeholder="business_gst"
                      />
                      <Input
                        label="Tax Registration Number"
                        name="taxRegNo"
                        value={formData.taxRegNo}
                        onChange={handleChange}
                        placeholder="AABCO1234A"
                      />
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="isTaxable"
                            checked={formData.isTaxable}
                            onChange={handleChange}
                            className="mr-2"
                          />
                          <span className="text-sm font-medium text-gray-700">Taxable Entity</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/auth")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  {loading ? "Saving..." : "Continue to KYC"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
