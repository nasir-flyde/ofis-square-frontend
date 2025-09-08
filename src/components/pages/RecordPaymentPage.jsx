import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Select, Textarea } from "../ui/Input";
import { useApi } from "../../hooks/useApi";

export function RecordPaymentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { client: api } = useApi();
  
  const [formData, setFormData] = useState({
    invoice: searchParams.get('invoice') || '',
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    type: 'Bank Transfer',
    referenceNumber: '',
    currency: 'INR',
    notes: '',
    bankName: '',
    accountNumber: ''
  });
  
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    if (formData.invoice) {
      const invoice = invoices.find(inv => inv._id === formData.invoice);
      setSelectedInvoice(invoice);
    }
  }, [formData.invoice, invoices]);

  const fetchInvoices = async () => {
    try {
      const { data } = await api.get('/api/invoices?status=issued');
      setInvoices(data.data || []);
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.invoice.trim()) {
      newErrors.invoice = 'Invoice is required';
    }
    
    if (!formData.amount.trim()) {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || Number(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be a positive number';
    }
    
    if (!formData.paymentDate.trim()) {
      newErrors.paymentDate = 'Payment date is required';
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
        amount: Number(formData.amount)
      };

      const { data } = await api.post('/api/payments', payload);
      
      // Show success and redirect to dashboard
      alert('Payment recorded successfully!');
      navigate('/dashboard');
    } catch (error) {
      setErrors({ 
        general: error.response?.data?.message || 'Failed to record payment. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Record Payment</CardTitle>
            <CardDescription>
              Record a payment received against an invoice.
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{errors.general}</p>
                </div>
              )}

              {/* Invoice Selection */}
              <Select
                label="Invoice"
                name="invoice"
                value={formData.invoice}
                onChange={handleChange}
                error={errors.invoice}
                required
              >
                <option value="">Select an invoice</option>
                {invoices.map(invoice => (
                  <option key={invoice._id} value={invoice._id}>
                    {invoice.invoiceNumber} - {invoice.client?.companyName} - ₹{invoice.balanceDue?.toLocaleString()} due
                  </option>
                ))}
              </Select>

              {/* Invoice Details */}
              {selectedInvoice && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Invoice Details</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <div>Invoice: {selectedInvoice.invoiceNumber}</div>
                    <div>Client: {selectedInvoice.client?.companyName}</div>
                    <div>Total: ₹{selectedInvoice.total?.toLocaleString()}</div>
                    <div>Paid: ₹{selectedInvoice.amountPaid?.toLocaleString()}</div>
                    <div className="font-medium">Balance Due: ₹{selectedInvoice.balanceDue?.toLocaleString()}</div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input
                  label="Amount (₹)"
                  name="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={handleChange}
                  error={errors.amount}
                  placeholder="15000.00"
                  required
                />

                <Input
                  label="Payment Date"
                  name="paymentDate"
                  type="date"
                  value={formData.paymentDate}
                  onChange={handleChange}
                  error={errors.paymentDate}
                  required
                />

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="font-medium text-blue-900">Bank Transfer Payment</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">Only bank transfer payments are supported for recording.</p>
                </div>

                <Input
                  label="UTR/Reference Number"
                  name="referenceNumber"
                  value={formData.referenceNumber}
                  onChange={handleChange}
                  placeholder="UTR123456789"
                  required
                />

                <Input
                  label="Currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder="INR"
                />

                <Input
                  label="Bank Name"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="HDFC Bank"
                />

                <Input
                  label="Account Number"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="XXXX1234"
                />
              </div>

              <Textarea
                label="Notes (Optional)"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Additional payment details..."
                rows={3}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/dashboard')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  {loading ? 'Recording Payment...' : 'Record Payment'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
