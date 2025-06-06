import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { useDropzone } from 'react-dropzone';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  ClipboardDocumentIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ExtractionResult {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  extractedText?: string;
  error?: string;
  createdAt: string;
  processingTime?: number;
}

const TextExtractorPage: React.FC = () => {
  const { token } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [recentExtractions, setRecentExtractions] = useState<ExtractionResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setExtractionResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const extractText = async () => {
    if (!file) {
      toast.error('Please select a file first');
      return;
    }

    setIsExtracting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post(
        `${apiUrl}/text-extractor/extract`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      setExtractionResult(response.data.extraction);
      toast.success('Text extracted successfully!');
      fetchRecentExtractions();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to extract text');
    } finally {
      setIsExtracting(false);
    }
  };

  const fetchRecentExtractions = async () => {
    try {
      const response = await axios.get(`${apiUrl}/text-extractor/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 10 }
      });
      setRecentExtractions(response.data.extractions || []);
    } catch (error) {
      console.error('Failed to fetch extraction history:', error);
    }
  };

  const copyToClipboard = () => {
    if (extractionResult?.extractedText) {
      navigator.clipboard.writeText(extractionResult.extractedText);
      toast.success('Copied to clipboard!');
    }
  };

  const downloadText = () => {
    if (extractionResult?.extractedText) {
      const blob = new Blob([extractionResult.extractedText], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${extractionResult.fileName.split('.')[0]}_extracted.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'PROCESSING':
        return <ClockIcon className="h-5 w-5 text-yellow-500 animate-pulse" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  React.useEffect(() => {
    fetchRecentExtractions();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Text Extractor</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Extract text from PDFs, Word documents, and images using AI-powered OCR
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <CloudArrowUpIcon className="h-6 w-6 mr-2 text-indigo-500" />
            Upload Document
          </h2>

          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }
            `}
          >
            <input {...getInputProps()} />
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
            {isDragActive ? (
              <p className="text-indigo-600 dark:text-indigo-400">Drop the file here...</p>
            ) : (
              <>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Drag & drop a file here, or click to select
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Supports PDF, DOC, DOCX, and images (max 10MB)
                </p>
              </>
            )}
          </div>

          {file && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <DocumentTextIcon className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {file.name}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    ({formatFileSize(file.size)})
                  </span>
                </div>
                <button
                  onClick={() => {
                    setFile(null);
                    setExtractionResult(null);
                  }}
                  className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                >
                  <XCircleIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}

          <button
            onClick={extractText}
            disabled={!file || isExtracting}
            className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isExtracting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                Extracting...
              </>
            ) : (
              'Extract Text'
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <DocumentTextIcon className="h-6 w-6 mr-2 text-green-500" />
            Extracted Text
          </h2>

          {extractionResult ? (
            <>
              <div className="mb-4 flex items-center justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {extractionResult.fileName}
                </span>
                {extractionResult.processingTime && (
                  <span className="text-gray-500 dark:text-gray-400">
                    Processed in {(extractionResult.processingTime / 1000).toFixed(2)}s
                  </span>
                )}
              </div>

              {extractionResult.status === 'COMPLETED' && extractionResult.extractedText ? (
                <>
                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300">
                      {extractionResult.extractedText}
                    </pre>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={copyToClipboard}
                      className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <ClipboardDocumentIcon className="h-5 w-5 mr-2" />
                      Copy
                    </button>
                    <button
                      onClick={downloadText}
                      className="flex-1 flex justify-center items-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
                      Download
                    </button>
                  </div>
                </>
              ) : extractionResult.status === 'FAILED' ? (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-400">
                    {extractionResult.error || 'Failed to extract text from the document'}
                  </p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
                  <p className="mt-4 text-gray-500 dark:text-gray-400">Processing...</p>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <DocumentTextIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No text extracted yet</p>
              <p className="text-sm mt-2">Upload a document and click "Extract Text"</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Extractions */}
      <div className="mt-8">
        <button
          onClick={() => setShowHistory(!showHistory)}
          className="mb-4 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium"
        >
          {showHistory ? 'Hide' : 'Show'} Recent Extractions
        </button>

        {showHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recent Extractions
              </h3>
            </div>
            {recentExtractions.length === 0 ? (
              <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                No extraction history yet
              </div>
            ) : (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {recentExtractions.map((extraction) => (
                  <div key={extraction.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(extraction.status)}
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {extraction.fileName}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(extraction.fileSize)} • {new Date(extraction.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {extraction.processingTime && (
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {(extraction.processingTime / 1000).toFixed(2)}s
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TextExtractorPage;