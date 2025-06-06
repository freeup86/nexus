import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  ChartBarIcon,
  ScaleIcon,
  LightBulbIcon,
  PlusIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface Decision {
  id: string;
  title: string;
  description?: string;
  decisionType: string;
  status: string;
  createdAt: string;
  _count?: {
    criteria: number;
    options: number;
    analyses: number;
  };
}

interface Criterion {
  id?: string;
  name: string;
  description?: string;
  weight: number;
}

interface Option {
  id?: string;
  name: string;
  description?: string;
}

const DecisionSupportPage: React.FC = () => {
  const { token, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'decisions' | 'new' | 'analysis'>('decisions');
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  // New decision form state
  const [newDecision, setNewDecision] = useState({
    title: '',
    description: '',
    decisionType: 'personal'
  });
  
  // Decision wizard step
  const [wizardStep, setWizardStep] = useState(1);
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [scores, setScores] = useState<{ [key: string]: number }>({});
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    if (activeTab === 'decisions') {
      fetchDecisions();
    }
  }, [activeTab]);

  const fetchDecisions = async () => {
    const userId = (user as any)?.id || (user as any)?.userId;
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/decisions/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDecisions(response.data.decisions);
    } catch (error) {
      toast.error('Failed to fetch decisions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteDecision = async (id: string) => {
    try {
      await axios.delete(`${apiUrl}/decisions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Decision deleted successfully');
      setDecisions(decisions.filter(d => d.id !== id));
      setDeleteConfirmId(null);
      
      // If we're viewing the deleted decision, go back to list
      if (selectedDecision?.id === id) {
        setSelectedDecision(null);
        setActiveTab('decisions');
      }
    } catch (error) {
      toast.error('Failed to delete decision');
    }
  };

  const createDecision = async () => {
    try {
      const response = await axios.post(
        `${apiUrl}/decisions/create`,
        newDecision,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setSelectedDecision(response.data.decision);
      setWizardStep(2);
      toast.success('Decision created successfully!');
    } catch (error) {
      toast.error('Failed to create decision');
    }
  };

  const addCriteria = async () => {
    if (!selectedDecision || criteria.length === 0) return;
    
    // Normalize weights
    const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);
    const normalizedCriteria = criteria.map(c => ({
      ...c,
      weight: c.weight / totalWeight
    }));
    
    try {
      // Check if we're adding new criteria or just moving forward with existing ones
      const hasExistingCriteria = criteria.some(crit => crit.id);
      
      if (!hasExistingCriteria) {
        // Only create new criteria if they don't have IDs (meaning they're new)
        await axios.post(
          `${apiUrl}/decisions/${selectedDecision.id}/criteria`,
          { criteria: normalizedCriteria },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch the updated decision with criteria IDs
        const response = await axios.get(
          `${apiUrl}/decisions/${selectedDecision.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSelectedDecision(response.data.decision);
        setCriteria(response.data.decision.criteria);
        toast.success('Criteria added successfully!');
      } else {
        // If criteria already exist, just update the normalized weights in state
        setCriteria(normalizedCriteria);
      }
      
      setWizardStep(3);
    } catch (error) {
      toast.error('Failed to add criteria');
    }
  };

  const addOptions = async () => {
    if (!selectedDecision || options.length === 0) return;
    
    try {
      // Check if we're adding new options or just moving forward with existing ones
      const hasExistingOptions = options.some(opt => opt.id);
      
      if (!hasExistingOptions) {
        // Only create new options if they don't have IDs (meaning they're new)
        await axios.post(
          `${apiUrl}/decisions/${selectedDecision.id}/options`,
          { options },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        // Fetch the updated decision with option IDs
        const response = await axios.get(
          `${apiUrl}/decisions/${selectedDecision.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSelectedDecision(response.data.decision);
        setOptions(response.data.decision.options);
        toast.success('Options added successfully!');
      }
      
      setWizardStep(4);
    } catch (error) {
      toast.error('Failed to add options');
    }
  };

  const saveScores = async () => {
    if (!selectedDecision) return;
    
    // Get criteria and options from either state or selectedDecision
    const currentCriteria = criteria.length > 0 ? criteria : (selectedDecision as any).criteria || [];
    const currentOptions = options.length > 0 ? options : (selectedDecision as any).options || [];
    
    // Filter out any undefined or null scores and ensure all have values
    const scoreData = Object.entries(scores)
      .filter(([key, score]) => score !== undefined && score !== null)
      .map(([key, score]) => {
        const [optionId, criteriaId] = key.split('__');
        return { 
          optionId, 
          criteriaId, 
          score: parseFloat(score.toString()) // Ensure it's a float
        };
      });
    
    // Check if we have scores for all option-criteria combinations
    const expectedCount = currentOptions.length * currentCriteria.length;
    if (scoreData.length < expectedCount) {
      toast.error('Please fill in all scores before running analysis');
      return;
    }
    
    console.log('Sending scores:', scoreData);
    console.log('Current criteria:', currentCriteria);
    console.log('Current options:', currentOptions);
    
    // Validate that all IDs are present
    const invalidScores = scoreData.filter(s => !s.optionId || !s.criteriaId);
    if (invalidScores.length > 0) {
      console.error('Invalid scores found:', invalidScores);
      toast.error('Error: Some scores have invalid IDs. Please refresh and try again.');
      return;
    }
    
    try {
      await axios.post(
        `${apiUrl}/decisions/${selectedDecision.id}/scores`,
        { scores: scoreData },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success('Scores saved successfully!');
      runAnalysis();
    } catch (error: any) {
      console.error('Save scores error:', error.response?.data || error);
      const errorMessage = error.response?.data?.errors 
        ? error.response.data.errors.map((e: any) => `${e.param}: ${e.msg}`).join(', ')
        : error.response?.data?.error || 'Unknown error';
      toast.error('Failed to save scores: ' + errorMessage);
    }
  };

  const runAnalysis = async () => {
    if (!selectedDecision) return;
    
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${apiUrl}/decisions/${selectedDecision.id}/analyze`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setAnalysisResult(response.data.analysis);
      setWizardStep(5);
      toast.success('Analysis completed!');
    } catch (error) {
      toast.error('Failed to run analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const renderDecisionsList = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">My Decisions</h2>
        <button
          onClick={() => {
            // Reset all state for new decision
            setSelectedDecision(null);
            setNewDecision({ title: '', description: '', decisionType: 'personal' });
            setCriteria([]);
            setOptions([]);
            setScores({});
            setAnalysisResult(null);
            setWizardStep(1);
            setActiveTab('new');
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Decision
        </button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : decisions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <ScaleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No decisions yet</h3>
          <p className="text-gray-500 dark:text-gray-400">Create your first decision to get started</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {decisions.map((decision) => (
            <div
              key={decision.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => {
                    setSelectedDecision(decision);
                    setActiveTab('analysis');
                  }}
                >
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{decision.title}</h3>
                  {decision.description && (
                    <p className="text-gray-600 dark:text-gray-400 mt-1">{decision.description}</p>
                  )}
                  <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                    <span className="capitalize">{decision.decisionType}</span>
                    <span>•</span>
                    <span>{new Date(decision.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="flex flex-col items-end">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      decision.status === 'completed' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {decision.status}
                    </span>
                    {decision._count && (
                      <div className="mt-2 text-sm text-gray-500">
                        {decision._count.criteria} criteria • {decision._count.options} options
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteConfirmId(decision.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title="Delete decision"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this decision? This will permanently remove the decision 
              and all associated criteria, options, scores, and analyses.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDecision(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderNewDecisionWizard = () => (
    <div className="max-w-4xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3, 4, 5].map((step) => (
            <div key={step} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                wizardStep >= step 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {wizardStep > step ? <CheckCircleIcon className="h-6 w-6" /> : step}
              </div>
              {step < 5 && (
                <div className={`w-full h-1 ${
                  wizardStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-sm">
          <span>Decision</span>
          <span>Criteria</span>
          <span>Options</span>
          <span>Scoring</span>
          <span>Analysis</span>
        </div>
      </div>

      {/* Step 1: Create Decision */}
      {wizardStep === 1 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Define Your Decision</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Decision Title</label>
              <input
                type="text"
                value={newDecision.title}
                onChange={(e) => setNewDecision({ ...newDecision, title: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Choose new software vendor"
                disabled={!!selectedDecision} // Disable if editing existing decision
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Description (optional)</label>
              <textarea
                value={newDecision.description}
                onChange={(e) => setNewDecision({ ...newDecision, description: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Provide context about this decision..."
                disabled={!!selectedDecision} // Disable if editing existing decision
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Decision Type</label>
              <select
                value={newDecision.decisionType}
                onChange={(e) => setNewDecision({ ...newDecision, decisionType: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                disabled={!!selectedDecision} // Disable if editing existing decision
              >
                <option value="personal">Personal</option>
                <option value="business">Business</option>
                <option value="investment">Investment</option>
                <option value="career">Career</option>
                <option value="other">Other</option>
              </select>
            </div>
            <button
              onClick={selectedDecision ? () => setWizardStep(2) : createDecision}
              disabled={!newDecision.title}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {selectedDecision ? 'Continue to Criteria' : 'Create Decision and Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Add Criteria */}
      {wizardStep === 2 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Define Evaluation Criteria</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            What factors are important in making this decision? Add criteria and assign weights.
          </p>
          
          <div className="space-y-4 mb-6">
            {criteria.map((criterion, index) => (
              <div key={index} className="flex gap-4 items-start">
                <input
                  type="text"
                  value={criterion.name}
                  onChange={(e) => {
                    const updated = [...criteria];
                    updated[index].name = e.target.value;
                    setCriteria(updated);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Criterion name"
                />
                <input
                  type="number"
                  value={criterion.weight}
                  onChange={(e) => {
                    const updated = [...criteria];
                    updated[index].weight = parseFloat(e.target.value) || 0;
                    setCriteria(updated);
                  }}
                  className="w-24 px-4 py-2 border rounded-lg"
                  placeholder="Weight"
                  min="0"
                  step="0.1"
                />
                <button
                  onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setCriteria([...criteria, { name: '', weight: 1 }])}
            className="mb-6 text-blue-600 hover:text-blue-800"
          >
            + Add Criterion
          </button>
          
          <div className="flex justify-between">
            <button
              onClick={() => setWizardStep(1)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={addCriteria}
              disabled={criteria.length === 0 || criteria.some(c => !c.name)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {criteria.some(c => c.id) ? 'Continue to Options' : 'Save Criteria & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Add Options */}
      {wizardStep === 3 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Define Your Options</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            What are the alternatives you're considering?
          </p>
          
          <div className="space-y-4 mb-6">
            {options.map((option, index) => (
              <div key={index} className="flex gap-4 items-start">
                <input
                  type="text"
                  value={option.name}
                  onChange={(e) => {
                    const updated = [...options];
                    updated[index].name = e.target.value;
                    setOptions(updated);
                  }}
                  className="flex-1 px-4 py-2 border rounded-lg"
                  placeholder="Option name"
                />
                <button
                  onClick={() => setOptions(options.filter((_, i) => i !== index))}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          
          <button
            onClick={() => setOptions([...options, { name: '' }])}
            className="mb-6 text-blue-600 hover:text-blue-800"
          >
            + Add Option
          </button>
          
          <div className="flex justify-between">
            <button
              onClick={() => setWizardStep(2)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={addOptions}
              disabled={options.length === 0 || options.some(o => !o.name)}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {options.some(o => o.id) ? 'Continue to Scoring' : 'Save Options & Continue'}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Scoring Matrix */}
      {wizardStep === 4 && selectedDecision && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Score Your Options</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Rate each option against each criterion (0-10 scale)
          </p>
          
          {/* Check if criteria and options have IDs */}
          {(() => {
            const currentCriteria = criteria.length > 0 ? criteria : (selectedDecision as any).criteria || [];
            const currentOptions = options.length > 0 ? options : (selectedDecision as any).options || [];
            const missingIds = currentCriteria.some((c: any) => !c.id) || currentOptions.some((o: any) => !o.id);
            
            if (missingIds) {
              return (
                <div className="bg-yellow-50 border-yellow-200 border rounded-lg p-4 mb-4">
                  <p className="text-yellow-800">
                    ⚠️ Please save your criteria and options before scoring. Click "Back" to complete the previous steps.
                  </p>
                </div>
              );
            }
            return null;
          })()}
          
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Options / Criteria</th>
                  {(criteria.length > 0 ? criteria : (selectedDecision as any).criteria || []).map((criterion: any) => (
                    <th key={criterion.id} className="px-4 py-2 text-center">
                      {criterion.name}
                      <div className="text-xs text-gray-500">
                        Weight: {(criterion.weight * 100).toFixed(0)}%
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(options.length > 0 ? options : (selectedDecision as any).options || []).map((option: any) => (
                  <tr key={option.id}>
                    <td className="px-4 py-2 font-medium">{option.name}</td>
                    {(criteria.length > 0 ? criteria : (selectedDecision as any).criteria || []).map((criterion: any) => (
                      <td key={criterion.id} className="px-4 py-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.5"
                          value={scores[`${option.id}__${criterion.id}`] || 0}
                          onChange={(e) => {
                            if (option.id && criterion.id) {
                              setScores({
                                ...scores,
                                [`${option.id}__${criterion.id}`]: parseFloat(e.target.value) || 0
                              });
                            } else {
                              console.error('Missing IDs:', { optionId: option.id, criterionId: criterion.id });
                              toast.error('Error: Missing IDs. Please save criteria and options first.');
                            }
                          }}
                          className="w-20 px-2 py-1 border rounded text-center"
                          disabled={!option.id || !criterion.id}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-between mt-6">
            <button
              onClick={() => setWizardStep(3)}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Back
            </button>
            <button
              onClick={saveScores}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Run Analysis
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Results */}
      {wizardStep === 5 && analysisResult && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Analysis Complete!</h2>
          <div className="space-y-6">
            {/* AI Recommendation */}
            {analysisResult.recommendation && (
              <div className="bg-green-50 dark:bg-green-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 flex items-center">
                  <LightBulbIcon className="h-6 w-6 mr-2 text-green-600" />
                  AI Recommendation
                </h3>
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  {analysisResult.recommendation.recommendation}
                </p>
                {analysisResult.recommendation.recommendedOption && (
                  <p className="font-semibold text-green-700 dark:text-green-300">
                    Recommended Option: {analysisResult.recommendation.recommendedOption}
                  </p>
                )}
                {analysisResult.recommendation.confidence > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-600">Confidence: </span>
                    <span className="font-semibold">{analysisResult.recommendation.confidence}%</span>
                  </div>
                )}
              </div>
            )}
            
            {/* Ranking Results */}
            {analysisResult.results && analysisResult.results.ranking && (
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Option Rankings</h3>
                <div className="space-y-3">
                  {analysisResult.results.ranking.map((option: any, index: number) => (
                    <div key={option.optionId} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <span className={`mr-3 font-bold text-lg ${
                          index === 0 ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="font-medium">{option.optionName}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          Score: {option.weightedScore.toFixed(2)}
                        </div>
                        <div className="text-sm text-gray-500">
                          Avg: {option.averageScore.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Strengths and Risks */}
            {analysisResult.recommendation && (
              <div className="grid md:grid-cols-2 gap-6">
                {analysisResult.recommendation.strengths && analysisResult.recommendation.strengths.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <CheckCircleIcon className="h-6 w-6 mr-2 text-blue-600" />
                      Strengths
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.recommendation.strengths.map((strength: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-600 mr-2">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {analysisResult.recommendation.risks && analysisResult.recommendation.risks.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-yellow-900 p-6 rounded-lg">
                    <h3 className="text-lg font-semibold mb-3 flex items-center">
                      <ExclamationTriangleIcon className="h-6 w-6 mr-2 text-yellow-600" />
                      Risks & Considerations
                    </h3>
                    <ul className="space-y-2">
                      {analysisResult.recommendation.risks.map((risk: string, index: number) => (
                        <li key={index} className="flex items-start">
                          <span className="text-yellow-600 mr-2">•</span>
                          <span className="text-gray-700 dark:text-gray-300">{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Implementation Steps */}
            {analysisResult.recommendation && analysisResult.recommendation.implementation && 
             analysisResult.recommendation.implementation.length > 0 && (
              <div className="bg-indigo-50 dark:bg-indigo-900 p-6 rounded-lg">
                <h3 className="text-lg font-semibold mb-3 flex items-center">
                  <ArrowRightIcon className="h-6 w-6 mr-2 text-indigo-600" />
                  Implementation Steps
                </h3>
                <ol className="space-y-2">
                  {analysisResult.recommendation.implementation.map((step: string, index: number) => (
                    <li key={index} className="flex items-start">
                      <span className="font-semibold text-indigo-600 mr-3">{index + 1}.</span>
                      <span className="text-gray-700 dark:text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            
            <button
              onClick={() => {
                setActiveTab('decisions');
                setWizardStep(1);
                setCriteria([]);
                setOptions([]);
                setScores({});
                setSelectedDecision(null);
                setAnalysisResult(null);
                setNewDecision({ title: '', description: '', decisionType: 'personal' });
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Back to Decisions
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderAnalysisView = () => {
    if (!selectedDecision) return null;

    return (
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => setActiveTab('decisions')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Decisions
          </button>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {selectedDecision.title}
          </h2>
          {selectedDecision.description && (
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {selectedDecision.description}
            </p>
          )}
          <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
            <span className="capitalize">{selectedDecision.decisionType}</span>
            <span>•</span>
            <span>{new Date(selectedDecision.createdAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Decision Summary */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Criteria */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Evaluation Criteria</h3>
            {(selectedDecision as any).criteria && (selectedDecision as any).criteria.length > 0 ? (
              <div className="space-y-3">
                {(selectedDecision as any).criteria.map((criterion: any) => (
                  <div key={criterion.id} className="flex justify-between items-center">
                    <span className="font-medium">{criterion.name}</span>
                    <span className="text-sm text-gray-500">
                      {(criterion.weight * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No criteria defined</p>
            )}
          </div>

          {/* Options */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Options</h3>
            {(selectedDecision as any).options && (selectedDecision as any).options.length > 0 ? (
              <div className="space-y-2">
                {(selectedDecision as any).options.map((option: any) => (
                  <div key={option.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                    <div className="font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {option.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No options defined</p>
            )}
          </div>
        </div>

        {/* Analysis Results */}
        {(selectedDecision as any).analyses && (selectedDecision as any).analyses.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Latest Analysis Results</h3>
            {/* Display analysis results here - you can expand this based on your needs */}
            <div className="text-gray-600 dark:text-gray-400">
              Analysis completed on {new Date((selectedDecision as any).analyses[0].createdAt).toLocaleDateString()}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
            <ScaleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analysis Yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              This decision hasn't been analyzed yet. Complete the setup to run analysis.
            </p>
            <button
              onClick={async () => {
                // Load the full decision data with criteria and options
                try {
                  const response = await axios.get(
                    `${apiUrl}/decisions/${selectedDecision.id}`,
                    { headers: { Authorization: `Bearer ${token}` } }
                  );
                  const fullDecision = response.data.decision;
                  
                  // Set the decision data
                  setSelectedDecision(fullDecision);
                  setNewDecision({
                    title: fullDecision.title,
                    description: fullDecision.description || '',
                    decisionType: fullDecision.decisionType
                  });
                  
                  // Load criteria if exists
                  if (fullDecision.criteria && fullDecision.criteria.length > 0) {
                    setCriteria(fullDecision.criteria);
                  }
                  
                  // Load options if exists
                  if (fullDecision.options && fullDecision.options.length > 0) {
                    setOptions(fullDecision.options);
                  }
                  
                  // Load scores if exists
                  if (fullDecision.scores && fullDecision.scores.length > 0) {
                    const scoreMap: { [key: string]: number } = {};
                    fullDecision.scores.forEach((score: any) => {
                      scoreMap[`${score.optionId}__${score.criteriaId}`] = score.score;
                    });
                    setScores(scoreMap);
                  }
                  
                  // Determine which step to continue from
                  let continueStep = 2; // Default to criteria step
                  
                  if (fullDecision.criteria && fullDecision.criteria.length > 0) {
                    continueStep = 3; // Has criteria, go to options
                    
                    if (fullDecision.options && fullDecision.options.length > 0) {
                      continueStep = 4; // Has options, go to scoring
                      
                      if (fullDecision.scores && fullDecision.scores.length > 0) {
                        continueStep = 4; // Stay on scoring to review/edit
                      }
                    }
                  }
                  
                  setWizardStep(continueStep);
                  setActiveTab('new');
                } catch (error) {
                  toast.error('Failed to load decision data');
                }
              }}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Continue Setup
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Decision Support System</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Make better decisions with AI-powered analysis and recommendations
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('decisions')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'decisions'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            My Decisions
          </button>
          <button
            onClick={() => {
              // Reset all state for new decision
              setSelectedDecision(null);
              setNewDecision({ title: '', description: '', decisionType: 'personal' });
              setCriteria([]);
              setOptions([]);
              setScores({});
              setAnalysisResult(null);
              setWizardStep(1);
              setActiveTab('new');
            }}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'new'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            New Decision
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'decisions' && renderDecisionsList()}
      {activeTab === 'new' && renderNewDecisionWizard()}
      {activeTab === 'analysis' && selectedDecision && renderAnalysisView()}
    </div>
  );
};

export default DecisionSupportPage;