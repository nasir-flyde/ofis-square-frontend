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
    guest: '',
    contract: '',
    building: '',
    cabin: '',
    reference_number: '',
    date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    billing_period: {
      start: new Date().toISOString().split('T')[0],
      end: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
    },
    customer_id: '',
    gst_treatment: '',
    place_of_supply: '',
    gst_no: '',
    line_items: [{
      description: 'Monthly Cabin Rent',
      quantity: 1,
      unitPrice: 15000,
      amount: 15000,
      name: 'Monthly Cabin Rent',
      rate: 15000,
      unit: 'month',
      tax_id: '',
      tax_name: 'GST',
      tax_type: 'tax',
      tax_percentage: 18,
      item_total: 15000
    }],
    sub_total: 0,
    discount: 0,
    discount_type: 'entity_level',
    tax_total: 0,
    total: 0,
    balance: 0,
    amount_paid: 0,
    currency_code: 'INR',
    exchange_rate: 1,
    salesperson_name: '',
    notes: '',
    terms: '',
    status: 'draft',
    payment_terms: 30,
    payment_terms_label: 'Net 30',
    shipping_charge: 0,
    adjustment: 0,
    adjustment_description: '',
    is_inclusive_tax: false,
    billing_address: {
      attention: '',
      address: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      phone: ''
    },
    shipping_address: {
      attention: '',
      address: '',
      street2: '',
      city: '',
      state: '',
      zip: '',
      country: 'India',
      phone: ''
    }
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
    const newItems = [...formData.line_items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate amount and item_total when quantity or unitPrice changes
    if (field === 'quantity' || field === 'unitPrice') {
      const quantity = field === 'quantity' ? Number(value) : Number(newItems[index].quantity);
      const unitPrice = field === 'unitPrice' ? Number(value) : Number(newItems[index].unitPrice);
      const amount = quantity * unitPrice;
      newItems[index].amount = amount;
      newItems[index].item_total = amount;
      newItems[index].rate = unitPrice;
    }
    
    // Update name when description changes
    if (field === 'description') {
      newItems[index].name = value;
    }
    
    setFormData(prev => ({ ...prev, line_items: newItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      line_items: [...prev.line_items, { 
        description: '', 
        quantity: 1, 
        unitPrice: 0,
        amount: 0,
        name: '',
        rate: 0,
        unit: 'month',
        tax_id: '',
        tax_name: 'GST',
        tax_type: 'tax',
        tax_percentage: 18,
        item_total: 0
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.line_items.length > 1) {
      const newItems = formData.line_items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, line_items: newItems }));
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.line_items.reduce((sum, item) => {
      return sum + (Number(item.quantity) * Number(item.unitPrice));
    }, 0);

    const discountAmount = Number(formData.discount || 0);
    const taxableBase = subtotal - discountAmount;
    
    // Calculate tax based on line items tax percentage (assuming uniform tax)
    const taxPercentage = formData.line_items[0]?.tax_percentage || 18;
    const taxAmount = (taxableBase * taxPercentage) / 100;
    const total = taxableBase + taxAmount + Number(formData.shipping_charge || 0) + Number(formData.adjustment || 0);

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
      rawSubtotal: subtotal,
      rawTaxAmount: taxAmount,
      rawTotal: total
    };
  };

  // Update calculated fields when relevant data changes
  useEffect(() => {
    const totals = calculateTotals();
    setFormData(prev => ({
      ...prev,
      sub_total: totals.rawSubtotal,
      tax_total: totals.rawTaxAmount,
      total: totals.rawTotal,
      balance: totals.rawTotal - Number(prev.amount_paid || 0)
    }));
  }, [formData.line_items, formData.discount, formData.shipping_charge, formData.adjustment]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.client.trim()) {
      newErrors.client = 'Client is required';
    }
    
    if (!formData.billing_period.start) {
      newErrors['billing_period.start'] = 'Billing period start date is required';
    }
    
    if (!formData.billing_period.end) {
      newErrors['billing_period.end'] = 'Billing period end date is required';
    }

    if (formData.line_items.some(item => !item.description || !item.quantity || !item.unitPrice)) {
      newErrors.line_items = 'All items must have description, quantity, and unit price';
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
        line_items: formData.line_items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          amount: Number(item.quantity) * Number(item.unitPrice),
          rate: Number(item.unitPrice),
          item_total: Number(item.quantity) * Number(item.unitPrice),
          tax_percentage: Number(item.tax_percentage)
        })),
        discount: Number(formData.discount),
        sub_total: Number(formData.sub_total),
        tax_total: Number(formData.tax_total),
        total: Number(formData.total),
        balance: Number(formData.balance),
        shipping_charge: Number(formData.shipping_charge),
        adjustment: Number(formData.adjustment),
        payment_terms: Number(formData.payment_terms),
        exchange_rate: Number(formData.exchange_rate)
      };

      const { data } = await api.post('/api/invoices', payload);
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
                  name="billing_period.start"
                  type="date"
                  value={formData.billing_period.start}
                  onChange={handleChange}
                  error={errors['billing_period.start']}
                  required
                />

                <Input
                  label="Billing Period End"
                  name="billing_period.end"
                  type="date"
                  value={formData.billing_period.end}
                  onChange={handleChange}
                  error={errors['billing_period.end']}
                  required
                />
              </div>

              {/* Invoice Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Issue Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />

                <Input
                  label="Due Date"
                  name="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Input
                  label="Reference Number"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="Optional reference"
                />

                <Select
                  label="GST Treatment"
                  name="gst_treatment"
                  value={formData.gst_treatment}
                  onChange={handleChange}
                >
                  <option value="">Select GST Treatment</option>
                  <option value="business_gst">Business GST</option>
                  <option value="business_none">Business None</option>
                  <option value="overseas">Overseas</option>
                  <option value="consumer">Consumer</option>
                </Select>

                <Input
                  label="Place of Supply"
                  name="place_of_supply"
                  value={formData.place_of_supply}
                  onChange={handleChange}
                  placeholder="e.g., Karnataka"
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
                
                {errors.line_items && (
                  <p className="text-sm text-red-600 mb-2">{errors.line_items}</p>
                )}

                <div className="space-y-3">
                  {formData.line_items.map((item, index) => (
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
                        {formData.line_items.length > 1 && (
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Select
                  label="Discount Type"
                  name="discount_type"
                  value={formData.discount_type}
                  onChange={handleChange}
                >
                  <option value="entity_level">Entity Level</option>
                  <option value="item_level">Item Level</option>
                </Select>

                <Input
                  label="Discount Amount (₹)"
                  name="discount"
                  type="number"
                  step="0.01"
                  value={formData.discount}
                  onChange={handleChange}
                />

                <Input
                  label="Shipping Charge (₹)"
                  name="shipping_charge"
                  type="number"
                  step="0.01"
                  value={formData.shipping_charge}
                  onChange={handleChange}
                />

                <Input
                  label="Adjustment (₹)"
                  name="adjustment"
                  type="number"
                  step="0.01"
                  value={formData.adjustment}
                  onChange={handleChange}
                />
              </div>

              {/* Tax Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Tax Rate (%)"
                  type="number"
                  step="0.01"
                  value={formData.line_items[0]?.tax_percentage || 18}
                  onChange={(e) => {
                    const newItems = [...formData.line_items];
                    newItems.forEach(item => {
                      item.tax_percentage = Number(e.target.value);
                    });
                    setFormData(prev => ({ ...prev, line_items: newItems }));
                  }}
                />

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_inclusive_tax"
                    name="is_inclusive_tax"
                    checked={formData.is_inclusive_tax}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_inclusive_tax: e.target.checked }))}
                    className="mr-2"
                  />
                  <label htmlFor="is_inclusive_tax" className="text-sm font-medium text-gray-700">
                    Tax Inclusive Pricing
                  </label>
                </div>
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
                    <span>Shipping Charge:</span>
                    <span>₹{Number(formData.shipping_charge || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Adjustment:</span>
                    <span>₹{Number(formData.adjustment || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax ({formData.line_items[0]?.tax_percentage || 18}%):</span>
                    <span>₹{totals.taxAmount}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{totals.total}</span>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Payment Terms (Days)"
                  name="payment_terms"
                  type="number"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  placeholder="30"
                />

                <Input
                  label="Payment Terms Label"
                  name="payment_terms_label"
                  value={formData.payment_terms_label}
                  onChange={handleChange}
                  placeholder="Net 30"
                />
              </div>

              {/* Notes and Terms */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Textarea
                  label="Notes (Optional)"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  placeholder="Additional invoice notes..."
                  rows={3}
                />

                <Textarea
                  label="Terms & Conditions (Optional)"
                  name="terms"
                  value={formData.terms}
                  onChange={handleChange}
                  placeholder="Terms and conditions..."
                  rows={3}
                />
              </div>

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
