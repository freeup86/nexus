import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertTriangle, Calendar, Download, Clock, ChevronDown, ChevronUp, X, File, CheckCircle } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

interface ContractAnalysis {
  id: string;
  fileName: string;
  uploadDate: Date;
  summary: string;
  keyTerms: string[];
  potentialRisks: string[];
  obligations: string[];
  importantDates: { date: string; description: string }[];
  plainEnglishExplanation: string;
  contractType?: string;
  parties?: string[];
}

const ContractAnalyzerPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentAnalysis, setCurrentAnalysis] = useState<ContractAnalysis | null>(null);
  const [analysisHistory, setAnalysisHistory] = useState<ContractAnalysis[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    keyTerms: true,
    risks: true,
    obligations: true,
    dates: true,
    explanation: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelection(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelection = (file: File) => {
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const allowedExtensions = ['.pdf', '.doc', '.docx'];
    
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      setError('Please upload a PDF, DOC, or DOCX file');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setError('File size must be less than 10MB');
      return;
    }
    
    setError(null);
    setSelectedFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const analyzeContract = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('contract', selectedFile);

      // Get auth token
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to analyze contracts');
        return;
      }

      // Make API call to analyze contract
      const response = await axios.post(`${API_URL}/contracts/analyze`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });

      const { contract, analysis } = response.data;

      // Transform the response to match our interface
      const transformedAnalysis: ContractAnalysis = {
        id: contract.id,
        fileName: contract.fileName,
        uploadDate: new Date(contract.createdAt),
        summary: analysis.summary,
        keyTerms: analysis.keyTerms,
        potentialRisks: analysis.risks,
        obligations: analysis.obligations.party1 ? 
          [...(analysis.obligations.party1 || []), ...(analysis.obligations.party2 || [])] : 
          analysis.obligations,
        importantDates: analysis.importantDates,
        plainEnglishExplanation: analysis.plainEnglish,
        contractType: contract.fileType,
        parties: analysis.obligations.party1 && analysis.obligations.party2 ? 
          ['Party 1', 'Party 2'] : undefined
      };

      setCurrentAnalysis(transformedAnalysis);
      setAnalysisHistory(prev => [transformedAnalysis, ...prev]);
      setSelectedFile(null);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Please log in to analyze contracts');
      } else if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError('Failed to analyze contract. Please try again.');
      }
      console.error('Contract analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const downloadAnalysis = (analysis: ContractAnalysis) => {
    const content = `
Contract Analysis Report
========================
File: ${analysis.fileName}
Analyzed: ${analysis.uploadDate.toLocaleString()}
Type: ${analysis.contractType || 'N/A'}
Parties: ${analysis.parties?.join(', ') || 'N/A'}

SUMMARY
-------
${analysis.summary}

KEY TERMS AND CONDITIONS
------------------------
${analysis.keyTerms.map(term => `• ${term}`).join('\n')}

POTENTIAL RISKS
---------------
${analysis.potentialRisks.map(risk => `⚠️ ${risk}`).join('\n')}

IMPORTANT OBLIGATIONS
--------------------
${analysis.obligations.map(obligation => `✓ ${obligation}`).join('\n')}

IMPORTANT DATES
---------------
${analysis.importantDates.map(item => `• ${item.date}: ${item.description}`).join('\n')}

PLAIN ENGLISH EXPLANATION
-------------------------
${analysis.plainEnglishExplanation}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contract-analysis-${analysis.fileName.replace(/\.[^/.]+$/, '')}-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Contract Analyzer</h1>
        <p className="text-gray-600">Upload and analyze legal contracts to understand key terms, risks, and obligations</p>
      </div>

      {/* File Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Contract</h2>
        
        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx"
            onChange={handleFileInput}
          />
          
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          
          {selectedFile ? (
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-2">
                <File className="h-5 w-5 text-blue-500" />
                <span className="font-medium text-gray-700">{selectedFile.name}</span>
                <button
                  onClick={() => setSelectedFile(null)}
                  className="ml-2 p-1 hover:bg-gray-100 rounded"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              <p className="text-sm text-gray-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <>
              <p className="text-gray-600 mb-2">
                Drag and drop your contract here, or{' '}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: PDF, DOC, DOCX (Max 10MB)
              </p>
            </>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <button
          onClick={analyzeContract}
          disabled={!selectedFile || isAnalyzing}
          className={`mt-6 w-full py-3 px-4 rounded-md font-medium transition-colors ${
            selectedFile && !isAnalyzing
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isAnalyzing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Analyzing Contract...
            </span>
          ) : (
            'Analyze Contract'
          )}
        </button>
      </div>

      {/* Current Analysis Results */}
      {currentAnalysis && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold">Analysis Results</h2>
              <p className="text-sm text-gray-600 mt-1">{currentAnalysis.fileName}</p>
            </div>
            <button
              onClick={() => downloadAnalysis(currentAnalysis)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Report
            </button>
          </div>

          <div className="space-y-4">
            {/* Summary Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('summary')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-medium">Summary</span>
                {expandedSections.summary ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.summary && (
                <div className="p-4">
                  <p className="text-gray-700">{currentAnalysis.summary}</p>
                  {currentAnalysis.contractType && (
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <span className="text-gray-600">Type: <span className="font-medium">{currentAnalysis.contractType}</span></span>
                      {currentAnalysis.parties && (
                        <span className="text-gray-600">Parties: <span className="font-medium">{currentAnalysis.parties.join(', ')}</span></span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key Terms Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('keyTerms')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">Key Terms and Conditions</span>
                </div>
                {expandedSections.keyTerms ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.keyTerms && (
                <div className="p-4">
                  <ul className="space-y-2">
                    {currentAnalysis.keyTerms.map((term, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Potential Risks Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('risks')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <span className="font-medium">Potential Risks</span>
                </div>
                {expandedSections.risks ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.risks && (
                <div className="p-4">
                  <ul className="space-y-2">
                    {currentAnalysis.potentialRisks.map((risk, index) => (
                      <li key={index} className="flex items-start">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{risk}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Obligations Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('obligations')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-medium">Important Obligations</span>
                {expandedSections.obligations ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.obligations && (
                <div className="p-4">
                  <ul className="space-y-2">
                    {currentAnalysis.obligations.map((obligation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-blue-500 mr-2">•</span>
                        <span className="text-gray-700">{obligation}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Important Dates Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('dates')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <span className="font-medium">Important Dates</span>
                </div>
                {expandedSections.dates ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.dates && (
                <div className="p-4">
                  <div className="space-y-2">
                    {currentAnalysis.importantDates.map((item, index) => (
                      <div key={index} className="flex items-center gap-3">
                        <span className="font-medium text-gray-900">{item.date}</span>
                        <span className="text-gray-600">—</span>
                        <span className="text-gray-700">{item.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Plain English Explanation Section */}
            <div className="border rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection('explanation')}
                className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
              >
                <span className="font-medium">Plain English Explanation</span>
                {expandedSections.explanation ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </button>
              {expandedSections.explanation && (
                <div className="p-4">
                  <p className="text-gray-700 leading-relaxed">{currentAnalysis.plainEnglishExplanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Analysis History */}
      {analysisHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Analysis History</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contract Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Analyzed Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {analysisHistory.map((analysis) => (
                  <tr key={analysis.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{analysis.fileName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                      {analysis.contractType || 'N/A'}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-1" />
                        {analysis.uploadDate.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentAnalysis(analysis)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => downloadAnalysis(analysis)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractAnalyzerPage;