import React, { useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import SupplyManager from './SupplyManager';
import IssueTracker from './IssueTracker';
import {
  ArrowLeftIcon,
  CameraIcon,
  PlusIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  WrenchIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ShareIcon,
  QuestionMarkCircleIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface ProjectDetailsProps {
  project: any;
  onUpdate: (project: any) => void;
  onBack: () => void;
  onDelete: () => void;
}

type TabType = 'overview' | 'photos' | 'milestones' | 'supplies' | 'issues';

const ProjectDetails: React.FC<ProjectDetailsProps> = ({
  project,
  onUpdate,
  onBack,
  onDelete
}) => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMilestoneDialog, setShowMilestoneDialog] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [editData, setEditData] = useState({
    title: project.title,
    description: project.description || '',
    status: project.status,
    actualDuration: project.actualDuration || '',
    actualCost: project.actualCost || ''
  });
  
  const [milestoneData, setMilestoneData] = useState({
    title: '',
    description: '',
    estimatedDuration: '',
    stepOrder: project.ProjectMilestones?.length + 1 || 1
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  const handleSaveEdit = async () => {
    setIsLoading(true);
    try {
      const response = await axios.put(
        `${apiUrl}/diy/projects/${project.id}`,
        {
          ...editData,
          actualDuration: editData.actualDuration ? parseInt(editData.actualDuration) : null,
          actualCost: editData.actualCost ? parseFloat(editData.actualCost) : null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onUpdate(response.data.project);
      setIsEditing(false);
      toast.success('Project updated successfully');
    } catch (error: any) {
      console.error('Project update error:', error);
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
      if (error.response?.data?.error) {
        toast.error(`Failed to update project: ${error.response.data.error}`);
      } else {
        toast.error('Failed to update project');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('photo', file);
    formData.append('photoType', 'progress');

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${apiUrl}/diy/projects/${project.id}/photos`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Update project with new photo
      const updatedProject = { ...project };
      if (!updatedProject.photos) updatedProject.photos = [];
      updatedProject.photos.unshift(response.data.photo);
      onUpdate(updatedProject);
      
      toast.success('Photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload photo');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProgressUpdate = async (milestoneId: string) => {
    setIsLoading(true);
    try {
      await axios.post(
        `${apiUrl}/diy/projects/${project.id}/progress`,
        { milestoneId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh project data
      const response = await axios.get(
        `${apiUrl}/diy/projects/${project.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onUpdate(response.data.project);
      toast.success('Progress updated');
    } catch (error) {
      toast.error('Failed to update progress');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning':
        return 'bg-gray-100 text-gray-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddMilestone = () => {
    setEditingMilestone(null);
    setMilestoneData({
      title: '',
      description: '',
      estimatedDuration: '',
      stepOrder: project.ProjectMilestones?.length + 1 || 1
    });
    setShowMilestoneDialog(true);
  };

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestone(milestone);
    setMilestoneData({
      title: milestone.title,
      description: milestone.description || '',
      estimatedDuration: milestone.estimatedDuration?.toString() || '',
      stepOrder: milestone.stepOrder
    });
    setShowMilestoneDialog(true);
  };

  const handleSaveMilestone = async () => {
    setIsLoading(true);
    try {
      console.log('Project object:', project); // Debug log full project
      console.log('Project ID:', project.id, 'Type:', typeof project.id); // Debug log
      
      // Validation check
      if (!project.id || project.id === 'newid()' || typeof project.id !== 'string') {
        toast.error('Invalid project ID. Please refresh the page and try again.');
        return;
      }
      
      if (editingMilestone) {
        // Update existing milestone
        console.log('Updating milestone:', editingMilestone.id); // Debug log
        await axios.put(
          `${apiUrl}/diy/milestones/${editingMilestone.id}`,
          {
            ...milestoneData,
            estimatedDuration: milestoneData.estimatedDuration ? parseInt(milestoneData.estimatedDuration) : null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Milestone updated successfully');
      } else {
        // Create new milestone
        console.log('Creating milestone for project:', project.id); // Debug log
        const response = await axios.post(
          `${apiUrl}/diy/projects/${project.id}/milestones`,
          {
            ...milestoneData,
            estimatedDuration: milestoneData.estimatedDuration ? parseInt(milestoneData.estimatedDuration) : null
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Milestone added successfully');
      }
      
      setShowMilestoneDialog(false);
      
      // Refresh project data to show new milestone
      try {
        const refreshResponse = await axios.get(
          `${apiUrl}/diy/projects/${project.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onUpdate(refreshResponse.data.project);
      } catch (refreshError) {
        console.error('Failed to refresh project data:', refreshError);
        // Still call onUpdate with old data as fallback
        onUpdate(project);
      }
    } catch (error: any) {
      console.error('Milestone save error:', error); // Better error logging
      if (error.response?.data?.errors) {
        console.error('Validation errors:', error.response.data.errors);
      }
      toast.error('Failed to save milestone');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMilestone = async (milestoneId: string) => {
    if (window.confirm('Are you sure you want to delete this milestone?')) {
      try {
        await axios.delete(
          `${apiUrl}/diy/milestones/${milestoneId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Milestone deleted successfully');
        
        // Refresh project data to remove deleted milestone from UI
        try {
          const refreshResponse = await axios.get(
            `${apiUrl}/diy/projects/${project.id}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          onUpdate(refreshResponse.data.project);
        } catch (refreshError) {
          console.error('Failed to refresh project data:', refreshError);
          // Still call onUpdate with old data as fallback
          onUpdate(project);
        }
      } catch (error) {
        toast.error('Failed to delete milestone');
      }
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                className="text-2xl font-bold w-full px-3 py-1 border rounded-lg dark:bg-gray-700"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {project.title}
              </h2>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSaveEdit}
                  className="p-2 text-green-600 hover:bg-green-50 rounded"
                  disabled={isLoading}
                >
                  <CheckIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditData({
                      title: project.title,
                      description: project.description || '',
                      status: project.status,
                      actualDuration: project.actualDuration || '',
                      actualCost: project.actualCost || ''
                    });
                  }}
                  className="p-2 text-gray-600 hover:bg-gray-50 rounded"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 text-red-600 hover:bg-red-50 rounded"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              rows={3}
              placeholder="Project description..."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select
                value={editData.status}
                onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="paused">Paused</option>
              </select>
              <input
                type="number"
                value={editData.actualDuration}
                onChange={(e) => setEditData({ ...editData, actualDuration: e.target.value })}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="Actual hours"
              />
              <input
                type="number"
                value={editData.actualCost}
                onChange={(e) => setEditData({ ...editData, actualCost: e.target.value })}
                className="px-3 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="Actual cost"
                step="0.01"
              />
            </div>
          </div>
        ) : (
          <>
            {project.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {project.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
              {project.projectType && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Type: {project.projectType}
                </span>
              )}
              {project.difficultyLevel && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Difficulty: {project.difficultyLevel}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Progress Overview</h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Overall Progress</span>
              <span>{project.progressPercentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${project.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div className="text-center">
              <ClockIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
              <p className="font-semibold">
                {project.actualDuration || project.estimatedDuration || 0}h
                {project.estimatedDuration && !project.actualDuration && ' (est)'}
              </p>
            </div>
            <div className="text-center">
              <CurrencyDollarIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Cost</p>
              <p className="font-semibold">
                ${project.actualCost || project.estimatedCost || 0}
                {project.estimatedCost && !project.actualCost && ' (est)'}
              </p>
            </div>
            <div className="text-center">
              <CameraIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Photos</p>
              <p className="font-semibold">{project._count?.photos || 0}</p>
            </div>
            <div className="text-center">
              <CheckIcon className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Milestones</p>
              <p className="font-semibold">
                {project.ProjectMilestones?.filter((m: any) => m.status === 'completed').length || 0}/
                {project.ProjectMilestones?.length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <CameraIcon className="h-5 w-5 mr-2" />
          Add Photo
        </button>
        <button
          onClick={() => setActiveTab('milestones')}
          className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <CheckIcon className="h-5 w-5 mr-2" />
          Update Progress
        </button>
        <button
          onClick={() => setActiveTab('supplies')}
          className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <ShoppingCartIcon className="h-5 w-5 mr-2" />
          Manage Supplies
        </button>
        <button
          className="flex items-center justify-center px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <ShareIcon className="h-5 w-5 mr-2" />
          Share Project
        </button>
      </div>
    </div>
  );

  const renderPhotos = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Photos</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Photo
        </button>
      </div>

      {project.photos && project.photos.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {project.photos.map((photo: any) => (
            <div key={photo.id} className="relative group">
              <img
                src={photo.thumbnailPath || photo.filePath}
                alt={photo.caption || 'Project photo'}
                className="w-full h-48 object-cover rounded-lg"
              />
              {photo.photoType && (
                <span className="absolute top-2 left-2 px-2 py-1 bg-black bg-opacity-50 text-white text-xs rounded">
                  {photo.photoType}
                </span>
              )}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CameraIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No photos yet</p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 text-blue-600 hover:text-blue-700"
          >
            Upload your first photo
          </button>
        </div>
      )}
    </div>
  );

  const renderMilestones = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Milestones</h3>
        <button 
          onClick={handleAddMilestone}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Add Milestone
        </button>
      </div>

      {project.ProjectMilestones && project.ProjectMilestones.length > 0 ? (
        <div className="space-y-4">
          {project.ProjectMilestones.map((milestone: any) => {
            console.log('Milestone data:', milestone); // Debug log
            return (
            <div
              key={milestone.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 flex items-center justify-between"
            >
              <div className="flex items-center space-x-4 flex-1">
                <button
                  onClick={() => milestone.status !== 'completed' && handleProgressUpdate(milestone.id)}
                  className={`w-6 h-6 rounded-full border-2 ${
                    milestone.status === 'completed'
                      ? 'bg-green-500 border-green-500'
                      : 'border-gray-300 hover:border-blue-500'
                  }`}
                  disabled={milestone.status === 'completed'}
                >
                  {milestone.status === 'completed' && (
                    <CheckIcon className="h-4 w-4 text-white mx-auto" />
                  )}
                </button>
                <div className="flex-1">
                  <h4 className={`font-medium ${
                    milestone.status === 'completed' ? 'line-through text-gray-500' : ''
                  }`}>
                    {milestone.title}
                  </h4>
                  {milestone.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {milestone.estimatedDuration && (
                  <span className="text-sm text-gray-500 mr-2">
                    {milestone.estimatedDuration}h
                  </span>
                )}
                <button
                  onClick={() => handleEditMilestone(milestone)}
                  className="p-1 text-gray-600 hover:text-gray-900"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMilestone(milestone.id)}
                  className="p-1 text-red-600 hover:text-red-900"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <CheckIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
          <p className="text-gray-600 dark:text-gray-400">No milestones defined</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Projects
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview', icon: DocumentTextIcon },
            { id: 'photos', label: 'Photos', icon: CameraIcon },
            { id: 'milestones', label: 'Milestones', icon: CheckIcon },
            { id: 'supplies', label: 'Supplies', icon: ShoppingCartIcon },
            { id: 'issues', label: 'Issues', icon: ExclamationTriangleIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5 mr-2" />
              {tab.label}
              {tab.id === 'issues' && project._count?.issues > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                  {project._count.issues}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'photos' && renderPhotos()}
        {activeTab === 'milestones' && renderMilestones()}
        {activeTab === 'supplies' && (
          <SupplyManager
            projectId={project.id}
            supplies={project.ProjectSupplies || []}
            onSuppliesUpdate={async () => {
              // Refresh project data to show new supplies
              try {
                const refreshResponse = await axios.get(
                  `${apiUrl}/diy/projects/${project.id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                onUpdate(refreshResponse.data.project);
              } catch (refreshError) {
                console.error('Failed to refresh project data:', refreshError);
                onUpdate(project);
              }
            }}
          />
        )}
        {activeTab === 'issues' && (
          <IssueTracker
            projectId={project.id}
            issues={project.ProjectIssues || []}
            photos={project.ProjectPhotos || []}
            onIssuesUpdate={async () => {
              // Refresh project data to show updated issues
              try {
                const refreshResponse = await axios.get(
                  `${apiUrl}/diy/projects/${project.id}`,
                  { headers: { Authorization: `Bearer ${token}` } }
                );
                onUpdate(refreshResponse.data.project);
              } catch (refreshError) {
                console.error('Failed to refresh project data:', refreshError);
                onUpdate(project);
              }
            }}
          />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Delete Project?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete "{project.title}"? This will permanently remove the project
              and all associated photos, milestones, and data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Milestone Dialog */}
      {showMilestoneDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {editingMilestone ? 'Edit Milestone' : 'Add Milestone'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={milestoneData.title}
                  onChange={(e) => setMilestoneData({ ...milestoneData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="Milestone title"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description (optional)</label>
                <textarea
                  value={milestoneData.description}
                  onChange={(e) => setMilestoneData({ ...milestoneData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  placeholder="Milestone description"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Duration (hours)</label>
                  <input
                    type="number"
                    value={milestoneData.estimatedDuration}
                    onChange={(e) => setMilestoneData({ ...milestoneData, estimatedDuration: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Step Order</label>
                  <input
                    type="number"
                    value={milestoneData.stepOrder}
                    onChange={(e) => setMilestoneData({ ...milestoneData, stepOrder: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    min="1"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMilestoneDialog(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMilestone}
                disabled={!milestoneData.title || isLoading}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : (editingMilestone ? 'Update' : 'Add')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;