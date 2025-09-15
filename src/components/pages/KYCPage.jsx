import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card";
import { Button } from "../ui/Button";
import { useApi } from "../../hooks/useApi";

export function KYCPage() {
  const navigate = useNavigate();
  const { client: api } = useApi();
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showDocumentTypeSelector, setShowDocumentTypeSelector] = useState(true);
  const [selectedDocumentType, setSelectedDocumentType] = useState('');
  const [customDocumentName, setCustomDocumentName] = useState('');

  // Predefined document types with keys
  const documentTypes = [
    { key: 'pan_card', name: 'PAN Card' },
    { key: 'aadhar_card', name: 'Aadhar Card' },
    { key: 'gst_certificate', name: 'GST Certificate' },
    { key: 'incorporation_certificate', name: 'Certificate of Incorporation' },
    { key: 'moa', name: 'Memorandum of Association (MOA)' },
    { key: 'aoa', name: 'Articles of Association (AOA)' },
    { key: 'bank_statement', name: 'Bank Statement' },
    { key: 'address_proof', name: 'Address Proof' },
    { key: 'director_id', name: 'Director ID Proof' },
    { key: 'other', name: 'Other Document' }
  ];

  const validateDocumentType = () => {
    if (!selectedDocumentType) {
      return false;
    }
    
    if (selectedDocumentType === 'other' && !customDocumentName.trim()) {
      return false;
    }

    // Check if this document type already exists
    const existingDoc = selectedDocuments.find(doc => 
      doc.documentType === selectedDocumentType && 
      (selectedDocumentType !== 'other' || doc.customName === customDocumentName)
    );
    
    if (existingDoc) {
      setError(`${selectedDocumentType === 'other' ? customDocumentName : documentTypes.find(t => t.key === selectedDocumentType)?.name} has already been added.`);
      return false;
    }

    setError("");
    return true;
  };

  const handleFileSelect = (files) => {
    const fileList = Array.from(files);
    const validFiles = fileList.filter(file => {
      const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      const maxSize = 10 * 1024 * 1024; // 10MB
      return validTypes.includes(file.type) && file.size <= maxSize;
    });

    if (validFiles.length !== fileList.length) {
      setError("Some files were rejected. Please upload only PDF, JPG, PNG, DOC, or DOCX files under 10MB.");
      return;
    }

    if (validFiles.length === 0) {
      setError("No valid files selected.");
      return;
    }

    // Take only the first file for the selected document type
    const file = validFiles[0];
    const newDocument = {
      id: Date.now() + Math.random(),
      file: file,
      documentType: selectedDocumentType,
      customName: selectedDocumentType === 'other' ? customDocumentName : ''
    };

    setSelectedDocuments(prev => [...prev, newDocument]);
    
    // After upload: hide selector and show only the list with '+ Add Another Document'
    setShowDocumentTypeSelector(false);
    setSelectedDocumentType('');
    setCustomDocumentName('');
    setError("");
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (!validateDocumentType()) {
      return;
    }
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const removeDocument = (id) => {
    setSelectedDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const addAnotherDocument = () => {
    setShowDocumentTypeSelector(true);
    setSelectedDocumentType('');
    setCustomDocumentName('');
    setError("");
  };

  const cancelAddDocument = () => {
    setShowDocumentTypeSelector(false);
    setSelectedDocumentType('');
    setCustomDocumentName('');
    setError("");
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedDocuments.length === 0) {
      setError("Please select at least one document to upload.");
      return;
    }

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      
      // Add each document with its type as the key
      selectedDocuments.forEach((doc) => {
        const fieldName = doc.documentType === 'other' && doc.customName 
          ? `other_${doc.customName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`
          : doc.documentType;
        
        formData.append(fieldName, doc.file);
      });
      
      // Get the client ID created in DetailsPage
      const clientId = localStorage.getItem("ofis_current_client_id");
      if (!clientId) {
        setError("Missing client ID. Please complete Company Details first.");
        setUploading(false);
        return;
      }
      
      await api.post(`/api/clients/${clientId}/kyc`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Navigate to contract page after successful KYC upload
      navigate("/contract");
    } catch (error) {
      setError(error.response?.data?.error || "Failed to upload documents. Please try again.");
    } finally {
      setUploading(false);
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
            <div className="flex-1 mx-4 h-px bg-green-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 text-green-600 rounded-full text-sm font-medium">
                ✓
              </div>
              <span className="ml-2 text-sm font-medium text-green-600">Company Details</span>
            </div>
            <div className="flex-1 mx-4 h-px bg-gray-300"></div>
            <div className="flex items-center">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                3
              </div>
              <span className="ml-2 text-sm font-medium text-blue-600">KYC Documents</span>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>KYC Document Upload</CardTitle>
            <CardDescription>
              Please upload your KYC documents for verification. Accepted formats: PDF, JPG, PNG, DOC, DOCX (Max 10MB each)
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Document Type Selection and File Upload - Only show when adding documents */}
              {showDocumentTypeSelector && selectedDocuments.length === 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Select Document Type and Upload</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Document Type *
                      </label>
                      <select
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select document type...</option>
                        {documentTypes.map(type => (
                          <option key={type.key} value={type.key}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedDocumentType === 'other' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Document Name *
                        </label>
                        <input
                          type="text"
                          value={customDocumentName}
                          onChange={(e) => setCustomDocumentName(e.target.value)}
                          placeholder="Enter document name..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Type Selection when adding another document */}
              {showDocumentTypeSelector && selectedDocuments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Add Another Document</h4>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={cancelAddDocument}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Document Type *
                      </label>
                      <select
                        value={selectedDocumentType}
                        onChange={(e) => setSelectedDocumentType(e.target.value)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      >
                        <option value="">Select document type...</option>
                        {documentTypes.map(type => (
                          <option key={type.key} value={type.key}>
                            {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {selectedDocumentType === 'other' && (
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Custom Document Name *
                        </label>
                        <input
                          type="text"
                          value={customDocumentName}
                          onChange={(e) => setCustomDocumentName(e.target.value)}
                          placeholder="Enter document name..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          required
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* File Upload Area - Show when document type is selected and adding documents */}
              {showDocumentTypeSelector && selectedDocumentType && (selectedDocumentType !== 'other' || customDocumentName.trim()) && (
                <div className="space-y-4">
                  <div
                    className={`relative border-2 border-dashed rounded-lg p-6 transition-colors ${
                      dragActive 
                        ? "border-blue-400 bg-blue-50" 
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="mt-4">
                        <label htmlFor="file-upload" className="cursor-pointer">
                          <span className="mt-2 block text-sm font-medium text-gray-900">
                            Drop file here or click to upload
                          </span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            className="sr-only"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                        </label>
                        <p className="mt-1 text-xs text-gray-500">
                          PDF, JPG, PNG, DOC, DOCX up to 10MB
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Selected Documents List */}
              {selectedDocuments.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Uploaded Documents ({selectedDocuments.length}):</h4>
                    {!showDocumentTypeSelector && (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={addAnotherDocument}
                        className="text-xs"
                      >
                        + Add Another Document
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3">
                    {selectedDocuments.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {doc.documentType === 'other' ? doc.customName : documentTypes.find(t => t.key === doc.documentType)?.name}
                            </p>
                            <p className="text-xs text-gray-500">{doc.file.name} • {formatFileSize(doc.file.size)}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDocument(doc.id)}
                          className="text-red-400 hover:text-red-600"
                        >
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/details")}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={uploading}
                  disabled={selectedDocuments.length === 0}
                >
                  {uploading ? "Uploading..." : "Upload & Continue"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
