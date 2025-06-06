import React, { useState } from 'react';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CameraIcon,
  LightBulbIcon,
  WrenchIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';

interface Issue {
  id: string;
  projectId: string;
  photoId?: string;
  issueType: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'resolved' | 'ignored' | 'in_progress';
  aiDetected: boolean;
  aiSuggestions?: string;
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
}

interface Photo {
  id: string;
  filePath: string;
  thumbnailPath?: string;
  caption?: string;
}

interface IssueTrackerProps {
  projectId: string;
  issues: Issue[];
  photos: Photo[];
  onIssuesUpdate: () => void;
}

const issueTypes = [
  { value: 'measurement_error', label: 'Measurement Error', icon: '📏' },
  { value: 'material_defect', label: 'Material Defect', icon: '🪵' },
  { value: 'tool_problem', label: 'Tool Problem', icon: '🔧' },
  { value: 'technique_issue', label: 'Technique Issue', icon: '🤔' },
  { value: 'safety_concern', label: 'Safety Concern', icon: '⚠️' },
  { value: 'design_flaw', label: 'Design Flaw', icon: '📐' },
  { value: 'other', label: 'Other', icon: '❓' }
];

const severityConfig = {
  low: { color: 'blue', textColor: 'text-blue-600', bgColor: 'bg-blue-100', icon: InformationCircleIcon },
  medium: { color: 'yellow', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: ExclamationTriangleIcon },
  high: { color: 'red', textColor: 'text-red-600', bgColor: 'bg-red-100', icon: ExclamationCircleIcon },
  critical: { color: 'red', textColor: 'text-red-800', bgColor: 'bg-red-200', icon: ExclamationCircleIcon }
};

const statusConfig = {
  open: { color: 'red', textColor: 'text-red-600', bgColor: 'bg-red-100', label: 'Open' },
  in_progress: { color: 'yellow', textColor: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'In Progress' },
  resolved: { color: 'green', textColor: 'text-green-600', bgColor: 'bg-green-100', label: 'Resolved' },
  ignored: { color: 'gray', textColor: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Ignored' }
};

export default function IssueTracker({ projectId, issues, photos, onIssuesUpdate }: IssueTrackerProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingIssue, setEditingIssue] = useState<Issue | null>(null);
  const [expandedIssue, setExpandedIssue] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    issueType: 'other',
    description: '',
    severity: 'medium' as Issue['severity'],
    photoId: '',
    resolution: ''
  });

  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

  // Filter issues
  const filteredIssues = issues.filter(issue => {
    const matchesSearch = issue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         issue.resolution?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || issue.status === filterStatus;
    const matchesSeverity = filterSeverity === 'all' || issue.severity === filterSeverity;
    
    return matchesSearch && matchesStatus && matchesSeverity;
  });

  // Group issues by status
  const groupedIssues = {
    open: filteredIssues.filter(i => i.status === 'open'),
    in_progress: filteredIssues.filter(i => i.status === 'in_progress'),
    resolved: filteredIssues.filter(i => i.status === 'resolved'),
    ignored: filteredIssues.filter(i => i.status === 'ignored')
  };

  const handleOpenDialog = (issue?: Issue) => {
    if (issue) {
      setEditingIssue(issue);
      setFormData({
        issueType: issue.issueType,
        description: issue.description,
        severity: issue.severity,
        photoId: issue.photoId || '',
        resolution: issue.resolution || ''
      });
    } else {
      setEditingIssue(null);
      setFormData({
        issueType: 'other',
        description: '',
        severity: 'medium',
        photoId: '',
        resolution: ''
      });
    }
    setShowAddDialog(true);
  };

  const handleCloseDialog = () => {
    setShowAddDialog(false);
    setEditingIssue(null);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (editingIssue) {
        await axios.put(
          `${apiUrl}/diy/issues/${editingIssue.id}`,
          {
            ...formData,
            status: formData.resolution ? 'resolved' : editingIssue.status,
            resolvedAt: formData.resolution ? new Date().toISOString() : null
          },
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      } else {
        await axios.post(
          `${apiUrl}/diy/projects/${projectId}/issues`,
          formData,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
      }
      
      handleCloseDialog();
      onIssuesUpdate();
    } catch (error) {
      console.error('Error saving issue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (issueId: string, newStatus: string) => {
    try {
      await axios.put(
        `${apiUrl}/diy/issues/${issueId}`,
        { 
          status: newStatus,
          resolvedAt: newStatus === 'resolved' ? new Date().toISOString() : null
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      onIssuesUpdate();
    } catch (error) {
      console.error('Error updating issue status:', error);
    }
  };

  const handleDelete = async (issueId: string) => {
    if (window.confirm('Are you sure you want to delete this issue?')) {
      try {
        await axios.delete(
          `${apiUrl}/diy/issues/${issueId}`,
          {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          }
        );
        onIssuesUpdate();
      } catch (error) {
        console.error('Error deleting issue:', error);
      }
    }
  };

  const getPhotoById = (photoId: string) => {
    return photos.find(p => p.id === photoId);
  };

  const renderIssueCard = (issue: Issue) => {
    const isExpanded = expandedIssue === issue.id;
    const photo = issue.photoId ? getPhotoById(issue.photoId) : null;
    const suggestions = issue.aiSuggestions ? JSON.parse(issue.aiSuggestions) : [];
    const SeverityIcon = severityConfig[issue.severity].icon;
    const issueType = issueTypes.find(t => t.value === issue.issueType);

    return (
      <div key={issue.id} className="bg-white dark:bg-gray-800 rounded-lg shadow mb-4">
        <div className="p-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg font-medium">
                  {issueType?.icon} {issueType?.label || issue.issueType}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${severityConfig[issue.severity].bgColor} ${severityConfig[issue.severity].textColor}`}>
                  <SeverityIcon className="h-3 w-3 inline mr-1" />
                  {issue.severity}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[issue.status].bgColor} ${statusConfig[issue.status].textColor}`}>
                  {statusConfig[issue.status].label}
                </span>
                {issue.aiDetected && (
                  <span className="px-2 py-1 rounded-full text-xs font-medium border border-purple-300 text-purple-600 bg-purple-50">
                    <LightBulbIcon className="h-3 w-3 inline mr-1" />
                    AI Detected
                  </span>
                )}
              </div>
              
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                {issue.description}
              </p>

              {issue.resolution && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-2">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Resolution:</strong> {issue.resolution}
                  </p>
                </div>
              )}

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Created: {new Date(issue.createdAt).toLocaleDateString()}</span>
                {issue.resolvedAt && (
                  <span>Resolved: {new Date(issue.resolvedAt).toLocaleDateString()}</span>
                )}
              </div>
            </div>

            {photo && (
              <img
                src={photo.thumbnailPath || photo.filePath}
                alt="Issue photo"
                className="w-24 h-24 object-cover rounded-lg ml-4"
              />
            )}
          </div>

          {/* Expandable Section */}
          {(suggestions.length > 0 || issue.status !== 'resolved') && (
            <div className="mt-4">
              <button
                onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                className="flex items-center text-sm text-blue-600 hover:text-blue-700"
              >
                {isExpanded ? <ChevronUpIcon className="h-4 w-4 mr-1" /> : <ChevronDownIcon className="h-4 w-4 mr-1" />}
                {isExpanded ? 'Hide' : 'Show'} Details
              </button>
              
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  {suggestions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">AI Suggestions:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {suggestions.map((suggestion: string, index: number) => (
                          <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                            {suggestion}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {issue.status !== 'resolved' && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium">Change Status:</label>
                      <select
                        value={issue.status}
                        onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                        className="px-3 py-1 border rounded-lg text-sm dark:bg-gray-700"
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="ignored">Ignored</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        <div className="border-t dark:border-gray-700 px-4 py-2 flex justify-end gap-2">
          <button
            onClick={() => handleOpenDialog(issue)}
            className="p-1 text-gray-600 hover:text-gray-900"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => handleDelete(issue.id)}
            className="p-1 text-red-600 hover:text-red-900"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Open Issues</p>
              <p className="text-3xl font-bold text-red-600">{groupedIssues.open.length}</p>
            </div>
            <ExclamationCircleIcon className="h-10 w-10 text-red-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{groupedIssues.in_progress.length}</p>
            </div>
            <WrenchIcon className="h-10 w-10 text-yellow-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Resolved</p>
              <p className="text-3xl font-bold text-green-600">{groupedIssues.resolved.length}</p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Critical Issues</p>
              <p className="text-3xl font-bold text-red-800">
                {issues.filter(i => i.severity === 'critical' && i.status !== 'resolved').length}
              </p>
            </div>
            <ExclamationTriangleIcon className="h-10 w-10 text-red-800" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search issues..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700"
          >
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>

          <button
            onClick={() => handleOpenDialog()}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Report Issue
          </button>
        </div>
      </div>

      {/* Issues List */}
      {filteredIssues.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
          <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-lg font-medium text-gray-600 dark:text-gray-400">
            No issues found
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            {searchTerm || filterStatus !== 'all' || filterSeverity !== 'all'
              ? 'Try adjusting your filters'
              : 'Great! No issues reported for this project'}
          </p>
        </div>
      ) : (
        <div>
          {Object.entries(groupedIssues).map(([status, statusIssues]) => {
            if (statusIssues.length === 0) return null;
            
            return (
              <div key={status} className="mb-6">
                <h3 className={`text-lg font-semibold mb-3 ${statusConfig[status as keyof typeof statusConfig].textColor}`}>
                  {statusConfig[status as keyof typeof statusConfig].label} ({statusIssues.length})
                </h3>
                {statusIssues.map(issue => renderIssueCard(issue))}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      {showAddDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingIssue ? 'Edit Issue' : 'Report New Issue'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Issue Type</label>
                  <select
                    value={formData.issueType}
                    onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    {issueTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Severity</label>
                  <select
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value as Issue['severity'] })}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {photos.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Related Photo</label>
                    <select
                      value={formData.photoId}
                      onChange={(e) => setFormData({ ...formData, photoId: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                    >
                      <option value="">None</option>
                      {photos.map(photo => (
                        <option key={photo.id} value={photo.id}>
                          {photo.caption || `Photo ${photos.indexOf(photo) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {editingIssue && (
                  <div>
                    <label className="block text-sm font-medium mb-1">Resolution (if resolved)</label>
                    <textarea
                      value={formData.resolution}
                      onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
                      rows={2}
                      placeholder="Describe how this issue was resolved..."
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={handleCloseDialog}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!formData.description || isLoading}
                  className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : (editingIssue ? 'Update' : 'Report')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}