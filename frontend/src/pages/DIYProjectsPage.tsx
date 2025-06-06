import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import {
  WrenchScrewdriverIcon,
  PlusIcon,
  CameraIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

// Import sub-components (to be created)
import ProjectWizard from '../components/diy-tracker/ProjectWizard';
import ProjectDashboard from '../components/diy-tracker/ProjectDashboard';
import ProjectDetails from '../components/diy-tracker/ProjectDetails';
import CommunityGallery from '../components/diy-tracker/CommunityGallery';

interface DIYProject {
  id: string;
  title: string;
  description?: string;
  projectType?: string;
  difficultyLevel?: string;
  status: string;
  progressPercentage: number;
  estimatedDuration?: number;
  actualDuration?: number;
  estimatedCost?: number;
  actualCost?: number;
  startDate?: string;
  completionDate?: string;
  photos?: ProjectPhoto[];
  milestones?: ProjectMilestone[];
  supplies?: ProjectSupply[];
  _count?: {
    photos: number;
    milestones: number;
    supplies: number;
    issues: number;
  };
}

interface ProjectPhoto {
  id: string;
  fileName: string;
  filePath: string;
  thumbnailPath?: string;
  photoType?: string;
  caption?: string;
  takenAt: string;
}

interface ProjectMilestone {
  id: string;
  title: string;
  description?: string;
  status: string;
  stepOrder?: number;
}

interface ProjectSupply {
  id: string;
  itemName: string;
  category?: string;
  quantity?: number;
  unit?: string;
  isOwned: boolean;
  isPurchased: boolean;
}

type ViewMode = 'dashboard' | 'new' | 'details' | 'community';

const DIYProjectsPage: React.FC = () => {
  const { token, user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [projects, setProjects] = useState<DIYProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<DIYProject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    totalPhotos: 0,
    totalSaved: 0,
    averageCompletion: 0
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    if (viewMode === 'dashboard') {
      fetchProjects();
    }
  }, [viewMode]);

  const fetchProjects = async () => {
    const userId = (user as any)?.id || (user as any)?.userId;
    if (!userId) return;
    
    try {
      setIsLoading(true);
      const response = await axios.get(`${apiUrl}/diy/projects/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const projectsData = response.data.projects;
      setProjects(projectsData);
      
      // Calculate stats
      const active = projectsData.filter((p: DIYProject) => p.status === 'active').length;
      const completed = projectsData.filter((p: DIYProject) => p.status === 'completed').length;
      const totalPhotos = projectsData.reduce((sum: number, p: DIYProject) => sum + (p._count?.photos || 0), 0);
      const totalSaved = projectsData.reduce((sum: number, p: DIYProject) => {
        const estimated = p.estimatedCost || 0;
        const actual = p.actualCost || 0;
        return sum + Math.max(0, estimated - actual);
      }, 0);
      const avgCompletion = projectsData.length > 0
        ? projectsData.reduce((sum: number, p: DIYProject) => sum + p.progressPercentage, 0) / projectsData.length
        : 0;
      
      setStats({
        totalProjects: projectsData.length,
        activeProjects: active,
        completedProjects: completed,
        totalPhotos,
        totalSaved,
        averageCompletion: Math.round(avgCompletion)
      });
    } catch (error) {
      toast.error('Failed to fetch projects');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProjectCreated = (project: DIYProject) => {
    setProjects([project, ...projects]);
    setSelectedProject(project);
    setViewMode('details');
    toast.success('Project created successfully!');
  };

  const handleProjectSelect = (project: DIYProject) => {
    setSelectedProject(project);
    setViewMode('details');
  };

  const handleProjectUpdate = (updatedProject: DIYProject) => {
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setSelectedProject(updatedProject);
  };

  const handleDeleteProject = async (projectId: string) => {
    try {
      await axios.delete(`${apiUrl}/diy/projects/${projectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setProjects(projects.filter(p => p.id !== projectId));
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setViewMode('dashboard');
      }
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  const renderContent = () => {
    switch (viewMode) {
      case 'new':
        return (
          <ProjectWizard
            onProjectCreated={handleProjectCreated}
            onCancel={() => setViewMode('dashboard')}
          />
        );
      
      case 'details':
        return selectedProject ? (
          <ProjectDetails
            project={selectedProject}
            onUpdate={handleProjectUpdate}
            onBack={() => setViewMode('dashboard')}
            onDelete={() => handleDeleteProject(selectedProject.id)}
          />
        ) : (
          <div>No project selected</div>
        );
      
      case 'community':
        return (
          <CommunityGallery
            onProjectSelect={handleProjectSelect}
          />
        );
      
      case 'dashboard':
      default:
        return (
          <ProjectDashboard
            projects={projects}
            stats={stats}
            isLoading={isLoading}
            onProjectSelect={handleProjectSelect}
            onNewProject={() => setViewMode('new')}
          />
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <WrenchScrewdriverIcon className="h-8 w-8 mr-3 text-blue-600" />
              DIY Project Tracker
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Plan, track, and complete your DIY projects with AI assistance
            </p>
          </div>
          <button
            onClick={() => setViewMode('new')}
            className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            New Project
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setViewMode('dashboard')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'dashboard'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <ChartBarIcon className="h-5 w-5 inline mr-2" />
              My Projects
            </button>
            <button
              onClick={() => setViewMode('community')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                viewMode === 'community'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserGroupIcon className="h-5 w-5 inline mr-2" />
              Community Gallery
            </button>
          </nav>
        </div>
      </div>

      {/* Quick Stats (visible on dashboard) */}
      {viewMode === 'dashboard' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalProjects}</p>
              </div>
              <BeakerIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.activeProjects}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-purple-600">{stats.completedProjects}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Photos</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPhotos}</p>
              </div>
              <PhotoIcon className="h-8 w-8 text-gray-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Money Saved</p>
                <p className="text-2xl font-bold text-green-600">${stats.totalSaved}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Avg Progress</p>
                <p className="text-2xl font-bold text-blue-600">{stats.averageCompletion}%</p>
              </div>
              <div className="w-16 h-16">
                <svg className="transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-gray-200 dark:text-gray-700"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeDasharray={`${stats.averageCompletion}, 100`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="mt-6">
        {renderContent()}
      </div>
    </div>
  );
};

export default DIYProjectsPage;