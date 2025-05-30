import React from 'react';
import {
  ClockIcon,
  CurrencyDollarIcon,
  CameraIcon,
  WrenchIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

interface ProjectDashboardProps {
  projects: any[];
  stats: any;
  isLoading: boolean;
  onProjectSelect: (project: any) => void;
  onNewProject: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  projects,
  stats,
  isLoading,
  onProjectSelect,
  onNewProject
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      case 'active':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-12">
        <WrenchIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No projects</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Get started by creating a new DIY project.
        </p>
        <div className="mt-6">
          <button
            onClick={onNewProject}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Start New Project
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map((project) => (
        <div
          key={project.id}
          onClick={() => onProjectSelect(project)}
          className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
        >
          {/* Project Image */}
          {project.photos && project.photos.length > 0 ? (
            <div className="h-48 bg-gray-200 relative">
              <img
                src={project.photos[0].thumbnailPath || project.photos[0].filePath}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs">
                <CameraIcon className="h-4 w-4 inline mr-1" />
                {project._count?.photos || 0}
              </div>
            </div>
          ) : (
            <div className="h-48 bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <CameraIcon className="h-12 w-12 text-gray-400" />
            </div>
          )}

          {/* Project Details */}
          <div className="p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate flex-1">
                {project.title}
              </h3>
              <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>

            {project.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {project.description}
              </p>
            )}

            <div className="space-y-2">
              {/* Project Type & Difficulty */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 dark:text-gray-400">
                  {project.projectType || 'General DIY'}
                </span>
                {project.difficultyLevel && (
                  <span className={`font-medium ${getDifficultyColor(project.difficultyLevel)}`}>
                    {project.difficultyLevel}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${project.progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{project.progressPercentage}% Complete</span>
                <span>{project._count?.milestones || 0} milestones</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="h-4 w-4 mr-1" />
                  {project.actualDuration || project.estimatedDuration || 0}h
                </div>
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                  <CurrencyDollarIcon className="h-4 w-4 mr-1" />
                  ${project.actualCost || project.estimatedCost || 0}
                </div>
              </div>

              {/* Issues indicator */}
              {project._count?.issues > 0 && (
                <div className="flex items-center text-sm text-yellow-600 dark:text-yellow-400 mt-2">
                  <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
                  {project._count.issues} issue{project._count.issues > 1 ? 's' : ''}
                </div>
              )}

              {/* Completed indicator */}
              {project.status === 'completed' && project.completionDate && (
                <div className="flex items-center text-sm text-green-600 dark:text-green-400 mt-2">
                  <CheckCircleIcon className="h-4 w-4 mr-1" />
                  Completed {new Date(project.completionDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectDashboard;