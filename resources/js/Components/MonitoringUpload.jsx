import React, { useState } from 'react';
import axios from 'axios';

/**
 * MonitoringUpload Component
 * 
 * Handles file uploads for monitoring record proof documents.
 * Provides client-side validation, upload queue display, and document management.
 * 
 * Requirements: 1.2, 1.3, 1.6, 1.7, 1.8, 1.9
 */
export default function MonitoringUpload({
  monitoringRecordId,
  existingDocuments = [],
  onUploadSuccess = () => {},
  onUploadError = () => {},
  maxFileSize = 10485760, // 10MB in bytes
  allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
}) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState([]);
  const [documents, setDocuments] = useState(existingDocuments);

  // Get CSRF token
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

  /**
   * Validate a single file for size and type
   * Requirements: 1.2, 1.3
   */
  const validateFile = (file) => {
    const errors = [];

    // Check file size (max 10MB)
    if (file.size > maxFileSize) {
      errors.push(`File size exceeds 10MB limit (${(file.size / 1048576).toFixed(2)}MB)`);
    }

    // Check file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'];
    
    if (!allowedExtensions.includes(fileExtension)) {
      errors.push(`File type not allowed. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX`);
    }

    // Check mime type
    if (!allowedTypes.includes(file.type)) {
      errors.push(`Invalid file type: ${file.type}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Handle file selection
   * Requirements: 1.2, 1.3
   */
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    const validFiles = [];
    const validationErrors = [];

    files.forEach((file) => {
      const validation = validateFile(file);
      
      if (validation.isValid) {
        validFiles.push(file);
      } else {
        validationErrors.push({
          file: file.name,
          errors: validation.errors,
        });
      }
    });

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    } else {
      setErrors([]);
    }

    // Reset input
    event.target.value = '';
  };

  /**
   * Remove a file from the upload queue
   */
  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  /**
   * Upload files to the server
   * Requirements: 1.6, 1.7
   */
  const uploadFiles = async () => {
    if (selectedFiles.length === 0) {
      setErrors([{ file: 'general', errors: ['Please select at least one file to upload'] }]);
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setErrors([]);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('documents[]', file);
      });

      const response = await axios.post(
        `/admin/api/monitoring-records/${monitoringRecordId}/documents`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRF-TOKEN': csrf(),
          },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          },
        }
      );

      if (response.data.success) {
        // Update documents list
        setDocuments((prev) => [...prev, ...response.data.documents]);
        
        // Clear selected files
        setSelectedFiles([]);
        setUploadProgress(0);
        
        // Show any partial errors
        if (response.data.errors && response.data.errors.length > 0) {
          setErrors(response.data.errors);
        }
        
        // Call success callback
        onUploadSuccess(response.data.documents);
      } else {
        setErrors([{ file: 'general', errors: [response.data.message || 'Upload failed'] }]);
        onUploadError(response.data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      
      const errorMessage = error.response?.data?.message || 'Failed to upload files. Please try again.';
      const errorDetails = error.response?.data?.errors || [];
      
      setErrors([{ file: 'general', errors: [errorMessage] }, ...errorDetails]);
      onUploadError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  /**
   * Download a document
   * Requirements: 1.8
   */
  const downloadDocument = async (documentId, filename) => {
    try {
      const response = await axios.get(
        `/admin/api/monitoring-documents/${documentId}/download`,
        {
          responseType: 'blob',
          headers: {
            'X-CSRF-TOKEN': csrf(),
          },
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setErrors([{ file: filename, errors: ['Failed to download file'] }]);
    }
  };

  /**
   * Delete a document
   * Requirements: 1.9
   */
  const deleteDocument = async (documentId, filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}"?`)) {
      return;
    }

    try {
      const response = await axios.delete(
        `/admin/api/monitoring-documents/${documentId}`,
        {
          headers: {
            'X-CSRF-TOKEN': csrf(),
          },
        }
      );

      if (response.data.success) {
        // Remove from documents list
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
      } else {
        setErrors([{ file: filename, errors: [response.data.message || 'Failed to delete file'] }]);
      }
    } catch (error) {
      console.error('Delete error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to delete file';
      setErrors([{ file: filename, errors: [errorMessage] }]);
    }
  };

  /**
   * Format file size for display
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  /**
   * Format date for display
   */
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="monitoring-upload">
      {/* File Upload Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
        <h4 className="text-sm font-semibold text-gray-800 mb-3">Upload Proof Documents</h4>
        
        {/* File Input */}
        <div className="mb-3">
          <label className="file-upload-button inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg cursor-pointer hover:bg-emerald-700 transition-colors" style={{ minWidth: '44px', minHeight: '44px' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Select Files
            <input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={uploading}
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">
            Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX (Max 10MB per file)
          </p>
        </div>

        {/* Upload Queue */}
        {selectedFiles.length > 0 && (
          <div className="mb-3">
            <h5 className="text-xs font-medium text-gray-700 mb-2">Selected Files ({selectedFiles.length})</h5>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    disabled={uploading}
                    className="ml-2 text-red-600 hover:text-red-800 disabled:opacity-50"
                    aria-label="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {uploading && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800 mb-1">Upload Errors:</p>
            <ul className="text-xs text-red-700 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>
                  <strong>{error.file}:</strong> {error.errors.join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File(s)`}
          </button>
        )}
      </div>

      {/* Existing Documents List */}
      {documents.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-3">
            Uploaded Documents ({documents.length})
          </h4>
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 truncate">{doc.original_filename}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(doc.file_size)} • Uploaded {formatDate(doc.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-2">
                  <button
                    onClick={() => downloadDocument(doc.id, doc.original_filename)}
                    className="text-emerald-600 hover:text-emerald-800 text-xs font-medium"
                    aria-label="Download"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  <button
                    onClick={() => deleteDocument(doc.id, doc.original_filename)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
                    aria-label="Delete"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {documents.length === 0 && selectedFiles.length === 0 && (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 text-center">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-sm text-gray-600">No documents uploaded yet</p>
          <p className="text-xs text-gray-500 mt-1">Upload proof documents to support this monitoring record</p>
        </div>
      )}
    </div>
  );
}
