import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import { useApi } from "../../hooks/useApi";

export function CreateInvoicePage() {
  const navigate = useNavigate();
  const { client: api } = useApi();
  
  const [formData, setFormData] = useState({
    client: '',
    contract: '',
    billingPeriod: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    },
    issueDate: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    items: [{
      description: 'Monthly Cabin Rent',
      quantity: 1,
      unitPrice: 15000
    }],
    discount: {
      type: 'flat',
      value: 0
    },
    taxes: [{
      name: 'GST',
      rate: 18
    }],
    notes: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (formData.client) {
      const client = clients.find(c => c._id === formData.client);
      setSelectedClient(client);
      fetchContracts(formData.client);
    }
  }, [formData.client, clients]);

  const fetchClients = async () => {
    try {
      const { data } = await api.get('/api/clients');
      setClients(data.data || []);
    } catch (error) {
      console.error('Failed to fetch clients:', error);
    }
  };

  const fetchContracts = async (clientId) => {
    try {
      const { data } = await api.get(`/api/contracts?client=${clientId}&status=active`);
      setContracts(data.data || []);
    } catch (error) {
      console.error('Failed to fetch contracts:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unitPrice: 0 }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      const newItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);

    let discountAmount = 0;
    if (formData.discount.type === 'percent') {
      discountAmount = (subtotal * Number(formData.discount.value)) / 100;
    } else {
      discountAmount = Number(formData.discount.value);
    }

    const taxableBase = subtotal - discountAmount;
    const taxAmount = (taxableBase * Number(formData.taxes[0]?.rate || 0)) / 100;
    const total = taxableBase + taxAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2)
    };
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client.trim()) {
      newErrors.client = 'Client is required';
    }
    
    if (!formData.billingPeriod.start) {
      newErrors['billingPeriod.start'] = 'Billing period start date is required';
    }
    
    if (!formData.billingPeriod.end) {
      newErrors['billingPeriod.end'] = 'Billing period end date is required';
    }

    if (formData.items.some(item => !item.description || !item.quantity || !item.unitPrice)) {
      newErrors.items = 'All items must have description, quantity, and unit price';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const payload = {
        ...formData,
        items: formData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice)
        })),
        discount: {
          ...formData.discount,
          value: Number(formData.discount.value)
        },
        taxes: formData.taxes.map(tax => ({
          ...tax,
          rate: Number(tax.rate)
        }))
      };

      const { data } = await api.post('/api/invoices', payload);
      
      // Success - redirect back to invoices list
      if (data.success) {
        alert('Invoice created successfully and automatically pushed to Zoho Books!');
      } else {
        alert('Invoice created successfully!');
      }
      navigate('/invoices');
    } catch (error) {
      setErrors({ 
        general: error.response?.data?.message || 'Failed to create invoice. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Invoice Management</CardTitle>
            <CardDescription>
              Create and manage invoices manually (contract invoices are auto-generated). 
              Invoices will be automatically pushed to Zoho Books if the client has a Zoho contact ID.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Client Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Select
                  label="Client"
                  name="client"
                  value={formData.client}
                  onChange={handleChange}
                  error={errors.client}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.companyName} - {client.contactPerson}
                    </option>
                  ))}
                </Select>

                <Select
                  label="Contract (Optional)"
                  name="contract"
                  value={formData.contract}
                  onChange={handleChange}
                >
                  <option value="">Select a contract</option>
                  {contracts.map(contract => (
                    <option key={contract._id} value={contract._id}>
                      Contract - {contract.building?.name || 'TBD'} (Capacity: {contract.capacity || 'N/A'})
                    </option>
                  ))}
                </Select>
              </div>

              {/* Client Details */}
              {selectedClient && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-blue-900">Client Details</h4>
                    {selectedClient.zohoBooksContactId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Zoho Integrated
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⚠ No Zoho Integration
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Company: {selectedClient.companyName}</div>
                    <div>Contact: {selectedClient.contactPerson}</div>
                    <div>Email: {selectedClient.email}</div>
                    <div>Phone: {selectedClient.phone}</div>
                  </div>
                </div>
              )}

              {/* Billing Period */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Billing Period Start"
                  name="billingPeriod.start"
                  type="date"
                  value={formData.billingPeriod.start}
                  onChange={handleChange}
                  error={errors['billingPeriod.start']}
                  required
                />

                <Input
                  label="Billing Period End"
                  name="billingPeriod.end"
                  type="date"
                  value={formData.billingPeriod.end}
                  onChange={handleChange}
                  error={errors['billingPeriod.end']}
                  required
                />
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Issue Date"
                  name="issueDate"
                  type="date"
                  value={formData.issueDate}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Due Date"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Items */}
              <div>
                <div className="flex justify-between items-center mb-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Invoice Items
                  </label>
                  <Button type="button" variant="secondary" size="sm" onClick={addItem}>
                    Add Item
                  </Button>
                </div>
                
                {errors.items && (
                  <p className="text-sm text-red-600 mb-2">{errors.items}</p>
                )}

                <div className="space-y-3">
                  {formData.items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-3 items-end">
                      <div className="col-span-5">
                        <Input
                          label={index === 0 ? "Description" : ""}
                          value={item.description}
                          onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                          placeholder="Service description"
                          required
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          label={index === 0 ? "Quantity" : ""}
                          type="number"
                          step="1"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-3">
                        <Input
                          label={index === 0 ? "Unit Price (₹)" : ""}
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          ₹{(Number(item.quantity) * Number(item.unitPrice)).toFixed(2)}
                        </span>
                        {formData.items.length > 1 && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => removeItem(index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Discount and Tax */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Select
                  label="Discount Type"
                  name="discount.type"
                  value={formData.discount.type}
                  onChange={handleChange}
                >
                  <option value="flat">Flat Amount</option>
                  <option value="percent">Percentage</option>
                </Select>

                <Input
                  label={`Discount ${formData.discount.type === 'percent' ? '(%)' : '(₹)'}`}
                  name="discount.value"
                  type="number"
                  step="0.01"
                  value={formData.discount.value}
                  onChange={handleChange}
                />

                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  value={formData.taxes[0]?.rate || 18}
                  onChange={(e) => {
                    const newTaxes = [...formData.taxes];
                    newTaxes[0] = { ...newTaxes[0], rate: e.target.value };
                    setFormData(prev => ({ ...prev, taxes: newTaxes }));
                  }}
                />
              </div>

              {/* Invoice Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Invoice Summary</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{totals.subtotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{totals.discountAmount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.taxes[0]?.rate || 18}%):</span>
                    <span>₹{totals.taxAmount}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{totals.total}</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <Textarea
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional invoice notes..."
                rows={3}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/invoices')}
                >
                  Back to Invoices
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  {loading ? 'Creating Invoice...' : 'Create Invoice'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
