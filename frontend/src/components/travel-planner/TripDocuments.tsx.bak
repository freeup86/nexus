import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  PlusIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  CloudArrowUpIcon,
  DocumentIcon,
  EyeIcon,
  CalendarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TripDocument {
  id: string;
  documentType: string;
  title: string;
  filePath: string;
  expiryDate: string;
  documentNumber: string;
  notes: string;
  createdAt: string;
}

interface TripDocumentsProps {
  tripId: string;
}

const TripDocuments: React.FC<TripDocumentsProps> = ({ tripId }) => {
  const { token } = useAuth();
  const [documents, setDocuments] = useState<TripDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDocument, setEditingDocument] = useState<TripDocument | null>(null);
  const [uploading, setUploading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const documentTypes = [
    { value: 'passport', label: 'Passport', icon: '📘', requiresExpiry: true },
    { value: 'visa', label: 'Visa', icon: '📋', requiresExpiry: true },
    { value: 'ticket', label: 'Flight Ticket', icon: '✈️', requiresExpiry: false },
    { value: 'booking', label: 'Hotel Booking', icon: '🏨', requiresExpiry: false },
    { value: 'insurance', label: 'Travel Insurance', icon: '🛡️', requiresExpiry: true },
    { value: 'vaccination', label: 'Vaccination Certificate', icon: '💉', requiresExpiry: true },
    { value: 'license', label: 'Driver\'s License', icon: '🪪', requiresExpiry: true },
    { value: 'other', label: 'Other', icon: '📄', requiresExpiry: false }
  ];

  const [documentForm, setDocumentForm] = useState({
    documentType: 'other',
    title: '',
    expiryDate: '',
    documentNumber: '',
    notes: '',
    file: null as File | null
  });

  useEffect(() => {
    fetchDocuments();
  }, [tripId]);

  const fetchDocuments = async () => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/documents`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDocuments(response.data.documents || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      
      // Check file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only PDF, JPG, PNG, DOC, and DOCX files are allowed');
        return;
      }
      
      setDocumentForm({ ...documentForm, file });
    }
  };

  const handleAddDocument = async () => {
    if (!documentForm.title) {
      toast.error('Please enter a document title');
      return;
    }

    if (!editingDocument && !documentForm.file) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setUploading(true);
      
      const formData = new FormData();
      formData.append('documentType', documentForm.documentType);
      formData.append('title', documentForm.title);
      formData.append('expiryDate', documentForm.expiryDate);
      formData.append('documentNumber', documentForm.documentNumber);
      formData.append('notes', documentForm.notes);
      
      if (documentForm.file) {
        formData.append('document', documentForm.file);
      }

      if (editingDocument) {
        await axios.put(
          `${apiUrl}/travel/trips/${tripId}/documents/${editingDocument.id}`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        toast.success('Document updated successfully');
      } else {
        await axios.post(
          `${apiUrl}/travel/trips/${tripId}/documents`,
          formData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            } 
          }
        );
        toast.success('Document uploaded successfully');
      }

      setShowAddModal(false);
      setEditingDocument(null);
      setDocumentForm({
        documentType: 'other',
        title: '',
        expiryDate: '',
        documentNumber: '',
        notes: '',
        file: null
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchDocuments();
    } catch (error) {
      console.error('Error saving document:', error);
      toast.error('Failed to save document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await axios.delete(
        `${apiUrl}/travel/trips/${tripId}/documents/${documentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  const handleEditDocument = (document: TripDocument) => {
    setEditingDocument(document);
    setDocumentForm({
      documentType: document.documentType,
      title: document.title,
      expiryDate: document.expiryDate || '',
      documentNumber: document.documentNumber || '',
      notes: document.notes || '',
      file: null
    });
    setShowAddModal(true);
  };

  const handleViewDocument = async (document: TripDocument) => {
    try {
      const response = await axios.get(
        `${apiUrl}/travel/trips/${tripId}/documents/${document.id}/view`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          responseType: 'blob'
        }
      );
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error('Failed to open document');
    }
  };

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType?.icon || '📄';
  };

  const getDocumentTypeLabel = (type: string) => {
    const docType = documentTypes.find(t => t.value === type);
    return docType?.label || type;
  };

  const getFileExtension = (filePath: string) => {
    return filePath.split('.').pop()?.toUpperCase() || '';
  };

  const isDocumentExpiring = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry > now;
  };

  const isDocumentExpired = (expiryDate: string) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    return expiry <= now;
  };

  const filteredDocuments = documents.filter(doc => 
    !filterType || doc.documentType === filterType
  );

  const currentDocumentType = documentTypes.find(t => t.value === documentForm.documentType);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Trip Documents</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-4 w-4 mr-2" />
          Add Document
        </button>
      </div>

      {/* Document Status Alert */}
      {documents.some(doc => isDocumentExpired(doc.expiryDate) || isDocumentExpiring(doc.expiryDate)) && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 mr-2" />
            <div>
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200">
                Document Expiry Alert
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Some of your documents are expired or expiring soon. Please check and renew them if necessary.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex justify-between items-center">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">All Document Types</option>
          {documentTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {documents.length === 0 ? 'No documents uploaded' : 'No documents match your filter'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {documents.length === 0 
              ? 'Upload important travel documents like passport, visa, tickets, and insurance'
              : 'Try selecting a different document type'
            }
          </p>
          {documents.length === 0 && (
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Upload Your First Document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocuments.map((document) => (
            <div
              key={document.id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 border-l-4 ${
                isDocumentExpired(document.expiryDate) 
                  ? 'border-red-500' 
                  : isDocumentExpiring(document.expiryDate)
                  ? 'border-yellow-500'
                  : 'border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getDocumentIcon(document.documentType)}</div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {document.title}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {getDocumentTypeLabel(document.documentType)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewDocument(document)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="View document"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleEditDocument(document)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Edit document"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(document.id)}
                    className="p-1 text-red-600 hover:bg-red-100 rounded"
                    title="Delete document"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {document.documentNumber && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">Number:</span> {document.documentNumber}
                </div>
              )}

              {document.expiryDate && (
                <div className={`text-sm mb-2 flex items-center ${
                  isDocumentExpired(document.expiryDate)
                    ? 'text-red-600'
                    : isDocumentExpiring(document.expiryDate)
                    ? 'text-yellow-600'
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  <span className="font-medium">Expires:</span> {new Date(document.expiryDate).toLocaleDateString()}
                  {isDocumentExpired(document.expiryDate) && <span className="ml-1">(Expired)</span>}
                  {isDocumentExpiring(document.expiryDate) && !isDocumentExpired(document.expiryDate) && <span className="ml-1">(Expiring Soon)</span>}
                </div>
              )}

              {document.filePath && (
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <DocumentIcon className="h-4 w-4 inline mr-1" />
                  {getFileExtension(document.filePath)} file
                </div>
              )}

              {document.notes && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {document.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Document Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md max-h-screen overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingDocument ? 'Edit Document' : 'Add Document'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Document Type</label>
                <select
                  value={documentForm.documentType}
                  onChange={(e) => setDocumentForm({...documentForm, documentType: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {documentTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Title *</label>
                <input
                  type="text"
                  value={documentForm.title}
                  onChange={(e) => setDocumentForm({...documentForm, title: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Document title"
                />
              </div>

              {!editingDocument && (
                <div>
                  <label className="block text-sm font-medium mb-1">File *</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Supported formats: PDF, JPG, PNG, DOC, DOCX (max 10MB)
                  </p>
                </div>
              )}

              {editingDocument && (
                <div>
                  <label className="block text-sm font-medium mb-1">Replace File (optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to keep existing file
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Document Number</label>
                <input
                  type="text"
                  value={documentForm.documentNumber}
                  onChange={(e) => setDocumentForm({...documentForm, documentNumber: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  placeholder="Passport number, ticket number, etc."
                />
              </div>

              {currentDocumentType?.requiresExpiry && (
                <div>
                  <label className="block text-sm font-medium mb-1">Expiry Date</label>
                  <input
                    type="date"
                    value={documentForm.expiryDate}
                    onChange={(e) => setDocumentForm({...documentForm, expiryDate: e.target.value})}
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={documentForm.notes}
                  onChange={(e) => setDocumentForm({...documentForm, notes: e.target.value})}
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                  placeholder="Additional information"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingDocument(null);
                  setDocumentForm({
                    documentType: 'other',
                    title: '',
                    expiryDate: '',
                    documentNumber: '',
                    notes: '',
                    file: null
                  });
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDocument}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {uploading && <CloudArrowUpIcon className="h-4 w-4 mr-2 animate-spin" />}
                {uploading ? 'Uploading...' : editingDocument ? 'Update' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDocuments;