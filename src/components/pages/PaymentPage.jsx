import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Badge } from "../ui/Badge";

export function PaymentPage() {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [paymentStatus, setPaymentStatus] = useState("pending");
  const [formData, setFormData] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    nameOnCard: "",
  });

  const selectedCabin = {
    name: "Cabin A-101",
    price: 15000,
    securityDeposit: 30000,
    total: 45000
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePayment = () => {
    setPaymentStatus("processing");
    // Simulate payment processing
    setTimeout(() => {
      setPaymentStatus("success");
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-1 text-sm font-medium text-green-600">Auth</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-1 text-sm font-medium text-green-600">Details</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-1 text-sm font-medium text-green-600">KYC</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-1 text-sm font-medium text-green-600">Contract</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-1 text-sm font-medium text-green-600">Allocation</span>
            </div>
            <div className="flex-1 mx-1 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                6
              </div>
              <span className="ml-1 text-sm font-medium text-blue-600">Payment</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
            <CardDescription>
              Complete your payment to finalize the cabin booking.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Payment Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cabin: {selectedCabin.name}</span>
                  <span>₹{selectedCabin.price.toLocaleString()}/month</span>
                </div>
                <div className="flex justify-between">
                  <span>Security Deposit</span>
                  <span>₹{selectedCabin.securityDeposit.toLocaleString()}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>₹{selectedCabin.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {paymentStatus === "pending" && (
              <>
                {/* Payment Method Selection */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`p-4 border rounded-lg text-left ${
                        paymentMethod === "card" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="font-medium">Credit/Debit Card</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setPaymentMethod("upi")}
                      className={`p-4 border rounded-lg text-left ${
                        paymentMethod === "upi" ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center">
                        <svg className="h-6 w-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="font-medium">UPI Payment</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Payment Form */}
                {paymentMethod === "card" && (
                  <div className="space-y-4">
                    <Input
                      label="Card Number"
                      name="cardNumber"
                      value={formData.cardNumber}
                      onChange={handleChange}
                      placeholder="1234 5678 9012 3456"
                      maxLength="19"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Expiry Date"
                        name="expiryDate"
                        value={formData.expiryDate}
                        onChange={handleChange}
                        placeholder="MM/YY"
                        maxLength="5"
                      />
                      <Input
                        label="CVV"
                        name="cvv"
                        value={formData.cvv}
                        onChange={handleChange}
                        placeholder="123"
                        maxLength="3"
                      />
                    </div>
                    <Input
                      label="Name on Card"
                      name="nameOnCard"
                      value={formData.nameOnCard}
                      onChange={handleChange}
                      placeholder="John Doe"
                    />
                  </div>
                )}

                {paymentMethod === "upi" && (
                  <div className="text-center py-8">
                    <div className="w-48 h-48 mx-auto bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                      <span className="text-gray-500">QR Code Placeholder</span>
                    </div>
                    <p className="text-sm text-gray-600">Scan QR code with any UPI app</p>
                    <p className="text-xs text-gray-500 mt-2">Or pay to UPI ID: ofissquare@paytm</p>
                  </div>
                )}
              </>
            )}

            {paymentStatus === "processing" && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Processing Payment...</h3>
                <p className="text-gray-600">Please wait while we process your payment.</p>
              </div>
            )}

            {paymentStatus === "success" && (
              <div className="text-center py-8">
                <svg className="mx-auto h-16 w-16 text-green-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Successful!</h3>
                <p className="text-gray-600 mb-6">Your payment has been processed successfully. Welcome to Ofis Square!</p>
                <Button onClick={() => navigate("/dashboard")} variant="primary">
                  Go to Dashboard
                </Button>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate("/allocation")}
                disabled={paymentStatus === "processing"}
              >
                Back
              </Button>
              {paymentStatus === "pending" && (
                <Button
                  variant="primary"
                  onClick={handlePayment}
                >
                  Pay ₹{selectedCabin.total.toLocaleString()}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
