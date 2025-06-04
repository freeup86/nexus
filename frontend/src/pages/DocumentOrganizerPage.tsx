import React, { useState, useEffect, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  DocumentIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  CalendarIcon,
  TagIcon,
  FolderIcon,
  BellIcon,
  ChartBarIcon,
  TrashIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { documentOrganizerService, Document, DocumentsResponse, Analytics, QuestionResponse } from '../services/documentOrganizerService';
import { debugAuth } from '../utils/debugAuth';
import FolderUpload from '../components/FolderUpload';

const DocumentOrganizerPage: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<'documents' | 'analytics' | 'reminders' | 'questions'>('documents');
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);
  const [questionInput, setQuestionInput] = useState('');
  const [questionResponse, setQuestionResponse] = useState<QuestionResponse | null>(null);
  const [askingQuestion, setAskingQuestion] = useState(false);

  // Load documents
  const loadDocuments = useCallback(async () => {
    try {
      setLoading(true);
      // Debug authentication
      debugAuth();
      
      const response = await documentOrganizerService.getDocuments({
        page: currentPage,
        category: selectedCategory,
        search: searchQuery
      });
      setDocuments(response.documents);
      setTotalPages(response.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load documents:', error);
      console.error('Error response:', error.response?.data);
      toast.error(error.response?.data?.error || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, searchQuery]);

  // Load analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const data = await documentOrganizerService.getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'documents') {
      loadDocuments();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    }
  }, [activeTab, currentPage, selectedCategory, loadDocuments, loadAnalytics]);

  // File upload handling
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress({ current: 0, total: acceptedFiles.length });

    try {
      // For large numbers of files, upload in batches
      const batchSize = 10;
      const batches = [];
      
      for (let i = 0; i < acceptedFiles.length; i += batchSize) {
        batches.push(acceptedFiles.slice(i, i + batchSize));
      }

      let totalUploaded = 0;
      
      for (const batch of batches) {
        const result = await documentOrganizerService.uploadDocuments(batch);
        totalUploaded += result.documents.length;
        setUploadProgress({ current: totalUploaded, total: acceptedFiles.length });
      }

      toast.success(`Successfully uploaded ${totalUploaded} document(s)`);
      loadDocuments();
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }, [loadDocuments]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.heic'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'text/plain': ['.txt']
    },
    multiple: true
  });

  // Natural language search
  const handleSearch = async () => {
    // Just reload documents with the search query
    // The loadDocuments function already handles the search parameter
    loadDocuments();
  };

  // Ask question about documents
  const handleAskQuestion = async () => {
    if (!questionInput.trim()) return;

    setAskingQuestion(true);
    try {
      const response = await documentOrganizerService.askQuestion(questionInput);
      setQuestionResponse(response);
    } catch (error: any) {
      console.error('Failed to ask question:', error);
      toast.error(error.response?.data?.error || 'Failed to process question');
    } finally {
      setAskingQuestion(false);
    }
  };

  // Delete document
  const handleDelete = async (document: Document) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await documentOrganizerService.deleteDocument(document.id);
      toast.success('Document deleted');
      loadDocuments();
      setSelectedDocument(null);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'failed':
        return <ExclamationCircleIcon className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Document Organizer
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload, organize, and search all your documents with AI-powered insights
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <DocumentIcon className="h-5 w-5 inline-block mr-2" />
            Documents
          </button>
          <button
            onClick={() => setActiveTab('questions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'questions'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <QuestionMarkCircleIcon className="h-5 w-5 inline-block mr-2" />
            Ask Questions
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChartBarIcon className="h-5 w-5 inline-block mr-2" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reminders'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <BellIcon className="h-5 w-5 inline-block mr-2" />
            Reminders
            {analytics && analytics.upcomingReminders.length > 0 && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {analytics.upcomingReminders.length}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Documents Tab */}
      {activeTab === 'documents' && (
        <div>
          {/* Upload Area */}
          <div
            {...getRootProps()}
            className={`mb-6 border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
          >
            <input {...getInputProps()} />
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            {isDragActive ? (
              <p className="text-lg text-gray-600 dark:text-gray-400">Drop the files here...</p>
            ) : (
              <>
                <p className="text-lg text-gray-600 dark:text-gray-400">
                  Drag & drop documents here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                  Supports PDF, Images, Word, Excel, and Text files (up to 50MB)
                </p>
              </>
            )}
            {uploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-2">
                  {uploadProgress 
                    ? `Uploading ${uploadProgress.current} of ${uploadProgress.total} files...`
                    : 'Uploading...'}
                </p>
                {uploadProgress && uploadProgress.total > 1 && (
                  <div className="mt-2 w-64 mx-auto">
                    <div className="bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                      <div 
                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Folder Upload Option */}
          <div className="mb-6 flex items-center justify-center">
            <FolderUpload onFilesSelected={onDrop} isUploading={uploading} />
            <span className="ml-4 text-sm text-gray-500 dark:text-gray-400">
              or select multiple files from a folder
            </span>
          </div>

          {/* Search and Filters */}
          <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="Search by filename or content..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  Search
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      loadDocuments();
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="">All Categories</option>
                <option value="Receipt">Receipt</option>
                <option value="Invoice">Invoice</option>
                <option value="Contract">Contract</option>
                <option value="Warranty">Warranty</option>
                <option value="Medical">Medical</option>
                <option value="Tax">Tax</option>
                <option value="Insurance">Insurance</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Documents Grid */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="text-gray-500 mt-4">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-12">
              <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-4">No documents found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="text-2xl mr-2">
                        {documentOrganizerService.getDocumentIcon(doc.fileType)}
                      </div>
                      {getStatusIcon(doc.status)}
                    </div>
                    <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                      {doc.originalName}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                      {documentOrganizerService.formatFileSize(doc.fileSize)}
                    </p>
                    {doc.categories && doc.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {doc.categories.map((cat) => (
                          <span
                            key={cat.id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            style={{
                              backgroundColor: `${cat.category.color}20`,
                              color: cat.category.color
                            }}
                          >
                            {cat.category.icon} {cat.category.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex justify-center">
              <nav className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-3 py-1 text-gray-700 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && analytics && (
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <DocumentIcon className="h-8 w-8 text-indigo-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Documents</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.totalDocuments}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <FolderIcon className="h-8 w-8 text-green-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Categories Used</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.categoryCounts.length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <BellIcon className="h-8 w-8 text-red-600 mr-3" />
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Reminders</p>
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                    {analytics.upcomingReminders.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Documents by Category
            </h3>
            <div className="space-y-3">
              {analytics.categoryCounts.map((cat) => (
                <div key={cat.category} className="flex items-center">
                  <span className="w-32 text-sm text-gray-600 dark:text-gray-400">
                    {cat.category}
                  </span>
                  <div className="flex-1 mx-4">
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{
                          width: `${(cat.count / analytics.totalDocuments) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {cat.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Documents */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Recent Documents
            </h3>
            <div className="space-y-2">
              {analytics.recentDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {doc.originalName}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(doc.uploadDate).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Reminders Tab */}
      {activeTab === 'reminders' && analytics && (
        <div className="space-y-4">
          {analytics.upcomingReminders.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <BellIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="text-gray-500 mt-4">No upcoming reminders</p>
            </div>
          ) : (
            analytics.upcomingReminders.map((reminder) => (
              <div
                key={reminder.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {reminder.description}
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {reminder.document.originalName}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Due: {new Date(reminder.reminderDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      reminder.reminderType === 'expiration'
                        ? 'bg-red-100 text-red-800'
                        : reminder.reminderType === 'renewal'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {reminder.reminderType}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Questions Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Question Input */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Ask Questions About Your Documents
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Ask questions like "How much did I spend on taxes last year?" or "Show me all receipts from December"
            </p>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <textarea
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleAskQuestion()}
                  placeholder="Type your question here..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                />
              </div>
              <div className="flex-shrink-0">
                <button
                  onClick={handleAskQuestion}
                  disabled={!questionInput.trim() || askingQuestion}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {askingQuestion ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Thinking...
                    </div>
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </div>

            {/* Quick question examples */}
            <div className="mt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Example questions:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "How much did I spend on taxes last year?",
                  "Show me all medical receipts",
                  "What contracts expire this year?",
                  "Total insurance payments in 2024"
                ].map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setQuestionInput(example)}
                    className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Question Response */}
          {questionResponse && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  Question: {questionResponse.question}
                </h4>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                    {questionResponse.answer}
                  </p>
                </div>
              </div>

              {questionResponse.calculations && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Calculations:</h5>
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{questionResponse.calculations}</p>
                  </div>
                </div>
              )}

              {questionResponse.relevantDocuments && questionResponse.relevantDocuments.length > 0 && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Relevant Documents:</h5>
                  <div className="space-y-1">
                    {questionResponse.relevantDocuments.map((doc, index) => (
                      <span
                        key={index}
                        className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded dark:bg-gray-700 dark:text-gray-300 mr-2 mb-1"
                      >
                        📄 {doc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {questionResponse.suggestions && (
                <div className="mb-4">
                  <h5 className="font-medium text-gray-900 dark:text-white mb-2">Suggestions:</h5>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300">{questionResponse.suggestions}</p>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 dark:text-gray-400">
                Analyzed {questionResponse.totalDocuments} documents
              </div>
            </div>
          )}
        </div>
      )}

      {/* Document Detail Modal */}
      {selectedDocument && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>
            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {selectedDocument.originalName}
                  </h3>
                  <button
                    onClick={() => setSelectedDocument(null)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      Document Information
                    </h4>
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm text-gray-500">File Size</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {documentOrganizerService.formatFileSize(selectedDocument.fileSize)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Upload Date</dt>
                        <dd className="text-sm text-gray-900 dark:text-white">
                          {new Date(selectedDocument.uploadDate).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-sm text-gray-500">Status</dt>
                        <dd className="flex items-center text-sm">
                          {getStatusIcon(selectedDocument.status)}
                          <span className="ml-2">{selectedDocument.status}</span>
                        </dd>
                      </div>
                      {selectedDocument.ocrConfidence && (
                        <div>
                          <dt className="text-sm text-gray-500">OCR Confidence</dt>
                          <dd className="text-sm text-gray-900 dark:text-white">
                            {(selectedDocument.ocrConfidence * 100).toFixed(1)}%
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  {/* Extracted Data */}
                  {selectedDocument.extractedData && selectedDocument.extractedData.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Extracted Information
                      </h4>
                      <dl className="space-y-2">
                        {selectedDocument.extractedData.map((data) => (
                          <div key={data.id}>
                            <dt className="text-sm text-gray-500 capitalize">
                              {data.fieldName.replace(/_/g, ' ')}
                            </dt>
                            <dd className="text-sm text-gray-900 dark:text-white">
                              {data.fieldValue}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    </div>
                  )}
                </div>

                {/* Categories and Tags */}
                <div className="mt-6">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                    Categories & Tags
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedDocument.categories?.map((cat) => (
                      <span
                        key={cat.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${cat.category.color}20`,
                          color: cat.category.color
                        }}
                      >
                        {cat.category.icon} {cat.category.name}
                        {!cat.isManual && (
                          <span className="ml-1 text-xs opacity-75">
                            ({(cat.confidence * 100).toFixed(0)}%)
                          </span>
                        )}
                      </span>
                    ))}
                    {selectedDocument.tags?.map((tag) => (
                      <span
                        key={tag.id}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                      >
                        <TagIcon className="h-4 w-4 mr-1" />
                        {tag.tag.name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    onClick={() => handleDelete(selectedDocument)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                  <a
                    href={`/api/document-organizer/documents/${selectedDocument.id}/download`}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Download
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentOrganizerPage;