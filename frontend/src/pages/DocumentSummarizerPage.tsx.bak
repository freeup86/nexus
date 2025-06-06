import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  DocumentTextIcon,
  CloudArrowUpIcon,
  SparklesIcon,
  DocumentArrowDownIcon,
  ClipboardDocumentIcon,
  TrashIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Summary {
  id: string;
  originalFilename: string;
  fileSize: number;
  summaryType: 'brief' | 'detailed' | 'bullets' | 'key-points';
  summary: string;
  keyPoints?: string[];
  wordCount: number;
  language: string;
  createdAt: string;
}

const DocumentSummarizerPage: React.FC = () => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [summaryType, setSummaryType] = useState<'brief' | 'detailed' | 'bullets' | 'key-points'>('brief');
  const [customPrompt, setCustomPrompt] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [inputMode, setInputMode] = useState<'file' | 'text'>('file');

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 
                         'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                         'text/plain', 'text/markdown'];
    
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a PDF, Word document, or text file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setInputMode('file');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleSummarize = async () => {
    if (inputMode === 'file' && !selectedFile) {
      toast.error('Please select a file to summarize');
      return;
    }

    if (inputMode === 'text' && !textInput.trim()) {
      toast.error('Please enter some text to summarize');
      return;
    }

    setIsProcessing(true);

    try {
      const formData = new FormData();
      
      if (inputMode === 'file' && selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', textInput);
      }
      
      formData.append('summaryType', summaryType);
      if (customPrompt) {
        formData.append('customPrompt', customPrompt);
      }

      // Log what we're sending for debugging
      console.log('Sending summarization request:', {
        inputMode,
        hasFile: inputMode === 'file' && !!selectedFile,
        hasText: inputMode === 'text' && !!textInput,
        summaryType,
        customPrompt
      });

      const response = await axios.post(
        `${apiUrl}/documents/summarize`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      const newSummary: Summary = {
        id: Date.now().toString(),
        originalFilename: selectedFile?.name || 'Text Input',
        fileSize: selectedFile?.size || textInput.length,
        summaryType,
        summary: response.data.summary,
        keyPoints: response.data.keyPoints,
        wordCount: response.data.wordCount,
        language: response.data.language || 'en',
        createdAt: new Date().toISOString(),
      };

      setSummaries([newSummary, ...summaries]);
      toast.success('Document summarized successfully!');
      
      // Reset form
      setSelectedFile(null);
      setTextInput('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Summarization error:', error);
      toast.error(error.response?.data?.error || 'Failed to summarize document');
    } finally {
      setIsProcessing(false);
    }
  };

  const copySummary = (summary: string) => {
    navigator.clipboard.writeText(summary);
    toast.success('Summary copied to clipboard!');
  };

  const deleteSummary = (id: string) => {
    setSummaries(summaries.filter(s => s.id !== id));
    toast.success('Summary deleted');
  };

  const downloadSummary = (summary: Summary) => {
    const content = `${summary.summary}\n\n${
      summary.keyPoints ? `Key Points:\n${summary.keyPoints.join('\n')}` : ''
    }`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary-${summary.originalFilename}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getSummaryTypeLabel = (type: string) => {
    switch (type) {
      case 'brief': return 'Brief Summary';
      case 'detailed': return 'Detailed Summary';
      case 'bullets': return 'Bullet Points';
      case 'key-points': return 'Key Points Only';
      default: return type;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            AI Document Summarizer
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Upload documents or paste text to get instant AI-powered summaries
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Input Document
            </h2>

            {/* Input Mode Tabs */}
            <div className="flex space-x-4 mb-6">
              <button
                onClick={() => setInputMode('file')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMode === 'file'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Upload File
              </button>
              <button
                onClick={() => setInputMode('text')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  inputMode === 'text'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                Paste Text
              </button>
            </div>

            {inputMode === 'file' ? (
              <>
                {/* File Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.txt,.md"
                    className="hidden"
                  />
                  <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-400 mb-2">
                    Drag and drop your document here, or
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    browse files
                  </button>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    PDF, Word, TXT, MD (Max 10MB)
                  </p>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-8 w-8 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatFileSize(selectedFile.size)}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                        }}
                        className="text-red-500 hover:text-red-700"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Text Input Area */}
                <textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste or type your text here..."
                  className="w-full h-64 p-4 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {textInput.length} characters
                </p>
              </>
            )}

            {/* Summary Options */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Summary Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                {(['brief', 'detailed', 'bullets', 'key-points'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSummaryType(type)}
                    className={`px-4 py-2 rounded-lg border transition-colors ${
                      summaryType === type
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                        : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {getSummaryTypeLabel(type)}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Prompt */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="e.g., Focus on technical details, Extract action items, Summarize in Spanish..."
                className="w-full h-20 p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={handleSummarize}
              disabled={isProcessing || (inputMode === 'file' ? !selectedFile : !textInput.trim())}
              className="w-full mt-6 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isProcessing ? (
                <>
                  <ArrowPathIcon className="h-5 w-5 mr-2 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5 mr-2" />
                  Generate Summary
                </>
              )}
            </button>
          </div>

          {/* Summaries Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Generated Summaries
            </h2>

            {summaries.length === 0 ? (
              <div className="text-center py-12">
                <DocumentTextIcon className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  No summaries yet. Upload a document to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {summaries.map((summary) => (
                  <div
                    key={summary.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {summary.originalFilename}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {getSummaryTypeLabel(summary.summaryType)} • {summary.wordCount} words
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => copySummary(summary.summary)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Copy summary"
                        >
                          <ClipboardDocumentIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => downloadSummary(summary)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                          title="Download summary"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => deleteSummary(summary.id)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete summary"
                        >
                          <TrashIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {summary.summary}
                      </p>
                      
                      {summary.keyPoints && summary.keyPoints.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            Key Points:
                          </h4>
                          <ul className="list-disc list-inside space-y-1">
                            {summary.keyPoints.map((point, index) => (
                              <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                                {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      {new Date(summary.createdAt).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentSummarizerPage;