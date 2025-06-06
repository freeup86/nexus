import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import {
  SparklesIcon,
  DocumentTextIcon,
  ChartBarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ProjectWizardProps {
  onProjectCreated: (project: any) => void;
  onCancel: () => void;
}

const projectTypes = [
  'Woodworking',
  'Plumbing',
  'Electrical',
  'Painting',
  'Landscaping',
  'Home Repair',
  'Furniture',
  'Flooring',
  'Renovation',
  'Crafts',
  'Other'
];

const ProjectWizard: React.FC<ProjectWizardProps> = ({ onProjectCreated, onCancel }) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [useAI, setUseAI] = useState(true);
  const [naturalLanguageInput, setNaturalLanguageInput] = useState('');
  
  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    projectType: '',
    difficultyLevel: '',
    estimatedDuration: '',
    estimatedCost: ''
  });

  const [aiGeneratedPlan, setAiGeneratedPlan] = useState<any>(null);
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  const handleNaturalLanguageSubmit = async () => {
    if (!naturalLanguageInput.trim()) {
      toast.error('Please describe your project');
      return;
    }

    setIsLoading(true);
    try {
      // For now, we'll parse the natural language input locally
      // In production, this would call an AI endpoint
      const words = naturalLanguageInput.toLowerCase();
      
      // Simple parsing logic (would be replaced by AI)
      let projectType = 'Other';
      projectTypes.forEach(type => {
        if (words.includes(type.toLowerCase())) {
          projectType = type;
        }
      });

      let difficultyLevel = 'intermediate';
      if (words.includes('easy') || words.includes('simple') || words.includes('beginner')) {
        difficultyLevel = 'beginner';
      } else if (words.includes('hard') || words.includes('difficult') || words.includes('advanced')) {
        difficultyLevel = 'advanced';
      }

      // Extract title (first sentence or first 50 characters)
      const title = naturalLanguageInput.split(/[.!?]/)[0].trim().substring(0, 50);

      setProjectData({
        title,
        description: naturalLanguageInput,
        projectType,
        difficultyLevel,
        estimatedDuration: '8', // Default estimate
        estimatedCost: '100' // Default estimate
      });

      setStep(2);
    } catch (error) {
      toast.error('Failed to process your description');
    } finally {
      setIsLoading(false);
    }
  };

  const createProject = async () => {
    if (!projectData.title) {
      toast.error('Please provide a project title');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/diy/projects/create`,
        {
          ...projectData,
          estimatedDuration: projectData.estimatedDuration ? parseInt(projectData.estimatedDuration) : null,
          estimatedCost: projectData.estimatedCost ? parseFloat(projectData.estimatedCost) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const createdProject = response.data.project;

      // If AI plan was generated, analyze the project
      if (useAI && createdProject.id) {
        try {
          const analysisResponse = await axios.post(
            `${apiUrl}/diy/projects/${createdProject.id}/analyze`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (analysisResponse.data.projectPlan) {
            setAiGeneratedPlan(analysisResponse.data.projectPlan);
            
            // Auto-create milestones and supplies from AI plan
            if (analysisResponse.data.projectPlan.milestones) {
              // Add milestones logic here
            }
            if (analysisResponse.data.projectPlan.supplies) {
              // Add supplies logic here
            }
          }
        } catch (error) {
          console.error('Failed to analyze project:', error);
        }
      }

      onProjectCreated(createdProject);
    } catch (error) {
      toast.error('Failed to create project');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          How would you like to start?
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose to describe your project naturally or fill out a form
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <button
          onClick={() => setUseAI(true)}
          className={`p-6 rounded-lg border-2 transition-all ${
            useAI
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <SparklesIcon className="h-12 w-12 mx-auto mb-3 text-blue-600" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Setup</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe your project in natural language and let AI generate a complete plan
          </p>
        </button>

        <button
          onClick={() => {
            setUseAI(false);
            setStep(2);
          }}
          className={`p-6 rounded-lg border-2 transition-all ${
            !useAI
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
          }`}
        >
          <DocumentTextIcon className="h-12 w-12 mx-auto mb-3 text-gray-600" />
          <h3 className="text-lg font-semibold mb-2">Manual Setup</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Fill out a form with your project details step by step
          </p>
        </button>
      </div>

      {useAI && (
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Describe your project
            </span>
            <textarea
              value={naturalLanguageInput}
              onChange={(e) => setNaturalLanguageInput(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={6}
              placeholder="I want to build a wooden bookshelf for my living room. It should be about 6 feet tall with adjustable shelves..."
            />
          </label>
          
          <div className="flex justify-between">
            <button
              onClick={onCancel}
              className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleNaturalLanguageSubmit}
              disabled={!naturalLanguageInput.trim() || isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Generate Project Plan'}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
        Project Details
      </h2>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Project Title *
            </span>
            <input
              type="text"
              value={projectData.title}
              onChange={(e) => setProjectData({ ...projectData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              placeholder="e.g., Build a wooden bookshelf"
            />
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Description
            </span>
            <textarea
              value={projectData.description}
              onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              rows={4}
              placeholder="Describe your project in detail..."
            />
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Project Type
            </span>
            <select
              value={projectData.projectType}
              onChange={(e) => setProjectData({ ...projectData, projectType: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select a type</option>
              {projectTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Difficulty Level
            </span>
            <select
              value={projectData.difficultyLevel}
              onChange={(e) => setProjectData({ ...projectData, difficultyLevel: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">Select difficulty</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Estimated Duration (hours)
            </span>
            <div className="relative">
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={projectData.estimatedDuration}
                onChange={(e) => setProjectData({ ...projectData, estimatedDuration: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="8"
                min="1"
              />
            </div>
          </label>
        </div>

        <div>
          <label className="block">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
              Estimated Cost ($)
            </span>
            <div className="relative">
              <CurrencyDollarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                value={projectData.estimatedCost}
                onChange={(e) => setProjectData({ ...projectData, estimatedCost: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                placeholder="100"
                min="0"
                step="0.01"
              />
            </div>
          </label>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={() => setStep(1)}
          className="px-6 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          Back
        </button>
        <button
          onClick={createProject}
          disabled={!projectData.title || isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating...' : 'Create Project'}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New DIY Project
          </h1>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {step === 1 ? renderStep1() : renderStep2()}
      </div>
    </div>
  );
};

export default ProjectWizard;