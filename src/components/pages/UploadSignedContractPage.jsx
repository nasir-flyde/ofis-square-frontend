import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { Input, Textarea } from "../ui/Input";
import { useApi } from "../../hooks/useApi";

export function UploadSignedContractPage() {
  const navigate = useNavigate();
  const { contractId } = useParams();
  const { client: api } = useApi();
  
  const [contract, setContract] = useState(null);
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadMethod, setUploadMethod] = useState('file'); // 'file' or 'url'

  useEffect(() => {
    if (contractId) {
      fetchContract();
    }
  }, [contractId]);

  const fetchContract = async () => {
    try {
      const { data } = await api.get(`/api/contracts/${contractId}`);
      setContract(data);
    } catch (error) {
      setError('Failed to fetch contract details');
      console.error('Failed to fetch contract:', error);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload a PDF or image file (PNG, JPEG)');
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (uploadMethod === 'file' && !file) {
      setError('Please select a file to upload');
      return;
    }
    
    if (uploadMethod === 'url' && !fileUrl.trim()) {
      setError('Please provide a file URL');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      
      if (uploadMethod === 'file') {
        formData.append('file', file);
      } else {
        formData.append('fileUrl', fileUrl);
      }
      
      if (notes.trim()) {
        formData.append('notes', notes);
      }

      const { data } = await api.post(`/api/contracts/${contractId}/upload-signed`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Success - redirect to allocation page
      alert('Signed contract uploaded successfully! Contract is now active.');
      navigate('/allocation');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload signed contract');
    } finally {
      setLoading(false);
    }
  };

  const downloadOriginalPDF = async () => {
    try {
      const response = await api.get(`/api/contracts/${contractId}/download-pdf`, {
        responseType: 'blob',
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract_${contract?.client?.companyName?.replace(/[^a-zA-Z0-9]/g, '_') || contractId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Failed to download original contract PDF');
    }
  };

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Loading contract details...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Upload Signed Contract</CardTitle>
            <CardDescription>
              Upload the signed contract document to activate the agreement.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Contract Details */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Contract Details</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <div>Client: {contract.client?.companyName}</div>
                <div>Contact: {contract.client?.contactPerson}</div>
                <div>Building: {contract.building?.name || 'TBD'}</div>
                <div>Capacity: {contract.capacity || 'N/A'} seats</div>
                <div>Monthly Rent: ₹{contract.monthlyRent?.toLocaleString() || '15,000'}</div>
                <div>Status: <span className="font-medium">{contract.status}</span></div>
              </div>
              
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={downloadOriginalPDF}
                className="mt-3"
              >
                Download Original Contract PDF
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Upload Method Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Upload Method
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setUploadMethod('file')}
                    className={`p-4 border rounded-lg text-left ${
                      uploadMethod === 'file' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="font-medium">Upload File</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUploadMethod('url')}
                    className={`p-4 border rounded-lg text-left ${
                      uploadMethod === 'url' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                      </svg>
                      <span className="font-medium">Provide URL</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* File Upload */}
              {uploadMethod === 'file' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Signed Contract File
                  </label>
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, PNG, JPEG (max 10MB)
                  </p>
                  {file && (
                    <div className="mt-2 text-sm text-green-600">
                      Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}
                </div>
              )}

              {/* URL Input */}
              {uploadMethod === 'url' && (
                <Input
                  label="File URL"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                  placeholder="https://example.com/signed-contract.pdf"
                  required
                />
              )}

              {/* Notes */}
              <Textarea
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the signed contract..."
                rows={3}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/contracts')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                >
                  {loading ? 'Uploading...' : 'Upload Signed Contract'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
