import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Input, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";

export function CreateClient({ onClientCreated, loading: parentLoading }) {
  const [currentStep, setCurrentStep] = useState(1);
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

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
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
      }
      if (!formData.companyAddress.trim()) {
        newErrors.companyAddress = "Company address is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateStep(1)) return;
    
    setLoading(true);
    try {
      const payload = { ...formData };
      // Clean up empty optional fields
      if (!payload.industry?.trim()) delete payload.industry;
      if (!payload.website?.trim()) delete payload.website;
      if (!payload.legalName?.trim()) delete payload.legalName;
      if (!payload.creditLimit) delete payload.creditLimit;
      if (!payload.paymentTerms) delete payload.paymentTerms;
      if (!payload.paymentTermsLabel?.trim()) delete payload.paymentTermsLabel;
      if (!payload.notes?.trim()) delete payload.notes;
      if (!payload.contactNumber?.trim()) delete payload.contactNumber;
      if (!payload.gstNumber?.trim()) delete payload.gstNumber;
      if (!payload.gstNo?.trim()) delete payload.gstNo;
      if (!payload.gstTreatment?.trim()) delete payload.gstTreatment;
      if (!payload.taxRegNo?.trim()) delete payload.taxRegNo;
      
      await onClientCreated(payload);
      
      // Reset form
      setFormData({
        companyName: "",
        legalName: "",
        contactPerson: "",
        email: "",
        phone: "",
        website: "",
        companyAddress: "",
        industry: "",
        contactType: "customer",
        customerSubType: "business",
        creditLimit: "",
        contactNumber: "",
        isPortalEnabled: false,
        paymentTerms: "",
        paymentTermsLabel: "",
        notes: "",
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
        gstNumber: "",
        gstNo: "",
        gstTreatment: "",
        isTaxable: true,
        taxRegNo: "",
      });
      setCurrentStep(1);
    } catch (error) {
      setErrors({ general: error.message || "Failed to create client. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Basic Company Information</h3>
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
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Commercial Details</h3>
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
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900">Address Details</h3>
            
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
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Contact Persons</h3>
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
        );

      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: "Basic Info", description: "Company details" },
    { number: 2, title: "Commercial", description: "Business terms" },
    { number: 3, title: "Addresses", description: "Billing & shipping" },
    { number: 4, title: "Contacts", description: "Contact persons" },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Client</CardTitle>
        <CardDescription>
          Add a new client to the system with comprehensive details across multiple sections.
        </CardDescription>
        
        {/* Step indicator */}
        <div className="flex items-center justify-between mt-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                currentStep >= step.number 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'border-gray-300 text-gray-500'
              }`}>
                {step.number}
              </div>
              <div className="ml-2 text-sm">
                <div className={`font-medium ${currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'}`}>
                  {step.title}
                </div>
                <div className="text-gray-400 text-xs">{step.description}</div>
              </div>
              {index < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {renderStepContent()}

          <div className="flex justify-between pt-6">
            <Button
              type="button"
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
            >
              Previous
            </Button>
            
            {currentStep < 4 ? (
              <Button
                type="button"
                onClick={nextStep}
                variant="primary"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                loading={loading || parentLoading}
              >
                {loading || parentLoading ? "Creating..." : "Create Client"}
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
