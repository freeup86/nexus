import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

interface ApiTestResult {
  success: boolean;
  service: string;
  message?: string;
  error?: string;
  details?: any;
}

export const ApiTestPage: React.FC = () => {
  const { token } = useAuth();
  const [results, setResults] = useState<ApiTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [testingService, setTestingService] = useState<string | null>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  const testApi = async (service: string) => {
    setTestingService(service);
    try {
      const response = await axios.get(`${apiUrl}/test-apis/${service}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update or add result
      setResults(prev => {
        const filtered = prev.filter(r => r.service !== response.data.service);
        return [...filtered, response.data];
      });
    } catch (error: any) {
      const errorData = error.response?.data || {
        success: false,
        service: service.charAt(0).toUpperCase() + service.slice(1),
        error: 'Failed to connect to API'
      };
      
      setResults(prev => {
        const filtered = prev.filter(r => r.service !== errorData.service);
        return [...filtered, errorData];
      });
    } finally {
      setTestingService(null);
    }
  };

  const testAllApis = async () => {
    setIsLoading(true);
    setResults([]);
    
    try {
      const response = await axios.get(`${apiUrl}/test-apis/all`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setResults(response.data.results);
    } catch (error) {
      console.error('Error testing all APIs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircleIcon className="h-6 w-6 text-green-500" />
    ) : (
      <XCircleIcon className="h-6 w-6 text-red-500" />
    );
  };

  const getStatusColor = (success: boolean) => {
    return success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          API Connection Test
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Test connections to external API services
        </p>
      </div>

      {/* Test buttons */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => testApi('twitter')}
            disabled={testingService === 'twitter'}
            className="btn-primary flex items-center space-x-2"
          >
            {testingService === 'twitter' && (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            )}
            <span>Test Twitter API</span>
          </button>
          
          <button
            onClick={() => testApi('anthropic')}
            disabled={testingService === 'anthropic'}
            className="btn-primary flex items-center space-x-2"
          >
            {testingService === 'anthropic' && (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            )}
            <span>Test Anthropic (Claude) API</span>
          </button>
          
          <button
            onClick={() => testApi('openai')}
            disabled={testingService === 'openai'}
            className="btn-primary flex items-center space-x-2"
          >
            {testingService === 'openai' && (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            )}
            <span>Test OpenAI API</span>
          </button>
        </div>
        
        <div>
          <button
            onClick={testAllApis}
            disabled={isLoading}
            className="btn-secondary flex items-center space-x-2"
          >
            {isLoading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            <span>Test All APIs</span>
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={index}
            className={`border rounded-lg p-6 ${getStatusColor(result.success)}`}
          >
            <div className="flex items-start space-x-3">
              {getStatusIcon(result.success)}
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {result.service}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {result.success ? result.message : result.error}
                </p>
                
                {result.details && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Details:
                    </h4>
                    <pre className="text-xs bg-white dark:bg-gray-800 p-3 rounded overflow-x-auto">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {results.length === 0 && !isLoading && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              Click on a test button above to check API connections
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900 rounded-lg p-6">
        <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Configuration Notes:
        </h3>
        <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
          <li>API keys should be configured in the backend .env file</li>
          <li>Twitter API requires API Key, API Secret, Access Token, and Access Token Secret</li>
          <li>Anthropic API requires an API key from Anthropic</li>
          <li>OpenAI API requires an API key from OpenAI</li>
          <li>Make sure all credentials are valid and have the necessary permissions</li>
        </ul>
      </div>
    </div>
  );
};